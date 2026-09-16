import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { query, queryOne } from '../db/database.js';

const router = Router();

// GET /api/transactions
router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.id;
    const type = req.query.type as string;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    let sql = `
      SELECT t.*,
             u_send.fullName as senderName, u_send.phone as senderPhone,
             u_recv.fullName as receiverName, u_recv.phone as receiverPhone
      FROM transactions t
      LEFT JOIN users u_send ON t.senderId = u_send.id
      LEFT JOIN users u_recv ON t.receiverId = u_recv.id
      WHERE (t.senderId = ? OR t.receiverId = ?)
    `;
    const params: any[] = [userId, userId];

    if (type && type !== 'ALL') {
      sql += ' AND t.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY t.createdAt DESC LIMIT ?;';
    params.push(limit);

    const rows = query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.id;
    const tx = queryOne(
      `SELECT t.*,
              u_send.fullName as senderName, u_send.phone as senderPhone,
              u_recv.fullName as receiverName, u_recv.phone as receiverPhone
       FROM transactions t
       LEFT JOIN users u_send ON t.senderId = u_send.id
       LEFT JOIN users u_recv ON t.receiverId = u_recv.id
       WHERE (t.id = ? OR t.transactionId = ?) AND (t.senderId = ? OR t.receiverId = ?);`,
      [req.params.id, req.params.id, userId, userId]
    );

    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
      return;
    }

    res.json({ success: true, data: tx });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
