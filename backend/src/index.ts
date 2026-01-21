import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { uploadRouter } from './routes/upload';
import { chatRouter } from './routes/chat';
import { usersRouter } from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// For development, allow all origins (be more restrictive in production)
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/events', eventsRouter);
app.use('/upload', uploadRouter);
app.use('/chat', chatRouter);
app.use('/users', usersRouter);

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
