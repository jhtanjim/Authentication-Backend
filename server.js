// SERVER.JS server run /start and database connect
import app from "./src/app.js"
import { connectDB } from "./src/config/database.js"


// connect database
connectDB()
app.listen(3000, () => {
    console.log("SERVER IS RUNNING ON PORT 3000")
})