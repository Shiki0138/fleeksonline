import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { setCache, getCache, deleteCache } from '../config/redis';
import { logger } from '../config/logger';
import { UnauthorizedError, ConflictError, NotFoundError } from '../middleware/errorHandler';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export class AuthService {
  private readonly saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  private readonly jwtSecret = process.env.JWT_SECRET!;
  private readonly jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  private readonly jwtExpire = process.env.JWT_EXPIRE || '24h';
  private readonly jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

  constructor() {
    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets must be configured');
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, firstName, lastName, role = 'user' } = userData;

    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Create user
      const userId = uuidv4();
      const result = await query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at`,
        [userId, email, passwordHash, firstName, lastName, role]
      );

      const user = this.mapUserFromDb(result.rows[0]);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Log registration
      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return { user, tokens };

    } catch (error) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    try {
      // Get user from database
      const result = await query(
        `SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const userRow = result.rows[0];

      // Check if user is active
      if (!userRow.is_active) {
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userRow.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const user = this.mapUserFromDb(userRow);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Log successful login
      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email
      });

      return { user, tokens };

    } catch (error) {
      logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;

      // Check if refresh token is blacklisted
      const isBlacklisted = await getCache(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        throw new UnauthorizedError('Refresh token is invalid');
      }

      // Get user from database
      const result = await query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const user = result.rows[0];

      // Generate new tokens
      const tokens = await this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      } as User);

      // Blacklist old refresh token
      await setCache(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60); // 7 days

      logger.info('Token refreshed successfully', { userId: user.id });

      return tokens;

    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Logout user by blacklisting tokens
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Blacklist both tokens
      await Promise.all([
        setCache(`blacklist:${accessToken}`, true, 24 * 60 * 60), // 24 hours
        setCache(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60) // 7 days
      ]);

      logger.info('User logged out successfully');

    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get current password hash
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      logger.info('Password changed successfully', { userId });

    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await query(
        `SELECT id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapUserFromDb(result.rows[0]);

    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw error;
    }
  }

  /**
   * Verify if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklisted = await getCache(`blacklist:${token}`);
      return !!blacklisted;
    } catch (error) {
      logger.error('Token blacklist check failed:', error);
      return false;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpire,
      issuer: 'fleeks-api',
      audience: 'fleeks-client'
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpire,
      issuer: 'fleeks-api',
      audience: 'fleeks-client'
    });

    // Parse expiration time
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded.exp - decoded.iat;

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Map database user row to User interface
   */
  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}