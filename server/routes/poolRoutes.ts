import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { PoolService } from '../services/poolService.js';
import { query } from '../db/database.js';

const router = Router();

// GET /api/pool/status
router.get('/status', (req, res) => {
  try {
    const pool = PoolService.getPool();
    // Get recent pool transactions
    const recentActivity = query(
      `SELECT t.transactionId, t.type, t.amountMB, t.createdAt,
              u.fullName as userName, u.phone as userPhone
       FROM transactions t
       LEFT JOIN users u ON (t.senderId = u.id OR t.receiverId = u.id)
       WHERE t.type IN ('POOL_CONTRIBUTION', 'POOL_WITHDRAWAL')
       ORDER BY t.createdAt DESC
       LIMIT 10;`
    );

    res.json({
      success: true,
      data: {
        pool,
        recentActivity
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pool/contribute
router.post('/contribute', authMiddleware, (req, res) => {
  try {
    const { amountMB } = req.body;
    if (!amountMB) {
      res.status(400).json({ success: false, message: 'amountMB is required.' });
      return;
    }

    const result = PoolService.contribute(req.user!.id, Number(amountMB));
    res.json({
      success: true,
      message: 'Thank you for contributing to the Community Data Pool!',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/pool/withdraw
router.post('/withdraw', authMiddleware, (req, res) => {
  try {
    const { amountMB } = req.body;
    if (!amountMB) {
      res.status(400).json({ success: false, message: 'amountMB is required.' });
      return;
    }

    const result = PoolService.withdraw(req.user!.id, Number(amountMB));
    res.json({
      success: true,
      message: 'Data successfully withdrawn from the community pool!',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
