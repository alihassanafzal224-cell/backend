import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import { logger, errorHandler, rateLimiter } from '../middleware/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use(logger);
app.use(rateLimiter());


app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(errorHandler);

export default app;