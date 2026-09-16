import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { RechargeService } from '../services/rechargeService.js';

const router = Router();

// GET /api/recharge/plans
router.get('/plans', (req, res) => {
  try {
    const plans = RechargeService.getPlans();
    res.json({
      success: true,
      notice: 'PROTOTYPE DISCLAIMER: Virtual Recharge uses earned reward coins for simulated prototype cellular refills. Real telecom balances are not modified.',
      data: plans
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/recharge or POST /api/recharge/execute
const handleRechargeExecution = (req: any, res: any) => {
  try {
    const { phone, operator, planId } = req.body;
    if (!phone || !operator || !planId) {
      res.status(400).json({
        success: false,
        message: 'Phone number, operator, and planId are required for virtual recharge.'
      });
      return;
    }

    const tx = RechargeService.executeRecharge({
      userId: req.user!.id,
      phone: String(phone),
      operator: String(operator),
      planId: String(planId)
    });

    res.json({
      success: true,
      message: 'Virtual mobile recharge completed successfully! (Demo Prototype)',
      data: tx
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

router.post('/', authMiddleware, handleRechargeExecution);
router.post('/execute', authMiddleware, handleRechargeExecution);

// GET /api/recharge/transactions
router.get('/transactions', authMiddleware, (req, res) => {
  try {
    const history = RechargeService.getRechargeHistory(req.user!.id);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
