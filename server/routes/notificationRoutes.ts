import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { NotificationService } from '../services/notificationService.js';

const router = Router();

// GET /api/notifications
router.get('/', authMiddleware, (req, res) => {
  try {
    const list = NotificationService.getNotifications(req.user!.id);
    const unreadCount = NotificationService.getUnreadCount(req.user!.id);
    res.json({
      success: true,
      data: {
        notifications: list,
        unreadCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const unreadCount = NotificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, count: unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', authMiddleware, (req, res) => {
  try {
    const success = NotificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authMiddleware, (req, res) => {
  try {
    const count = NotificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, markedCount: count });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
