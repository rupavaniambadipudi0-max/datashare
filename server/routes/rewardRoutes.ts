import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { RewardService } from '../services/rewardService.js';

const router = Router();

// GET /api/rewards/catalog
router.get('/catalog', (req, res) => {
  try {
    const category = req.query.category as string;
    const items = RewardService.getCatalog(category);
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rewards/redeem
router.post('/redeem', authMiddleware, (req, res) => {
  try {
    const { rewardId } = req.body;
    if (!rewardId) {
      res.status(400).json({ success: false, message: 'rewardId is required.' });
      return;
    }

    const redemption = RewardService.redeem(req.user!.id, rewardId);
    res.json({
      success: true,
      message: 'Reward voucher redeemed successfully!',
      data: redemption
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/rewards/my-redemptions
router.get('/my-redemptions', authMiddleware, (req, res) => {
  try {
    const redemptions = RewardService.getUserRedemptions(req.user!.id);
    res.json({ success: true, data: redemptions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
