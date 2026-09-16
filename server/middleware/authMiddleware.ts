import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'datashare-secure-production-jwt-key-2026';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
      errorCode: 'AUTH_REQUIRED'
    });
    return;
  }

  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader as string);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = queryOne<AuthenticatedUser>(
      'SELECT id, fullName, phone, email, role, status FROM users WHERE id = ?;',
      [decoded.userId]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid user session. User not found.',
        errorCode: 'USER_NOT_FOUND'
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Account suspended or inactive.',
        errorCode: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      errorCode: 'INVALID_TOKEN'
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
      errorCode: 'FORBIDDEN_NOT_ADMIN'
    });
    return;
  }
  next();
}
