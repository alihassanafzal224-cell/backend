import jwt from "jsonwebtoken";
import { User } from "../src/models/usermodel.js";

const socketAuth = async (socket, next) => {
  try {
    
    // 1️⃣ Get token (same sources as HTTP)
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1] ||
      socket.handshake.headers?.cookie
        ?.split("; ")
        .find(c => c.startsWith("token="))
        ?.split("=")[1];

    if (!token) return next(new Error("Authentication token missing"));

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Load user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));

    // 4️⃣ Attach user to socket
    socket.user = user;

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
};

export default socketAuth;
