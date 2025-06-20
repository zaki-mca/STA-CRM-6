import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
  role: string;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Check if user exists and is active
    const user = await db.oneOrNone(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Add user info to request object
    (req as any).user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

export const validateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return next();
    }

    // Check if user has an active session from this IP
    const session = await db.oneOrNone(
      `SELECT id 
      FROM user_sessions 
      WHERE user_id = $1 
      AND ip_address = $2 
      AND last_activity > NOW() - INTERVAL '24 hours'`,
      [userId, req.ip]
    );

    if (!session) {
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
      });
    }

    // Update last activity
    await db.none(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
      [session.id]
    );

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ error: 'Session validation failed' });
  }
};

// Cleanup expired sessions periodically
export const cleanupExpiredSessions = async () => {
  try {
    await db.none(
      "DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL '24 hours'"
    );
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
}; 