import express from 'express';
import { apiRouter } from '../server/routes/api';
import { connectToDatabase } from '../server/db';

const app = express();

app.use(express.json());

app.use(async (_req, res, next) => {
  const result = await connectToDatabase();
  if (!result.isConnected) {
    return res.status(503).json({
      ok: false,
      error: result.error || 'MongoDB is unavailable',
    });
  }
  next();
});

// Vercel strips the /api function prefix before invoking this handler.
app.use(apiRouter);

export default app;
