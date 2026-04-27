import mongoose from "mongoose";
import config from "./config.js";

export const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("CONNECTED TO DB");
    } catch (err) {
        console.error("DB CONNECTION FAILED", err.message);
        process.exit(1);
    }
};