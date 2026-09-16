import { query, queryOne, run } from '../db/database.js';
import { TransferService } from './transferService.js';
import { NotificationService } from './notificationService.js';
import { realtimeService } from './realtimeService.js';

export interface DataRequestRecord {
  id: string;
  requesterId: string;
  requesterName?: string;
  requesterPhone?: string;
  targetPhone: string;
  targetUserId: string | null;
  targetName?: string;
  amountMB: number;
  note: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export class RequestService {
  public static createRequest(params: {
    requesterId: string;
    targetPhone: string;
    amountMB: number;
    note?: string;
  }): DataRequestRecord {
    const { requesterId, targetPhone, amountMB, note } = params;

    if (!amountMB || amountMB <= 0 || !Number.isInteger(amountMB)) {
      throw new Error('Requested amount must be a positive integer in MB.');
    }

    const requester = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE id = ?;',
      [requesterId]
    );
    if (!requester) {
      throw new Error('Requester account not found.');
    }

    const cleanTargetPhone = targetPhone.trim().replace(/[^0-9]/g, '');
    if (cleanTargetPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    if (cleanTargetPhone === requester.phone.replace(/[^0-9]/g, '')) {
      throw new Error('You cannot request mobile data from yourself.');
    }

    // Lookup target user if registered
    const targetUser = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE phone = ?;',
      [cleanTargetPhone]
    );

    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    // 48 hours expiry
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    run(
      `INSERT INTO data_requests (id, requesterId, targetPhone, targetUserId, amountMB, note, status, expiresAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?);`,
      [id, requesterId, cleanTargetPhone, targetUser ? targetUser.id : null, amountMB, note || null, expiresAt, now, now]
    );

    const formattedData = amountMB >= 1024
      ? `${(amountMB / 1024).toFixed(amountMB % 1024 === 0 ? 0 : 1)} GB`
      : `${amountMB} MB`;

    // Notify target user if registered
    if (targetUser) {
      NotificationService.create({
        userId: targetUser.id,
        title: 'New Data Request',
        message: `${requester.fullName} (${requester.phone}) is requesting ${formattedData} data.`,
        type: 'DATA_REQUEST',
        link: '/my-requests'
      });
      realtimeService.emitToUser(targetUser.id, 'REQUEST_CREATED', {
        requestId: id,
        requester: requester.fullName,
        amountMB
      });
    }

    return this.getRequestById(id)!;
  }

  public static getRequestById(id: string): DataRequestRecord | null {
    return queryOne<DataRequestRecord>(
      `SELECT r.*,
              u1.fullName as requesterName, u1.phone as requesterPhone,
              u2.fullName as targetName
       FROM data_requests r
       JOIN users u1 ON r.requesterId = u1.id
       LEFT JOIN users u2 ON r.targetUserId = u2.id
       WHERE r.id = ?;`,
      [id]
    );
  }

  public static getIncomingRequests(userId: string): DataRequestRecord[] {
    const user = queryOne<{ phone: string }>('SELECT phone FROM users WHERE id = ?;', [userId]);
    if (!user) return [];

    return query<DataRequestRecord>(
      `SELECT r.*,
              u1.fullName as requesterName, u1.phone as requesterPhone
       FROM data_requests r
       JOIN users u1 ON r.requesterId = u1.id
       WHERE (r.targetUserId = ? OR r.targetPhone = ?)
       ORDER BY r.createdAt DESC;`,
      [userId, user.phone]
    );
  }

  public static getOutgoingRequests(userId: string): DataRequestRecord[] {
    return query<DataRequestRecord>(
      `SELECT r.*,
              u2.fullName as targetName
       FROM data_requests r
       LEFT JOIN users u2 ON r.targetUserId = u2.id
       WHERE r.requesterId = ?
       ORDER BY r.createdAt DESC;`,
      [userId]
    );
  }

