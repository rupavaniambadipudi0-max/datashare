import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { WalletService } from '../services/walletService.js';
import { query } from '../db/database.js';

const router = Router();

// GET /api/wallet/me - Authoritative wallet
router.get('/me', authMiddleware, (req, res) => {
  try {
    const wallet = WalletService.getWallet(req.user!.id);
    const plan = WalletService.getPlan(req.user!.id);
    res.json({
      success: true,
      data: {
        wallet,
        plan
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/wallet/operators - List available telecom operators
router.get('/operators', (req, res) => {
  try {
    const operators = query('SELECT * FROM operators WHERE status = "ACTIVE";');
    res.json({ success: true, data: operators });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/wallet/simulate-usage - For testing consumption
router.post('/simulate-usage', authMiddleware, (req, res) => {
  try {
    const { consumeMB } = req.body;
    if (!consumeMB || typeof consumeMB !== 'number') {
      res.status(400).json({ success: false, message: 'Valid consumeMB number required.' });
      return;
    }
    const updatedWallet = WalletService.updateUsage(req.user!.id, consumeMB);
    res.json({
      success: true,
      message: `Simulated data usage of ${consumeMB} MB`,
      data: updatedWallet
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
