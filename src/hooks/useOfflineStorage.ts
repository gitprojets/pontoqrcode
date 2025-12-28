import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'frequencia-qr-offline';
const DB_VERSION = 1;

interface OfflineRecord<T> {
  id: string;
  data: T;
  timestamp: number;
  synced: boolean;
}

interface PendingAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: T;
  timestamp: number;
}

class OfflineDB {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('table', 'table', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for pending sync actions
        if (!db.objectStoreNames.contains('pendingActions')) {
          const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
          pendingStore.createIndex('table', 'table', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for user session
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return this.init();
  }

  // Cache operations
  async setCache<T>(table: string, key: string, data: T): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      store.put({ key: `${table}:${key}`, table, data, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCache<T>(table: string, key: string): Promise<T | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readonly');
      const store = tx.objectStore('cache');
      const request = store.get(`${table}:${key}`);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCache<T>(table: string): Promise<T[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readonly');
      const store = tx.objectStore('cache');
      const index = store.index('table');
      const request = index.getAll(table);
      request.onsuccess = () => {
        const results = request.result.map(item => item.data);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(table?: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      
      if (table) {
        const index = store.index('table');
        const request = index.openCursor(table);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } else {
        store.clear();
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Pending actions operations
  async addPendingAction<T>(action: Omit<PendingAction<T>, 'id' | 'timestamp'>): Promise<string> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      store.add({ ...action, id, timestamp: Date.now() });
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingActions<T>(): Promise<PendingAction<T>[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingActions', 'readonly');
      const store = tx.objectStore('pendingActions');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingAction(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingCount(): Promise<number> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingActions', 'readonly');
      const store = tx.objectStore('pendingActions');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Session operations
  async setSession(key: string, value: unknown): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('session', 'readwrite');
      const store = tx.objectStore('session');
      store.put({ key, value, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSession<T>(key: string): Promise<T | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('session', 'readonly');
      const store = tx.objectStore('session');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSession(): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('session', 'readwrite');
      const store = tx.objectStore('session');
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

const offlineDB = new OfflineDB();

export function useOfflineStorage<T>(table: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    offlineDB.init().then(() => {
      setIsInitialized(true);
      offlineDB.getPendingCount().then(setPendingCount);
    });
  }, []);

  const setItem = useCallback(async (key: string, data: T) => {
    await offlineDB.setCache(table, key, data);
  }, [table]);

  const getItem = useCallback(async (key: string): Promise<T | null> => {
    return offlineDB.getCache<T>(table, key);
  }, [table]);

  const getAllItems = useCallback(async (): Promise<T[]> => {
    return offlineDB.getAllCache<T>(table);
  }, [table]);

  const addPendingAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    data: T
  ): Promise<string> => {
    const id = await offlineDB.addPendingAction({ type, table, data });
    const count = await offlineDB.getPendingCount();
    setPendingCount(count);
    return id;
  }, [table]);

  const getPendingActions = useCallback(async () => {
    return offlineDB.getPendingActions<T>();
  }, []);

  const removePendingAction = useCallback(async (id: string) => {
    await offlineDB.removePendingAction(id);
    const count = await offlineDB.getPendingCount();
    setPendingCount(count);
  }, []);

  const clearCache = useCallback(async () => {
    await offlineDB.clearCache(table);
  }, [table]);

  return {
    isInitialized,
    pendingCount,
    setItem,
    getItem,
    getAllItems,
    addPendingAction,
    getPendingActions,
    removePendingAction,
    clearCache,
  };
}

// Export for direct usage
export { offlineDB };
