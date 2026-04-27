// src\models\user.model.js
// user data kirkm hbe eta model a likte hoi
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username must be Unique"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email must be Unique"]
    },
    password: {
        type: String,
        required: [true, "password is required"],
    }
})

const userModel = mongoose.model("users", userSchema)
export default userModel