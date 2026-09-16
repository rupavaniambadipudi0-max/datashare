import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db/database.js';
import { realtimeService } from './server/services/realtimeService.js';
import { JWT_SECRET } from './server/middleware/authMiddleware.js';

import authRoutes from './server/routes/authRoutes.js';
import walletRoutes from './server/routes/walletRoutes.js';
import dataRoutes from './server/routes/dataRoutes.js';
import poolRoutes from './server/routes/poolRoutes.js';
import coinRoutes from './server/routes/coinRoutes.js';
import rechargeRoutes from './server/routes/rechargeRoutes.js';
import rewardRoutes from './server/routes/rewardRoutes.js';
import transactionRoutes from './server/routes/transactionRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  // Ensure SQLite database is loaded and schemas initialized
  await getDb();

  const app = express();

  // Basic middlewares
  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DataShare Platform API',
      timestamp: new Date().toISOString()
    });
  });

  // Real-time Server-Sent Events (SSE) endpoint
  app.get('/api/realtime', (req, res) => {
    const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'Token required for SSE connection' });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      res.write(': connected\n\n');
      realtimeService.registerClient(decoded.userId, res);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/data', dataRoutes);
  app.use('/api/pool', poolRoutes);
  app.use('/api/coins', coinRoutes);
  app.use('/api/recharge', rechargeRoutes);
  app.use('/api/rewards', rewardRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  // Vite middleware in dev / static server in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[DataShare Server] Running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DataShare Server] Fatal error during startup:', err);
  process.exit(1);
});
