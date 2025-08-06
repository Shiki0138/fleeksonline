const knex = require('knex');
const logger = require('./logger');

const dbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'fleeks_db',
    user: process.env.DB_USER || 'fleeks_user',
    password: process.env.DB_PASSWORD || 'fleeks_password',
  },
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    createTimeoutMillis: 3000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

// Create the database instance
const db = knex(dbConfig);

class Database {
  constructor() {
    this.db = db;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Test the connection
      await this.db.raw('SELECT 1');
      this.isConnected = true;
      logger.info('Database connection established successfully');

      // Run migrations in production
      if (process.env.NODE_ENV === 'production') {
        await this.runMigrations();
      }

      return true;
    } catch (error) {
      logger.error('Database connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async runMigrations() {
    try {
      const [batchNo, log] = await this.db.migrate.latest();
      if (log.length === 0) {
        logger.info('Database is already up to date');
      } else {
        logger.info(`Ran ${log.length} migrations for batch ${batchNo}`);
        log.forEach(migration => logger.info(`- ${migration}`));
      }
    } catch (error) {
      logger.error('Migration failed:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.isConnected) {
      await this.db.destroy();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  // Health check method
  async isHealthy() {
    try {
      await this.db.raw('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error.message);
      return false;
    }
  }

  // Transaction wrapper
  async transaction(callback) {
    return this.db.transaction(callback);
  }

  // Query builder helper
  table(tableName) {
    return this.db(tableName);
  }

  // Raw query method
  raw(query, bindings) {
    return this.db.raw(query, bindings);
  }
}

// Export singleton instance
const database = new Database();

module.exports = database;