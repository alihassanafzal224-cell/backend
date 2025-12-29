import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import app from "./app.js";
import cloudinary  from "./config/cloudinary.js";

dotenv.config();


const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on port ${process.env.PORT || 8000}`);
        });

        // Cloudinary upload example
        const uploadResult = await cloudinary.uploader
            .upload(
                "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
                { public_id: "shoes" }
            )
            .catch((error) => console.log("Upload error:", error));

        // Optimized delivery URL
        const optimizeUrl = cloudinary.url("shoes", {
            fetch_format: "auto",
            quality: "auto",
        });

        // Auto-crop and transform image
        const autoCropUrl = cloudinary.url("shoes", {
            crop: "fill",
            gravity: "auto",
            width: 500,
            height: 500,
        });
        

    } catch (error) {
        console.error("Server error:", error);
    }
};

startServer();
