import { query, queryOne, run, transaction } from '../db/database.js';
import { CoinService } from './coinService.js';
import { NotificationService } from './notificationService.js';
import { realtimeService } from './realtimeService.js';

export interface VirtualRechargePlan {
  id: string;
  name: string;
  amountINR: number;
  coinCost: number;
  validity: string;
  benefits: string;
  dataBonusMB?: number;
}

export interface RechargeTransactionRecord {
  id: string;
  userId: string;
  phone: string;
  operator: string;
  planName: string;
  amountINR: number;
  coinsSpent: number;
  status: string;
  referenceNumber: string;
  createdAt: string;
}

export const RECHARGE_PLANS: VirtualRechargePlan[] = [
  {
    id: 'rec_20',
    name: 'Talktime Topup ₹20',
    amountINR: 20,
    coinCost: 20,
    validity: 'Unlimited',
    benefits: '₹14.95 Talktime balance for roaming & non-plan calling'
  },
  {
    id: 'rec_50',
    name: 'Talktime Topup ₹50',
    amountINR: 50,
    coinCost: 50,
    validity: 'Unlimited',
    benefits: '₹39.37 Full Talktime balance'
  },
  {
    id: 'rec_99',
    name: 'Smart Booster 2GB',
    amountINR: 99,
    coinCost: 99,
    validity: 'Existing Plan Validity',
    benefits: '2 GB High-Speed Virtual Data Booster',
    dataBonusMB: 2048
  },
  {
    id: 'rec_199',
    name: 'Daily Pack 1.5GB/day (14 Days)',
    amountINR: 199,
    coinCost: 199,
    validity: '14 Days',
    benefits: 'Unlimited calls + 1.5 GB/day high speed data'
  },
  {
    id: 'rec_299',
    name: 'Power Pack 2GB/day (28 Days)',
    amountINR: 299,
    coinCost: 299,
    validity: '28 Days',
    benefits: 'Truly Unlimited Voice + 2 GB/day + 100 SMS/day'
  },
  {
    id: 'rec_599',
    name: 'Mega Hero 3GB/day (84 Days)',
    amountINR: 599,
    coinCost: 599,
    validity: '84 Days',
    benefits: 'Unlimited calls + 3 GB/day + Weekend data rollover'
  }
];

export class RechargeService {
  public static getPlans(): VirtualRechargePlan[] {
    return RECHARGE_PLANS;
  }

  public static executeRecharge(params: {
    userId: string;
    phone: string;
    operator: string;
    planId: string;
  }): RechargeTransactionRecord {
    const { userId, phone, operator, planId } = params;

    const plan = RECHARGE_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Selected recharge plan is not valid.');
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number for recharge.');
    }

    const id = `rc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const refNumber = `REF-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const record = transaction(() => {
      // Deduct coins atomically (fails if insufficient coins)
      CoinService.spendCoins({
        userId,
        amount: plan.coinCost,
        type: 'MOBILE_RECHARGE',
        description: `Virtual Recharge ₹${plan.amountINR} (${plan.name}) for ${cleanPhone}`,
        referenceId: refNumber
      });

      // Insert recharge record
      run(
        `INSERT INTO recharge_transactions (id, userId, phone, operator, planName, amountINR, coinsSpent, status, referenceNumber, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'SUCCESS', ?, ?);`,
        [id, userId, cleanPhone, operator, plan.name, plan.amountINR, plan.coinCost, refNumber, now]
      );

      NotificationService.create({
        userId,
        title: 'Virtual Mobile Recharge Successful',
        message: `Successfully processed virtual recharge of ₹${plan.amountINR} (${plan.name}) for ${cleanPhone}. Ref: ${refNumber}. (Demo Prototype)`,
        type: 'RECHARGE_SUCCESS',
        link: '/recharge'
      });

      return queryOne<RechargeTransactionRecord>(
        'SELECT * FROM recharge_transactions WHERE id = ?;',
        [id]
      )!;
    });

    realtimeService.emitToUser(userId, 'RECHARGE_SUCCESS', record);
    return record;
  }

  public static getRechargeHistory(userId: string): RechargeTransactionRecord[] {
    return query<RechargeTransactionRecord>(
      'SELECT * FROM recharge_transactions WHERE userId = ? ORDER BY createdAt DESC;',
      [userId]
    );
  }
}
