import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FleeksDB extends DBSchema {
  'ai-patterns': {
    key: string;
    value: {
      id: string;
      action: string;
      data: any;
      timestamp: number;
      confidence?: number;
    };
  };
  'user-preferences': {
    key: string;
    value: {
      key: string;
      value: any;
      lastUpdated: number;
    };
  };
  'cached-products': {
    key: string;
    value: {
      id: string;
      name: string;
      category: string;
      imageUrl: string;
      arData?: any;
      lastViewed: number;
    };
  };
  'beauty-profiles': {
    key: string;
    value: {
      id: string;
      skinTone: string;
      faceShape: string;
      preferences: string[];
      savedLooks: any[];
      createdAt: number;
    };
  };
  'ai-models': {
    key: string;
    value: {
      modelName: string;
      data: ArrayBuffer;
      version: string;
      lastUsed: number;
    };
  };
}

class OfflineDatabase {
  private db: IDBPDatabase<FleeksDB> | null = null;
  private readonly DB_NAME = 'fleeks-offline-db';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<FleeksDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // AI patterns store
          if (!db.objectStoreNames.contains('ai-patterns')) {
            const patternStore = db.createObjectStore('ai-patterns', { keyPath: 'id' });
            patternStore.createIndex('timestamp', 'timestamp');
            patternStore.createIndex('action', 'action');
          }

          // User preferences store
          if (!db.objectStoreNames.contains('user-preferences')) {
            db.createObjectStore('user-preferences', { keyPath: 'key' });
          }

          // Cached products store
          if (!db.objectStoreNames.contains('cached-products')) {
            const productStore = db.createObjectStore('cached-products', { keyPath: 'id' });
            productStore.createIndex('category', 'category');
            productStore.createIndex('lastViewed', 'lastViewed');
          }

          // Beauty profiles store
          if (!db.objectStoreNames.contains('beauty-profiles')) {
            db.createObjectStore('beauty-profiles', { keyPath: 'id' });
          }

          // AI models cache
          if (!db.objectStoreNames.contains('ai-models')) {
            const modelStore = db.createObjectStore('ai-models', { keyPath: 'modelName' });
            modelStore.createIndex('lastUsed', 'lastUsed');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  // AI Pattern Management
  async saveAIPattern(pattern: Omit<FleeksDB['ai-patterns']['value'], 'id'>): Promise<void> {
    if (!this.db) await this.init();
    const id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.db!.put('ai-patterns', { ...pattern, id });
    
    // Keep only last 1000 patterns
    await this.cleanupOldPatterns();
  }

  async getRecentPatterns(limit: number = 100): Promise<FleeksDB['ai-patterns']['value'][]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('ai-patterns', 'readonly');
    const index = tx.store.index('timestamp');
    const patterns = await index.getAll();
    return patterns.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async analyzePatterns(): Promise<{
    mostFrequentActions: { action: string; count: number }[];
    peakUsageTimes: { hour: number; count: number }[];
    confidenceAverage: number;
  }> {
    const patterns = await this.getRecentPatterns(500);
    
    // Analyze action frequency
    const actionCounts = patterns.reduce((acc, pattern) => {
      acc[pattern.action] = (acc[pattern.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostFrequentActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Analyze usage times
    const hourCounts = patterns.reduce((acc, pattern) => {
      const hour = new Date(pattern.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const peakUsageTimes = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
    
    // Calculate average confidence
    const confidenceValues = patterns
      .filter(p => p.confidence !== undefined)
      .map(p => p.confidence!);
    
    const confidenceAverage = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;
    
    return { mostFrequentActions, peakUsageTimes, confidenceAverage };
  }

  private async cleanupOldPatterns(): Promise<void> {
    if (!this.db) return;
    
    const tx = this.db.transaction('ai-patterns', 'readwrite');
    const patterns = await tx.store.getAll();
    
    if (patterns.length > 1000) {
      const sorted = patterns.sort((a, b) => b.timestamp - a.timestamp);
      const toDelete = sorted.slice(1000);
      
      for (const pattern of toDelete) {
        await tx.store.delete(pattern.id);
      }
    }
  }

  // User Preferences
  async savePreference(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('user-preferences', {
      key,
      value,
      lastUpdated: Date.now(),
    });
  }

  async getPreference(key: string): Promise<any> {
    if (!this.db) await this.init();
    const pref = await this.db!.get('user-preferences', key);
    return pref?.value;
  }

  async getAllPreferences(): Promise<Record<string, any>> {
    if (!this.db) await this.init();
    const prefs = await this.db!.getAll('user-preferences');
    return prefs.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {} as Record<string, any>);
  }

  // Product Caching
  async cacheProduct(product: Omit<FleeksDB['cached-products']['value'], 'lastViewed'>): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('cached-products', {
      ...product,
      lastViewed: Date.now(),
    });
  }

  async getCachedProducts(category?: string): Promise<FleeksDB['cached-products']['value'][]> {
    if (!this.db) await this.init();
    
    if (category) {
      const tx = this.db!.transaction('cached-products', 'readonly');
      const index = tx.store.index('category');
      return await index.getAll(category);
    }
    
    return await this.db!.getAll('cached-products');
  }

  // Beauty Profile Management
  async saveBeautyProfile(profile: Omit<FleeksDB['beauty-profiles']['value'], 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) await this.init();
    const id = `profile_${Date.now()}`;
    await this.db!.put('beauty-profiles', {
      ...profile,
      id,
      createdAt: Date.now(),
    });
    return id;
  }

  async getBeautyProfile(id: string): Promise<FleeksDB['beauty-profiles']['value'] | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('beauty-profiles', id);
  }

  // AI Model Caching
  async cacheAIModel(modelName: string, data: ArrayBuffer, version: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('ai-models', {
      modelName,
      data,
      version,
      lastUsed: Date.now(),
    });
  }

  async getCachedModel(modelName: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();
    const model = await this.db!.get('ai-models', modelName);
    if (model) {
      // Update last used timestamp
      await this.db!.put('ai-models', {
        ...model,
        lastUsed: Date.now(),
      });
      return model.data;
    }
    return null;
  }

  // Sync Management
  async getUnsyncedData(): Promise<{
    patterns: FleeksDB['ai-patterns']['value'][];
    preferences: FleeksDB['user-preferences']['value'][];
  }> {
    if (!this.db) await this.init();
    
    // Get patterns from last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const patterns = await this.getRecentPatterns(1000);
    const recentPatterns = patterns.filter(p => p.timestamp > oneDayAgo);
    
    const preferences = await this.db!.getAll('user-preferences');
    
    return { patterns: recentPatterns, preferences };
  }

  async clearSyncedData(syncedIds: string[]): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('ai-patterns', 'readwrite');
    
    for (const id of syncedIds) {
      await tx.store.delete(id);
    }
  }
}

// Export singleton instance
export const offlineDB = new OfflineDatabase();