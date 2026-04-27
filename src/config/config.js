// jotokkn eta import kore call korbona ttwkkn .env te joto varibale raksi eta access kra jabena
//src\config\config.js
import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];

requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`${key} is not defined in environment variable`);
    }
});

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || "development"
};

export default config;