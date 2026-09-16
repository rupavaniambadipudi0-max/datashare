import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { TransferService } from '../services/transferService.js';
import { RequestService } from '../services/requestService.js';

const router = Router();

// POST /api/data/send
router.post('/send', authMiddleware, (req, res) => {
  try {
    const { receiverPhone, amountMB, message, idempotencyKey } = req.body;
    if (!receiverPhone || !amountMB) {
      res.status(400).json({
        success: false,
        message: 'receiverPhone and amountMB are required.',
        errorCode: 'MISSING_FIELDS'
      });
      return;
    }

    const keyHeader = (req.headers['x-idempotency-key'] as string) || idempotencyKey;

    const result = TransferService.executePeerTransfer({
      senderId: req.user!.id,
      receiverPhone: String(receiverPhone),
      amountMB: Number(amountMB),
      message,
      idempotencyKey: keyHeader
    });

    res.json({
      success: true,
      message: 'Mobile data transferred successfully!',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
      errorCode: 'TRANSFER_FAILED'
    });
  }
});

// POST /api/data/requests - Create request
router.post('/requests', authMiddleware, (req, res) => {
  try {
    const { targetPhone, amountMB, note } = req.body;
    if (!targetPhone || !amountMB) {
      res.status(400).json({
        success: false,
        message: 'targetPhone and amountMB are required.'
      });
      return;
    }

    const request = RequestService.createRequest({
      requesterId: req.user!.id,
      targetPhone: String(targetPhone),
      amountMB: Number(amountMB),
      note
    });

    res.status(201).json({
      success: true,
      message: 'Data request sent successfully.',
      data: request
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/data/requests/incoming
router.get('/requests/incoming', authMiddleware, (req, res) => {
  try {
    const incoming = RequestService.getIncomingRequests(req.user!.id);
    res.json({ success: true, data: incoming });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/data/requests/outgoing
router.get('/requests/outgoing', authMiddleware, (req, res) => {
  try {
    const outgoing = RequestService.getOutgoingRequests(req.user!.id);
    res.json({ success: true, data: outgoing });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/data/requests/:id/accept
router.post('/requests/:id/accept', authMiddleware, (req, res) => {
  try {
    const result = RequestService.acceptRequest(req.params.id, req.user!.id);
    res.json({
      success: true,
      message: 'Data request accepted and data sent successfully!',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/data/requests/:id/reject
router.post('/requests/:id/reject', authMiddleware, (req, res) => {
  try {
    const result = RequestService.rejectRequest(req.params.id, req.user!.id);
    res.json({
      success: true,
      message: 'Data request declined.',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/data/requests/:id/cancel
router.post('/requests/:id/cancel', authMiddleware, (req, res) => {
  try {
    const result = RequestService.cancelRequest(req.params.id, req.user!.id);
    res.json({
      success: true,
      message: 'Data request cancelled.',
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
