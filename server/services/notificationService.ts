import { query, queryOne, run } from '../db/database.js';
import { realtimeService } from './realtimeService.js';

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: number;
  link: string | null;
  createdAt: string;
}

export class NotificationService {
  public static create(params: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }): NotificationRecord {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    run(
      `INSERT INTO notifications (id, userId, title, message, type, isRead, link, createdAt)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?);`,
      [id, params.userId, params.title, params.message, params.type, params.link || null, now]
    );

    const record = queryOne<NotificationRecord>(
      'SELECT * FROM notifications WHERE id = ?;',
      [id]
    )!;

    // Emit real-time notification to user
    realtimeService.emitToUser(params.userId, 'NOTIFICATION_CREATED', record);

    return record;
  }

  public static getNotifications(userId: string, limit = 50): NotificationRecord[] {
    return query<NotificationRecord>(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?;',
      [userId, limit]
    );
  }

  public static getUnreadCount(userId: string): number {
    const row = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0;',
      [userId]
    );
    return row ? row.count : 0;
  }

  public static markAsRead(id: string, userId: string): boolean {
    const res = run(
      'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?;',
      [id, userId]
    );
    return res.changes > 0;
  }

  public static markAllAsRead(userId: string): number {
    const res = run(
      'UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0;',
      [userId]
    );
    return res.changes;
  }
}
