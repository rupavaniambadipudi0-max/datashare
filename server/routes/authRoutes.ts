import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/send-otp
router.post('/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
      return;
    }
    const result = AuthService.sendOtp(phone);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
      return;
    }
    const result = AuthService.verifyOtp(phone, code);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      operatorId,
      planName,
      price,
      startDate,
      endDate,
      totalDataGB,
      usedDataGB,
      shareableDataGB
    } = req.body;

    if (!fullName || !phone || !operatorId) {
      res.status(400).json({
        success: false,
        message: 'Full name, phone, and operator are mandatory for registration.'
      });
      return;
    }

    const result = AuthService.register({
      fullName,
      phone,
      email: email || `${phone}@datashare.local`,
      operatorId,
      planName: planName || 'Standard Mobile Data Plan',
      price: price ? Number(price) : 299,
      startDate,
      endDate,
      totalDataGB: totalDataGB ? Number(totalDataGB) : 10,
      usedDataGB: usedDataGB ? Number(usedDataGB) : 2,
      shareableDataGB: shareableDataGB ? Number(shareableDataGB) : 4
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully with DataShare!',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const userProfile = AuthService.getFullProfile(req.user!.id);
    if (!userProfile) {
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }
    res.json({ success: true, data: userProfile });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
