// src\models\session.model.js

import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "users",
        required: [true, "User is required"]
    },
    refreshTokenHash: {
        type: String,
        required: [true, "RefreshToken Hash is required"]

    },
    ip: {
        type: String,
        required: [true, "Ip Address Hash is required"]
    },

    // kon browser teke req dse
    userAgent: {
        type: String,
        required: [true, "User Agent Hash is required"]
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})


const sessionModel = mongoose.model("sessions", sessionSchema)
export default sessionModel