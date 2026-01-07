import dotenv from "dotenv";
import connectDatabase from "./config/database.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket.js"; 

dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
   
    await connectDatabase();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: true, 
        credentials: true
      }
    });
    initSocket(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
};

startServer();
