import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";

const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

// ================= REGISTER =================
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const exists = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (exists) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        const refreshToken = jwt.sign(
            { id: user._id },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        const accessToken = jwt.sign(
            { id: user._id, sessionId: session._id },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(201).json({
            message: "Registered successfully",
            user: { username, email },
            accessToken
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// ================= LOGIN =================
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const refreshToken = jwt.sign(
            { id: user._id },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        const accessToken = jwt.sign(
            { id: user._id, sessionId: session._id },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            message: "Login successful",
            user: { username: user.username, email: user.email },
            accessToken
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// ================= GET ME =================
export const getMe = async (req, res) => {
    const user = await userModel.findById(req.user.id).select("-password");
    return res.json({ user });
};

// ================= REFRESH TOKEN =================
export const refreshToken = async (req, res) => {
    try {
        const oldToken = req.cookies?.refreshToken;

        if (!oldToken) {
            return res.status(401).json({ message: "No refresh token" });
        }

        const decoded = jwt.verify(oldToken, config.JWT_SECRET);

        const hash = crypto.createHash("sha256").update(oldToken).digest("hex");

        const session = await sessionModel.findOne({
            refreshTokenHash: hash,
            revoked: false
        });

        if (!session) {
            return res.status(401).json({ message: "Invalid session" });
        }

        const accessToken = jwt.sign(
            { id: decoded.id, sessionId: session._id },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({ accessToken });

    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(400).json({ message: "No refresh token found" });
        }

        const hash = crypto.createHash("sha256").update(token).digest("hex");

        await sessionModel.updateOne(
            { refreshTokenHash: hash },
            { revoked: true }
        );

        res.clearCookie("refreshToken");

        return res.json({ message: "Logged out" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// ================= LOGOUT ALL =================
export const logoutAll = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(400).json({ message: "No refresh token found" });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        await sessionModel.updateMany(
            { user: decoded.id },
            { revoked: true }
        );

        res.clearCookie("refreshToken");

        return res.json({ message: "Logged out all devices" });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};