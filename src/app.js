import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import statusRoutes from "./routes/status.route.js"
import { logger, errorHandler, rateLimiter } from '../middleware/index.js';
import conversationRoutes from "./routes/conversation.route.js"
import messageRoutes from "./routes/message.route.js"

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Middleware
app.use(logger);
app.use(rateLimiter());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/status', statusRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// Error handler
app.use(errorHandler);

export default app;
