import dotenv from 'dotenv'
import connectDatabase from './config/database.js';
import app from './app.js';

dotenv.config({
    path: './.env' 
});

const startServer = async() => {
    try{
        await connectDatabase()
        app.on("error",(error) => {
            console.error("Error in server:", error)
        })
        app.listen(process.env.PORT||8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })

    }catch(error){
        console.error("Failed to connect to the database:", error)
    }
}
startServer()