  public static acceptRequest(requestId: string, targetUserId: string): any {
    const request = this.getRequestById(requestId);
    if (!request) {
      throw new Error('Data request not found.');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot accept request with status '${request.status}'. It may have already been resolved.`);
    }

    const acceptor = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE id = ?;',
      [targetUserId]
    );
    if (!acceptor) {
      throw new Error('Acceptor user not found.');
    }

    // Verify authorization: either request.targetUserId == targetUserId OR request.targetPhone matches acceptor's phone
    if (request.targetUserId && request.targetUserId !== targetUserId) {
      throw new Error('Unauthorized. You are not the intended recipient of this request.');
    }
    if (request.targetPhone !== acceptor.phone) {
      throw new Error('Unauthorized. Phone number does not match this request.');
    }

    const requester = queryOne<{ id: string; phone: string; fullName: string }>(
      'SELECT id, phone, fullName FROM users WHERE id = ?;',
      [request.requesterId]
    );
    if (!requester) {
      throw new Error('Requester user not found.');
    }

    // Execute transfer from acceptor to requester
    const transferResult = TransferService.executePeerTransfer({
      senderId: targetUserId,
      receiverPhone: requester.phone,
      amountMB: request.amountMB,
      message: `Accepted request #${requestId}`,
      requestId: requestId
    });

    // Update request status to ACCEPTED
    const now = new Date().toISOString();
    run(
      `UPDATE data_requests
       SET status = 'ACCEPTED', updatedAt = ?
       WHERE id = ?;`,
      [now, requestId]
    );

    const formattedData = request.amountMB >= 1024
      ? `${(request.amountMB / 1024).toFixed(request.amountMB % 1024 === 0 ? 0 : 1)} GB`
      : `${request.amountMB} MB`;

    NotificationService.create({
      userId: request.requesterId,
      title: 'Data Request Accepted!',
      message: `${acceptor.fullName} accepted your request and sent you ${formattedData} mobile data!`,
      type: 'REQUEST_ACCEPTED',
      link: '/data-wallet'
    });

    realtimeService.emitToUser(request.requesterId, 'REQUEST_ACCEPTED', {
      requestId,
      acceptedBy: acceptor.fullName,
      amountMB: request.amountMB
    });

    return {
      request: this.getRequestById(requestId),
      transfer: transferResult
    };
  }

  public static rejectRequest(requestId: string, targetUserId: string): DataRequestRecord {
    const request = this.getRequestById(requestId);
    if (!request) {
      throw new Error('Data request not found.');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot reject request with status '${request.status}'.`);
    }

    const rejector = queryOne<{ id: string; fullName: string; phone: string }>(
      'SELECT id, fullName, phone FROM users WHERE id = ?;',
      [targetUserId]
    );
    if (!rejector) {
      throw new Error('User not found.');
    }

    if (request.targetUserId && request.targetUserId !== targetUserId && request.targetPhone !== rejector.phone) {
      throw new Error('Unauthorized to reject this request.');
    }

    const now = new Date().toISOString();
    run("UPDATE data_requests SET status = 'REJECTED', updatedAt = ? WHERE id = ?;", [now, requestId]);

    NotificationService.create({
      userId: request.requesterId,
      title: 'Data Request Declined',
      message: `${rejector.fullName} declined your request for ${request.amountMB} MB data.`,
      type: 'REQUEST_REJECTED',
      link: '/my-requests'
    });

    realtimeService.emitToUser(request.requesterId, 'REQUEST_REJECTED', {
      requestId,
      rejectedBy: rejector.fullName
    });

    return this.getRequestById(requestId)!;
  }

  public static cancelRequest(requestId: string, requesterId: string): DataRequestRecord {
    const request = this.getRequestById(requestId);
    if (!request) {
      throw new Error('Data request not found.');
    }

    if (request.requesterId !== requesterId) {
      throw new Error('Unauthorized. Only the original requester can cancel a request.');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot cancel request with status '${request.status}'.`);
    }

    const now = new Date().toISOString();
    run("UPDATE data_requests SET status = 'CANCELLED', updatedAt = ? WHERE id = ?;", [now, requestId]);

    return this.getRequestById(requestId)!;
  }
}
