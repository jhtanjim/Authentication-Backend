// src/controllers/auth.controller.js

import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";


// =============================
// REGISTER
// =============================
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check existing user
        const isAlreadyExist = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (isAlreadyExist) {
            return res.status(409).json({
                message: "Username or Email already exists"
            });
        }

        // Hash password
        const hashedPassword = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");

        // Create user
        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        // Create Refresh Token
        const refreshToken = jwt.sign(
            {
                id: user._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Hash Refresh Token (NOT password)
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // Create session
        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        // Create Access Token
        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Save refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                username: user.username,
                email: user.email
            },
            accessToken
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =============================
// LOGIN
// =============================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required"
            });
        }

        // Find user by email
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Hash password
        const hashedPassword = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");

        // Compare password
        const isPasswordMatch = user.password === hashedPassword;

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        // Create Refresh Token
        const refreshToken = jwt.sign(
            {
                id: user._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Hash Refresh Token
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // Create session
        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        // Create Access Token
        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Save refresh token in cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                username: user.username,
                email: user.email
            },
            accessToken
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};





// =============================
// GET ME
// =============================
export const getMe = async (req, res) => {
    try {
        // Authorization: Bearer token_here
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token not found"
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            config.JWT_SECRET
        );

        // Find user
        const user = await userModel
            .findById(decoded.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};


// =============================
// REFRESH TOKEN
// =============================
export const refreshToken = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies?.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({
                message: "Refresh Token not found"
            });
        }

        // Verify old refresh token
        const decoded = jwt.verify(
            oldRefreshToken,
            config.JWT_SECRET
        );

        // Hash old refresh token
        const oldRefreshTokenHash = crypto
            .createHash("sha256")
            .update(oldRefreshToken)
            .digest("hex");

        // Find valid session
        const session = await sessionModel.findOne({
            refreshTokenHash: oldRefreshTokenHash,
            revoked: false
        });

        if (!session) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        // Create new access token
        const accessToken = jwt.sign(
            {
                id: decoded.id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Create new refresh token (rotation)
        const newRefreshToken = jwt.sign(
            {
                id: decoded.id
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Hash new refresh token
        const newRefreshTokenHash = crypto
            .createHash("sha256")
            .update(newRefreshToken)
            .digest("hex");

        // Update session with new hash
        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();

        // Update cookie with new refresh token
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Access token refreshed successfully",
            accessToken
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid refresh token"
        });
    }
};


// =============================
// LOGOUT
// =============================
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh Token not found"
            });
        }

        // Hash refresh token
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // Find active session
        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        });

        if (!session) {
            return res.status(400).json({
                message: "Session not found"
            });
        }

        // Revoke session
        session.revoked = true;
        await session.save();

        // Clear cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// =============================
// LOGOUT ALL DEVICES
// =============================

export const logoutAll = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh Token not found"
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            config.JWT_SECRET
        );

        // Revoke all sessions of this user
        await sessionModel.updateMany(
            {
                user: decoded.id,
                revoked: false
            },
            {
                $set: {
                    revoked: true
                }
            }
        );

        // Clear cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "Logged out from all devices successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};