import { Request, Response } from 'express';
import { db } from '../db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
});

const resetPasswordSchema = z.object({
  token: z.string().uuid('Invalid reset token'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const SALT_ROUNDS = 10;

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await db.oneOrNone(
        'SELECT id FROM users WHERE email = $1',
        [validatedData.email]
      );

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
      
      // Generate verification token
      const verificationToken = uuidv4();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await db.one(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, 
          email_verification_token, email_verification_expires
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, email, first_name, last_name, role`,
        [
          validatedData.email,
          passwordHash,
          validatedData.first_name,
          validatedData.last_name,
          verificationToken,
          verificationExpires,
        ]
      );

      // Log the registration
      await db.none(
        `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent, details)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          'REGISTRATION',
          req.ip,
          req.headers['user-agent'],
          { email: user.email },
        ]
      );

      // TODO: Send verification email with token

      res.status(201).json({
        message: 'Registration successful. Please check your email for verification.',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Login user
  static async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Get user
      const user = await db.one(
        `SELECT id, email, password_hash, first_name, last_name, role, 
        is_active, email_verified, failed_login_attempts, lockout_until
        FROM users WHERE email = $1`,
        [validatedData.email]
      );

      // Check if user is locked out
      if (user.lockout_until && user.lockout_until > new Date()) {
        return res.status(403).json({
          error: 'Account is temporarily locked. Please try again later.',
        });
      }

      // Check if user is active and verified
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (!user.email_verified) {
        return res.status(403).json({ error: 'Email not verified' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(validatedData.password, user.password_hash);

      if (!validPassword) {
        // Increment failed login attempts
        await db.none(
          'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1',
          [user.id]
        );

        // Log failed login attempt
        await db.none(
          `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent, details)
          VALUES ($1, $2, $3, $4, $5)`,
          [
            user.id,
            'LOGIN_FAILED',
            req.ip,
            req.headers['user-agent'],
            { reason: 'Invalid password' },
          ]
        );

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token
      await db.none(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, refreshToken]
      );

      // Create session
      await db.none(
        `INSERT INTO user_sessions (user_id, ip_address, user_agent)
        VALUES ($1, $2, $3)`,
        [user.id, req.ip, req.headers['user-agent']]
      );

      // Reset failed login attempts and update last login
      await db.none(
        `UPDATE users 
        SET failed_login_attempts = 0, 
            lockout_until = NULL, 
            last_login = CURRENT_TIMESTAMP 
        WHERE id = $1`,
        [user.id]
      );

      // Log successful login
      await db.none(
        `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent)
        VALUES ($1, $2, $3, $4)`,
        [user.id, 'LOGIN_SUCCESS', req.ip, req.headers['user-agent']]
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // Verify refresh token exists and is not revoked
      const tokenRecord = await db.oneOrNone(
        `SELECT user_id, expires_at, revoked_at 
        FROM refresh_tokens 
        WHERE token = $1`,
        [refreshToken]
      );

      if (!tokenRecord || tokenRecord.revoked_at || new Date() > tokenRecord.expires_at) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Get user
      const user = await db.one(
        'SELECT id, role FROM users WHERE id = $1',
        [tokenRecord.user_id]
      );

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  // Logout user
  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user.userId; // Set by auth middleware

      // Revoke refresh token
      if (refreshToken) {
        await db.none(
          'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1',
          [refreshToken]
        );
      }

      // End user session
      await db.none(
        'DELETE FROM user_sessions WHERE user_id = $1 AND ip_address = $2',
        [userId, req.ip]
      );

      // Log logout
      await db.none(
        `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent)
        VALUES ($1, $2, $3, $4)`,
        [userId, 'LOGOUT', req.ip, req.headers['user-agent']]
      );

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Request password reset
  static async forgotPassword(req: Request, res: Response) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);

      const user = await db.oneOrNone(
        'SELECT id, email FROM users WHERE email = $1',
        [validatedData.email]
      );

      if (!user) {
        // Return success even if user doesn't exist (security best practice)
        return res.json({
          message: 'If an account exists, you will receive a password reset email.',
        });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      // Save reset token
      await db.none(
        `UPDATE users 
        SET reset_password_token = $1, 
            reset_password_expires = $2 
        WHERE id = $3`,
        [resetToken, resetExpires, user.id]
      );

      // Log password reset request
      await db.none(
        `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent)
        VALUES ($1, $2, $3, $4)`,
        [user.id, 'PASSWORD_RESET_REQUEST', req.ip, req.headers['user-agent']]
      );

      // TODO: Send password reset email with token

      res.json({
        message: 'If an account exists, you will receive a password reset email.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Password reset request failed' });
    }
  }

  // Reset password with token
  static async resetPassword(req: Request, res: Response) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);

      const user = await db.oneOrNone(
        `SELECT id 
        FROM users 
        WHERE reset_password_token = $1 
        AND reset_password_expires > CURRENT_TIMESTAMP`,
        [validatedData.token]
      );

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

      // Update password and clear reset token
      await db.none(
        `UPDATE users 
        SET password_hash = $1, 
            reset_password_token = NULL, 
            reset_password_expires = NULL 
        WHERE id = $2`,
        [passwordHash, user.id]
      );

      // Revoke all refresh tokens
      await db.none(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user.id]
      );

      // Log password reset
      await db.none(
        `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent)
        VALUES ($1, $2, $3, $4)`,
        [user.id, 'PASSWORD_RESET_SUCCESS', req.ip, req.headers['user-agent']]
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const user = await db.oneOrNone(
        `SELECT id 
        FROM users 
        WHERE email_verification_token = $1 
        AND email_verification_expires > CURRENT_TIMESTAMP`,
        [token]
      );

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Mark email as verified
      await db.none(
        `UPDATE users 
        SET email_verified = true, 
            email_verification_token = NULL, 
            email_verification_expires = NULL 
        WHERE id = $1`,
        [user.id]
      );

      // Log email verification
      await db.none(
        `INSERT INTO auth_audit_logs (user_id, event_type, ip_address, user_agent)
        VALUES ($1, $2, $3, $4)`,
        [user.id, 'EMAIL_VERIFIED', req.ip, req.headers['user-agent']]
      );

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Email verification failed' });
    }
  }
} 