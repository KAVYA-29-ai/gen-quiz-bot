/**
 * Caching Utility
 * Implements client-side caching for API responses and quiz data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxEntries?: number;
  storage?: 'memory' | 'localStorage';
}

class Cache<T> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 30 * 60 * 1000, // Default 30 minutes
      maxEntries: options.maxEntries || 100,
      storage: options.storage || 'memory'
    };

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Generates a cache key from multiple parameters
   */
  private generateKey(params: any[]): string {
    return params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join('|');
  }

  /**
   * Sets a value in the cache
   */
  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      key
    };

    if (this.options.storage === 'localStorage') {
      this.setInLocalStorage(key, entry);
    } else {
      this.setInMemory(key, entry);
    }
  }

  /**
   * Gets a value from the cache
   */
  get(key: string): T | null {
    let entry: CacheEntry<T> | null = null;

    if (this.options.storage === 'localStorage') {
      entry = this.getFromLocalStorage(key);
    } else {
      entry = this.memoryCache.get(key) || null;
    }

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Deletes a value from the cache
   */
  delete(key: string): void {
    if (this.options.storage === 'localStorage') {
      localStorage.removeItem(`cache_${key}`);
    } else {
      this.memoryCache.delete(key);
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    if (this.options.storage === 'localStorage') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } else {
      this.memoryCache.clear();
    }
  }

  /**
   * Gets or sets a value using a generator function
   */
  async getOrSet<K>(
    key: string,
    generator: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await generator();
    this.set(key, data, customTtl);
    return data;
  }

  /**
   * Memory storage methods
   */
  private setInMemory(key: string, entry: CacheEntry<T>): void {
    // Enforce max entries limit
    if (this.memoryCache.size >= this.options.maxEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * LocalStorage methods
   */
  private setInLocalStorage(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('LocalStorage cache write failed:', error);
      // Fallback to memory storage
      this.setInMemory(key, entry);
    }
  }

  private getFromLocalStorage(key: string): CacheEntry<T> | null {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('LocalStorage cache read failed:', error);
      return null;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    if (this.options.storage === 'localStorage') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '');
            if (entry.expiresAt < now) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      });
    } else {
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt < now) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    memoryUsage?: number;
    hitRate?: number;
  } {
    const size = this.options.storage === 'localStorage' 
      ? Object.keys(localStorage).filter(k => k.startsWith('cache_')).length
      : this.memoryCache.size;

    return { size };
  }
}

// Create singleton instances for different data types
export const quizCache = new Cache<any>({
  ttl: 60 * 60 * 1000, // 1 hour for quiz data
  storage: 'localStorage'
});

export const pdfCache = new Cache<any>({
  ttl: 24 * 60 * 60 * 1000, // 24 hours for PDF content
  storage: 'localStorage'
});

export const apiCache = new Cache<any>({
  ttl: 15 * 60 * 1000, // 15 minutes for API responses
  storage: 'memory'
});

/**
 * Utility functions for common caching operations
 */
export const cacheUtils = {
  /**
   * Generates a hash for text content
   */
  generateTextHash: (text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },

  /**
   * Creates a cache key for quiz generation
   */
  createQuizKey: (textHash: string, options: any): string => {
    return `quiz_${textHash}_${JSON.stringify(options)}`;
  },

  /**
   * Creates a cache key for PDF parsing
   */
  createPdfKey: (fileName: string, fileSize: number): string => {
    return `pdf_${fileName}_${fileSize}`;
  },

  /**
   * Clears all quiz-related cache
   */
  clearQuizCache: (): void => {
    quizCache.clear();
  },

  /**
   * Gets cache size in a human-readable format
   */
  getCacheSizeInfo: (): string => {
    const quizStats = quizCache.getStats();
    const pdfStats = pdfCache.getStats();
    const apiStats = apiCache.getStats();
    
    const total = quizStats.size + pdfStats.size + apiStats.size;
    return `Cache: ${total} entries (Quiz: ${quizStats.size}, PDF: ${pdfStats.size}, API: ${apiStats.size})`;
  }
};