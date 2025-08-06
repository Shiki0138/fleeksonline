import { AuthService } from '../../src/services/AuthService';
import { query } from '../../src/config/database';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/config/redis');
jest.mock('bcrypt');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock user doesn't exist
      mockQuery.mockResolvedValueOnce({ rows: [] });
      
      // Mock password hashing
      mockBcrypt.hash.mockResolvedValueOnce('hashed-password');
      
      // Mock user creation
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: 'user',
          is_active: true,
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.lastName).toBe(userData.lastName);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw conflict error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock user exists
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      await expect(authService.register(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      // Mock user exists
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          email: credentials.email,
          password_hash: 'hashed-password',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          is_active: true,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      // Mock password verification
      mockBcrypt.compare.mockResolvedValueOnce(true);

      // Mock update last login
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await authService.login(credentials);

      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw unauthorized error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      // Mock user not found
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(authService.login(credentials)).rejects.toThrow('Invalid email or password');
    });

    it('should throw unauthorized error for inactive user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      // Mock inactive user
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'test-user-id',
          email: credentials.email,
          password_hash: 'hashed-password',
          first_name: 'Test',
          last_name: 'User',
          role: 'user',
          is_active: false,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      await expect(authService.login(credentials)).rejects.toThrow('Account is deactivated');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'test-user-id';
      const currentPassword = 'CurrentPassword123!';
      const newPassword = 'NewPassword123!';

      // Mock get current password
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: 'current-hashed-password' }]
      });

      // Mock password verification
      mockBcrypt.compare.mockResolvedValueOnce(true);

      // Mock password hashing
      mockBcrypt.hash.mockResolvedValueOnce('new-hashed-password');

      // Mock update password
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(authService.changePassword(userId, currentPassword, newPassword)).resolves.not.toThrow();
    });

    it('should throw unauthorized error for incorrect current password', async () => {
      const userId = 'test-user-id';
      const currentPassword = 'WrongPassword';
      const newPassword = 'NewPassword123!';

      // Mock get current password
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: 'current-hashed-password' }]
      });

      // Mock password verification fails
      mockBcrypt.compare.mockResolvedValueOnce(false);

      await expect(authService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow('Current password is incorrect');
    });
  });
});