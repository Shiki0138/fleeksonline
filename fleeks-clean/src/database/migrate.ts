import fs from 'fs';
import path from 'path';
import { query, connectDatabase } from '../config/database';
import { logger } from '../config/logger';

interface Migration {
  id: number;
  name: string;
  executed_at: Date;
}

async function createMigrationsTable(): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await query(createTableQuery);
  logger.info('✅ Migrations table created or already exists');
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row: Migration) => row.name);
}

async function executeMigration(name: string, sql: string): Promise<void> {
  try {
    // Execute the migration SQL
    await query(sql);
    
    // Record the migration as executed
    await query('INSERT INTO migrations (name) VALUES ($1)', [name]);
    
    logger.info(`✅ Migration executed: ${name}`);
  } catch (error) {
    logger.error(`❌ Migration failed: ${name}`, error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  try {
    await connectDatabase();
    await createMigrationsTable();
    
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      logger.info('📁 Created migrations directory');
    }
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      logger.info('📦 No migration files found');
      return;
    }
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Execute pending migrations
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.sql');
      
      if (executedMigrations.includes(migrationName)) {
        logger.info(`⏭️  Skipping already executed migration: ${migrationName}`);
        continue;
      }
      
      logger.info(`🚀 Executing migration: ${migrationName}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await executeMigration(migrationName, sql);
    }
    
    logger.info('🎉 All migrations completed successfully');
    
  } catch (error) {
    logger.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

// Execute initial schema migration
async function executeInitialSchema(): Promise<void> {
  try {
    logger.info('🚀 Executing initial database schema...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await query(schemaSql);
    
    // Record schema as migration
    await query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      ['initial_schema']
    );
    
    logger.info('✅ Initial schema executed successfully');
    
  } catch (error) {
    logger.error('❌ Initial schema execution failed:', error);
    throw error;
  }
}

// Main migration runner
async function main(): Promise<void> {
  try {
    await connectDatabase();
    await createMigrationsTable();
    
    // Check if initial schema has been executed
    const executedMigrations = await getExecutedMigrations();
    
    if (!executedMigrations.includes('initial_schema')) {
      await executeInitialSchema();
    }
    
    // Run any additional migrations
    await runMigrations();
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  main();
}

export { runMigrations, executeMigration, getExecutedMigrations };