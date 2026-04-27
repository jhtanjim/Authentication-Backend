// src\config\database.js database connect korar jnnw
import mongoose from "mongoose";
import config from "./config.js";

export const connectDB=async()=>{
await mongoose.connect(config.MONGO_URI)
console.log("CONNECTED TO DB")
}