const jwt = require('jsonwebtoken');
const AuthService = require('../../src/services/AuthService');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/config/redis');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const tokens = AuthService.generateTokens(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // Verify token payload
      const decodedAccess = jwt.decode(tokens.accessToken);
      expect(decodedAccess.userId).toBe(user.id);
      expect(decodedAccess.email).toBe(user.email);
      expect(decodedAccess.role).toBe(user.role);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'MySecure123@',
        'Complex9$Pass',
      ];

      validPasswords.forEach(password => {
        expect(AuthService.isValidPassword(password)).toBe(true);
      });
    });

    it('should return false for invalid passwords', () => {
      const invalidPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChars123',
        '',
      ];

      invalidPasswords.forEach(password => {
        expect(AuthService.isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockUser = {
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        toJSON: () => ({
          id: 'user-123',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'user',
        }),
      };

      User.findByEmail.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      User.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(AuthService.register(userData)).rejects.toThrow('User already exists with this email');
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      await expect(AuthService.register(userData)).rejects.toThrow(/Password must be at least 8 characters/);
    });
  });
});