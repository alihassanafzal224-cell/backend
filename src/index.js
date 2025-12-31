import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import app from "./app.js";

dotenv.config();


const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on port ${process.env.PORT || 8000}`);
        })

    } catch (error) {
        console.error("Server error:", error);
    }
};

startServer();
