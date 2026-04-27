// inside app.js create server basic configuraton
// src\app.js

import cookieParser from "cookie-parser"
import express from "express"
import morgan from "morgan"
import authRouter from "./routes/auth.routes.js"

const app = express()

// middleware
app.use(express.json())
app.use(morgan("dev"))
// use cookie perseer
app.use(cookieParser());
// api create for auth prefix use api/auth
app.use("/api/auth", authRouter)

export default app