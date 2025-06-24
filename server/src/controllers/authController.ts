import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { catchAsync, AppError } from '../utils/errorHandler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = 24 * 60 * 60; // 24 hours in seconds

class AuthController {
  // Login user
  login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists && password is correct
    const result = await query(
      `SELECT u.*, array_agg(p.name) as permissions
       FROM users u
       LEFT JOIN user_permissions up ON u.id = up.user_id
       LEFT JOIN permissions p ON up.permission_id = p.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );

    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // 4) If everything ok, send token to client
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from output
    delete user.password_hash;

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        permissions: user.permissions.filter(Boolean) // Remove null values if any
      }
    });
  });

  // Register new user
  register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password, firstName, lastName, isAdmin = false } = req.body;

    // 1) Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return next(new AppError('User already exists with this email', 400));
    }

    // 2) Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3) Create user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name, last_name, is_admin`,
      [username, email, passwordHash, firstName, lastName, isAdmin]
    );

    const user = result.rows[0];

    // 4) Generate token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 5) If user is not admin, grant basic permissions
    if (!isAdmin) {
      const basicPermissions = ['read:brands', 'read:categories', 'read:products', 'read:orders'];
      await query(
        `INSERT INTO user_permissions (user_id, permission_id)
         SELECT $1, id FROM permissions WHERE name = ANY($2)`,
        [user.id, basicPermissions]
      );

      // Fetch granted permissions
      const permsResult = await query(
        `SELECT array_agg(p.name) as permissions
         FROM permissions p
         JOIN user_permissions up ON p.id = up.permission_id
         WHERE up.user_id = $1`,
        [user.id]
      );
      user.permissions = permsResult.rows[0].permissions || [];
    }

    res.status(201).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        permissions: user.permissions || []
      }
    });
  });

  // Validate token and return user info
  validate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // 3) Check if user still exists
    const result = await query(
      `SELECT u.*, array_agg(p.name) as permissions
       FROM users u
       LEFT JOIN user_permissions up ON u.id = up.user_id
       LEFT JOIN permissions p ON up.permission_id = p.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    // Remove password from output
    delete user.password_hash;

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isAdmin: user.is_admin,
        permissions: user.permissions.filter(Boolean) // Remove null values if any
      }
    });
  });

  // Forgot password
  forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    // 1) Get user based on email
    const result = await query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return next(new AppError('There is no user with this email address', 404));
    }

    // 2) Generate random reset token
    const resetToken = Math.random().toString(36).slice(-8);
    const resetTokenHash = await bcrypt.hash(resetToken, 12);

    // 3) Save hashed token to database
    await query(
      `UPDATE users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [resetTokenHash, user.id]
    );

    // 4) Send email with reset token (implement email sending later)
    // For now, just return success message with the token
    // In production, you should send this via email and not expose it in the response
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      // REMOVE IN PRODUCTION:
      temporaryPassword: resetToken
    });
  });

  // Logout user
  logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // In a stateless JWT authentication system, the server doesn't need to do anything
    // The client is responsible for removing the token
    // This endpoint is provided for consistency and potential future server-side logout functionality
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  });
}

export default new AuthController(); 