import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { AdminService } from '../services/adminService.js';
import { FraudService } from '../services/fraudService.js';
import { query } from '../db/database.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/admin/metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = AdminService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  try {
    const users = AdminService.listUsers();
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/users/:id/status
router.post('/users/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Valid status (ACTIVE/SUSPENDED) required.' });
      return;
    }
    AdminService.toggleUserStatus(req.params.id, status);
    res.json({ success: true, message: `User status changed to ${status}` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/admin/transactions
router.get('/transactions', (req, res) => {
  try {
    const txs = query(
      `SELECT t.*,
              u_send.fullName as senderName, u_send.phone as senderPhone,
              u_recv.fullName as receiverName, u_recv.phone as receiverPhone
       FROM transactions t
       LEFT JOIN users u_send ON t.senderId = u_send.id
       LEFT JOIN users u_recv ON t.receiverId = u_recv.id
       ORDER BY t.createdAt DESC LIMIT 100;`
    );
    res.json({ success: true, data: txs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/settings
router.get('/settings', (req, res) => {
  try {
    const settings = AdminService.getSystemSettings();
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/settings
router.post('/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ success: false, message: 'key and value are required.' });
      return;
    }
    AdminService.updateSystemSetting(key, String(value));
    res.json({ success: true, message: `Updated setting ${key}` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/admin/fraud-alerts
router.get('/fraud-alerts', (req, res) => {
  try {
    const alerts = FraudService.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/fraud-alerts/:id/status
router.post('/fraud-alerts/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'status is required.' });
      return;
    }
    FraudService.updateAlertStatus(req.params.id, status);
    res.json({ success: true, message: 'Fraud alert updated.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/admin/rewards
router.post('/rewards', (req, res) => {
  try {
    const { name, category, description, coinCost, cashValue, stock, imageUrl, terms } = req.body;
    if (!name || !category || !coinCost || !stock) {
      res.status(400).json({ success: false, message: 'name, category, coinCost, and stock are required.' });
      return;
    }
    const created = AdminService.createReward({
      name,
      category,
      description: description || '',
      coinCost: Number(coinCost),
      cashValue: Number(cashValue) || 0,
      stock: Number(stock),
      imageUrl,
      terms
    });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/admin/rewards/:id/stock
router.post('/rewards/:id/stock', (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || Number(stock) < 0) {
      res.status(400).json({ success: false, message: 'Valid stock number required.' });
      return;
    }
    AdminService.updateRewardStock(req.params.id, Number(stock));
    res.json({ success: true, message: 'Reward inventory updated.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
