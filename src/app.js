import express from 'express';

const app = express();

import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

export default app;