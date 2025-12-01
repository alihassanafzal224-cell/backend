import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import { logger, errorHandler, rateLimiter } from '../middleware/index.js';

const app = express();

// Security / parsing
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Instrumentation
app.use(logger);
app.use(rateLimiter());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Centralized error handler (after routes)
app.use(errorHandler);

export default app;