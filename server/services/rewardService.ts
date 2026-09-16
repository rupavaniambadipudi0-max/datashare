import { query, queryOne, run, transaction } from '../db/database.js';
import { CoinService } from './coinService.js';
import { NotificationService } from './notificationService.js';
import { realtimeService } from './realtimeService.js';

export interface RewardRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  coinCost: number;
  cashValue: number;
  status: string;
  stock: number;
  imageUrl: string | null;
  terms: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RedemptionRecord {
  id: string;
  userId: string;
  rewardId: string;
  rewardName?: string;
  rewardCategory?: string;
  coinsSpent: number;
  couponCode: string;
  status: string;
  createdAt: string;
}

export class RewardService {
  public static getCatalog(category?: string): RewardRecord[] {
    if (category && category !== 'All') {
      return query<RewardRecord>(
        'SELECT * FROM rewards WHERE status = "ACTIVE" AND category = ? ORDER BY coinCost ASC;',
        [category]
      );
    }
    return query<RewardRecord>(
      'SELECT * FROM rewards WHERE status = "ACTIVE" ORDER BY coinCost ASC;'
    );
  }

  public static getRewardById(id: string): RewardRecord | null {
    return queryOne<RewardRecord>('SELECT * FROM rewards WHERE id = ?;', [id]);
  }

  public static redeem(userId: string, rewardId: string): RedemptionRecord {
    const reward = this.getRewardById(rewardId);
    if (!reward) {
      throw new Error('Reward item not found.');
    }

    if (reward.status !== 'ACTIVE') {
      throw new Error('This reward is currently inactive.');
    }

    if (reward.stock <= 0) {
      throw new Error('Sorry, this reward is currently out of stock.');
    }

    const redemptionId = `rdm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `DS-${reward.category.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}-${randomSuffix}`;
    const now = new Date().toISOString();

    const record = transaction(() => {
      // 1. Spend coins (fails if insufficient coins)
      CoinService.spendCoins({
        userId,
        amount: reward.coinCost,
        type: 'SHOPPING_REDEMPTION',
        description: `Redeemed ${reward.name} for ${reward.coinCost} coins`,
        referenceId: couponCode
      });

      // 2. Decrement stock
      run(
        `UPDATE rewards
         SET stock = stock - 1, updatedAt = ?
         WHERE id = ? AND stock > 0;`,
        [now, rewardId]
      );

      // 3. Create redemption record
      run(
        `INSERT INTO reward_redemptions (id, userId, rewardId, coinsSpent, couponCode, status, createdAt)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?);`,
        [redemptionId, userId, rewardId, reward.coinCost, couponCode, now]
      );

      NotificationService.create({
        userId,
        title: 'Reward Voucher Redeemed!',
        message: `You successfully redeemed ${reward.name}! Your coupon code is: ${couponCode}`,
        type: 'REWARD_REDEEMED',
        link: '/rewards'
      });

      return queryOne<RedemptionRecord>(
        `SELECT r.*, w.name as rewardName, w.category as rewardCategory
         FROM reward_redemptions r
         JOIN rewards w ON r.rewardId = w.id
         WHERE r.id = ?;`,
        [redemptionId]
      )!;
    });

    realtimeService.emitToUser(userId, 'REWARD_REDEEMED', record);
    return record;
  }

  public static getUserRedemptions(userId: string): RedemptionRecord[] {
    return query<RedemptionRecord>(
      `SELECT r.*, w.name as rewardName, w.category as rewardCategory
       FROM reward_redemptions r
       JOIN rewards w ON r.rewardId = w.id
       WHERE r.userId = ?
       ORDER BY r.createdAt DESC;`,
      [userId]
    );
  }
}
