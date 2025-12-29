import jwt from 'jsonwebtoken';
import { User } from '../src/models/usermodel.js';

const auth = async (req, res, next) => {
  try {
    // Support token from cookie or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: 'Authentication token missing' });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user; // attach user object to request
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default auth;
