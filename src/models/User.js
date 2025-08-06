const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const logger = require('../config/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.role = data.role || 'user';
    this.isActive = data.is_active !== false;
    this.emailVerified = data.email_verified || false;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      const { email, password, firstName, lastName, role = 'user' } = userData;
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate user ID
      const userId = uuidv4();

      // Insert user into database
      const [user] = await database.table('users')
        .insert({
          id: userId,
          email: email.toLowerCase(),
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          role,
          is_active: true,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      logger.info(`User created: ${email}`);
      return new User(user);
    } catch (error) {
      logger.error('Error creating user:', error.message);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const user = await database.table('users')
        .where({ id })
        .first();

      return user ? new User(user) : null;
    } catch (error) {
      logger.error('Error finding user by ID:', error.message);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const user = await database.table('users')
        .where({ email: email.toLowerCase() })
        .first();

      return user ? new User(user) : null;
    } catch (error) {
      logger.error('Error finding user by email:', error.message);
      throw error;
    }
  }

  // Get all users with pagination
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        search = '',
        role = null,
        isActive = null,
      } = options;

      const offset = (page - 1) * limit;
      let query = database.table('users');

      // Apply filters
      if (search) {
        query = query.where(function() {
          this.where('email', 'ilike', `%${search}%`)
            .orWhere('first_name', 'ilike', `%${search}%`)
            .orWhere('last_name', 'ilike', `%${search}%`);
        });
      }

      if (role) {
        query = query.where({ role });
      }

      if (isActive !== null) {
        query = query.where({ is_active: isActive });
      }

      // Get total count
      const [{ count }] = await query.clone().count('* as count');
      const totalUsers = parseInt(count);

      // Get users
      const users = await query
        .select(['id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'email_verified', 'last_login', 'created_at', 'updated_at'])
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset(offset);

      return {
        users: users.map(user => new User(user)),
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding users:', error.message);
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedUpdates = ['first_name', 'last_name', 'role', 'is_active', 'email_verified'];
      const updates = {};

      // Filter allowed updates
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid updates provided');
      }

      updates.updated_at = new Date();

      const [updatedUser] = await database.table('users')
        .where({ id: this.id })
        .update(updates)
        .returning('*');

      // Update current instance
      Object.assign(this, new User(updatedUser));

      logger.info(`User updated: ${this.email}`);
      return this;
    } catch (error) {
      logger.error('Error updating user:', error.message);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await database.table('users')
        .where({ id: this.id })
        .update({
          password: hashedPassword,
          updated_at: new Date(),
        });

      logger.info(`Password updated for user: ${this.email}`);
      return true;
    } catch (error) {
      logger.error('Error updating password:', error.message);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      logger.error('Error verifying password:', error.message);
      return false;
    }
  }

  // Update last login
  async updateLastLogin() {
    try {
      const now = new Date();
      await database.table('users')
        .where({ id: this.id })
        .update({ last_login: now });

      this.lastLogin = now;
      logger.info(`Last login updated for user: ${this.email}`);
    } catch (error) {
      logger.error('Error updating last login:', error.message);
    }
  }

  // Soft delete user
  async delete() {
    try {
      await database.table('users')
        .where({ id: this.id })
        .update({
          is_active: false,
          updated_at: new Date(),
        });

      this.isActive = false;
      logger.info(`User deactivated: ${this.email}`);
      return true;
    } catch (error) {
      logger.error('Error deactivating user:', error.message);
      throw error;
    }
  }

  // Hard delete user (use with caution)
  async hardDelete() {
    try {
      await database.table('users')
        .where({ id: this.id })
        .del();

      logger.warn(`User permanently deleted: ${this.email}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error.message);
      throw error;
    }
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Get user's full name
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

module.exports = User;