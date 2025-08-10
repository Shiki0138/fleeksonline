import fs from 'fs';
import path from 'path';
import { query, connectDatabase } from '../config/database';
import { logger } from '../config/logger';

async function runSeeds(): Promise<void> {
  try {
    await connectDatabase();
    
    const seedsDir = path.join(__dirname, 'seeds');
    
    if (!fs.existsSync(seedsDir)) {
      logger.info('📦 No seeds directory found');
      return;
    }
    
    // Get list of seed files
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (seedFiles.length === 0) {
      logger.info('📦 No seed files found');
      return;
    }
    
    logger.info('🌱 Running database seeds...');
    
    for (const file of seedFiles) {
      logger.info(`🌱 Executing seed: ${file}`);
      
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await query(sql);
      
      logger.info(`✅ Seed completed: ${file}`);
    }
    
    logger.info('🎉 All seeds completed successfully');
    
  } catch (error) {
    logger.error('❌ Seed process failed:', error);
    process.exit(1);
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds().then(() => {
    process.exit(0);
  });
}

export { runSeeds };