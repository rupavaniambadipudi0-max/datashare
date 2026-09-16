import jwt from 'jsonwebtoken';
import { query, queryOne, run, transaction } from '../db/database.js';
import { JWT_SECRET, AuthenticatedUser } from '../middleware/authMiddleware.js';
import { WalletService } from './walletService.js';
import { CoinService } from './coinService.js';
import { NotificationService } from './notificationService.js';

export interface RegisterParams {
  fullName: string;
  phone: string;
  email: string;
  operatorId: string;
  planName: string;
  price: number;
  startDate?: string;
  endDate?: string;
  totalDataGB: number;
  usedDataGB: number;
  shareableDataGB: number;
}

export class AuthService {
  public static sendOtp(phone: string): { message: string; demoCode?: string } {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    // Rate limit check: max 5 OTP requests per phone in 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recentOtps = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM otp_codes WHERE phone = ? AND createdAt >= ?;',
      [cleanPhone, tenMinAgo]
    );

    if (recentOtps && recentOtps.count >= 5) {
      throw new Error('Too many OTP attempts. Please wait 10 minutes before requesting a new OTP.');
    }

    // In prototype/demo mode, predictable code '123456' or generated code
    const otpCode = '123456';
    const id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    const now = new Date().toISOString();

    run(
      `INSERT INTO otp_codes (id, phone, code, expiresAt, attempts, verified, createdAt)
       VALUES (?, ?, ?, ?, 0, 0, ?);`,
      [id, cleanPhone, otpCode, expiresAt, now]
    );

    return {
      message: `OTP sent successfully to ${cleanPhone}. (Demo Code: ${otpCode})`,
      demoCode: otpCode
    };
  }

  public static verifyOtp(phone: string, code: string): {
    token?: string;
    user?: any;
    isNewUser: boolean;
    phone: string;
  } {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanCode = code.trim();

    const otpRecord = queryOne<{
      id: string;
      code: string;
      expiresAt: number;
      attempts: number;
      verified: number;
    }>(
      'SELECT id, code, expiresAt, attempts, verified FROM otp_codes WHERE phone = ? ORDER BY createdAt DESC LIMIT 1;',
      [cleanPhone]
    );

    // Allow standard testing demo code '123456' or recorded OTP
    const isDemoMatch = cleanCode === '123456';
    const isDbMatch = otpRecord && otpRecord.code === cleanCode && Date.now() <= otpRecord.expiresAt;

    if (!isDemoMatch && !isDbMatch) {
      if (otpRecord) {
        run('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?;', [otpRecord.id]);
      }
      throw new Error('Invalid or expired OTP code. Please check and try again.');
    }

    if (otpRecord) {
      run('UPDATE otp_codes SET verified = 1 WHERE id = ?;', [otpRecord.id]);
    }

    // Check if user exists
    const existingUser = queryOne<AuthenticatedUser>(
      'SELECT id, fullName, phone, email, role, status FROM users WHERE phone = ?;',
      [cleanPhone]
    );

    if (!existingUser) {
      return {
        isNewUser: true,
        phone: cleanPhone
      };
    }

    const token = jwt.sign({ userId: existingUser.id }, JWT_SECRET, { expiresIn: '7d' });
    const wallet = WalletService.getWallet(existingUser.id);
    const plan = WalletService.getPlan(existingUser.id);
    const coinWallet = CoinService.getWallet(existingUser.id);

    return {
      isNewUser: false,
      phone: cleanPhone,
      token,
      user: {
        ...existingUser,
        wallet,
        plan,
        coinWallet
      }
    };
  }

  public static register(params: RegisterParams): { token: string; user: any } {
    const cleanPhone = params.phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Valid 10-digit mobile number required.');
    }

    if (!params.fullName || params.fullName.trim().length < 2) {
      throw new Error('Full name is required (minimum 2 characters).');
    }

    const existing = queryOne<{ id: string }>('SELECT id FROM users WHERE phone = ?;', [cleanPhone]);
    if (existing) {
      throw new Error('A user with this mobile number is already registered.');
    }

    const totalDataMB = Math.round(params.totalDataGB * 1024);
    const usedDataMB = Math.round(params.usedDataGB * 1024);
    let remainingDataMB = totalDataMB - usedDataMB;
    if (remainingDataMB < 0) remainingDataMB = 0;

    let shareableDataMB = Math.round(params.shareableDataGB * 1024);
    if (shareableDataMB > remainingDataMB) {
      shareableDataMB = remainingDataMB;
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const startDate = params.startDate || now.split('T')[0];
    const endDate = params.endDate || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = transaction(() => {
      // 1. Create User
      run(
        `INSERT INTO users (id, fullName, phone, email, role, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'USER', 'ACTIVE', ?, ?);`,
        [userId, params.fullName.trim(), cleanPhone, params.email.trim(), now, now]
      );

      // 2. Create User Plan
      const planId = `plan_${userId}`;
      run(
        `INSERT INTO user_plans (
          id, userId, operatorId, planName, price, startDate, endDate,
          totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?);`,
        [
          planId,
          userId,
          params.operatorId,
          params.planName || 'Standard Unlimited Plan',
          params.price || 299,
          startDate,
          endDate,
          totalDataMB,
          usedDataMB,
          remainingDataMB,
          shareableDataMB,
          now,
          now
        ]
      );

      // 3. Create Data Wallet
      const walletId = `wal_${userId}`;
      run(
        `INSERT INTO data_wallets (
          id, userId, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB,
          receivedDataMB, totalSharedDataMB, totalReceivedDataMB, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?);`,
        [walletId, userId, totalDataMB, usedDataMB, remainingDataMB, shareableDataMB, now, now]
      );

      // 4. Create Coin Wallet with 20 welcome bonus coins!
      const coinId = `coin_${userId}`;
      run(
        `INSERT INTO coin_wallets (id, userId, coinBalance, totalEarned, totalSpent, createdAt, updatedAt)
         VALUES (?, ?, 20, 20, 0, ?, ?);`,
        [coinId, userId, now, now]
      );

      // 5. Create Welcome notification
      NotificationService.create({
        userId,
        title: 'Welcome to DataShare! 🎉',
        message: `Your account is active! You received a 20 Coin welcome bonus and your ${params.shareableDataGB} GB data wallet is ready to share.`,
        type: 'COINS_EARNED',
        link: '/data-wallet'
      });

      return queryOne<AuthenticatedUser>(
        'SELECT id, fullName, phone, email, role, status FROM users WHERE id = ?;',
        [userId]
      )!;
    });

    const token = jwt.sign({ userId: result.id }, JWT_SECRET, { expiresIn: '7d' });
    const wallet = WalletService.getWallet(result.id);
    const plan = WalletService.getPlan(result.id);
    const coinWallet = CoinService.getWallet(result.id);

    return {
      token,
      user: {
        ...result,
        wallet,
        plan,
        coinWallet
      }
    };
  }

  public static getFullProfile(userId: string): any {
    const user = queryOne<AuthenticatedUser>(
      'SELECT id, fullName, phone, email, role, status FROM users WHERE id = ?;',
      [userId]
    );
    if (!user) return null;

    const wallet = WalletService.getWallet(userId);
    const plan = WalletService.getPlan(userId);
    const coinWallet = CoinService.getWallet(userId);
    const unreadNotifications = NotificationService.getUnreadCount(userId);

    return {
      ...user,
      wallet,
      plan,
      coinWallet,
      unreadNotifications
    };
  }
}
