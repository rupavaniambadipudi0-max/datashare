import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { CoinService } from '../services/coinService.js';

const router = Router();

// GET /api/coins/balance
router.get('/balance', authMiddleware, (req, res) => {
  try {
    const wallet = CoinService.getWallet(req.user!.id);
    const rate = CoinService.getRewardRate();
    res.json({
      success: true,
      data: {
        wallet,
        rewardRateCoinsPerGB: rate
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/coins/transactions
router.get('/transactions', authMiddleware, (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const history = CoinService.getCoinHistory(req.user!.id, limit);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/coins/spend
router.post('/spend', authMiddleware, (req, res) => {
  try {
    const { amount, description, type } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Valid positive amount required.' });
      return;
    }

    const updated = CoinService.spendCoins({
      userId: req.user!.id,
      amount: Number(amount),
      type: type || 'REWARD_REDEMPTION',
      description: description || 'Coin spend'
    });

    res.json({
      success: true,
      message: `Successfully spent ${amount} coins`,
      data: updated
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
