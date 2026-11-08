import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectToDatabase } from './server/db';
import { apiRouter } from './server/routes/api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body parser
  app.use(express.json());

  // Connect to MongoDB asynchronously
  connectToDatabase().catch(err => {
    console.error('[MongoDB] Database connection failed:', err);
  });

  // REST API Endpoints
  app.use('/api', apiRouter);

  // Mount Vite SPA middlewares in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FocusFlow] Full-Stack server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[FocusFlow] Server initialization failed:', err);
  process.exit(1);
});
