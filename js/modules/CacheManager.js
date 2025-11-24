// CacheManager.js - 快取管理模組
class CacheManager {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = new Map(); // 記錄存取時間
    }

    // 生成快取鍵
    generateKey(prefix, data) {
        try {
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            return `${prefix}:${dataString}`;
        } catch (error) {
            console.error('生成快取鍵失敗:', error);
            return null;
        }
    }

    // 取得快取
    get(key) {
        if (!key || !this.cache.has(key)) {
            return null;
        }

        // 更新存取時間
        this.accessOrder.set(key, Date.now());

        const cached = this.cache.get(key);

        // 檢查是否過期
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
            return null;
        }

        return cached.value;
    }

    // 設定快取
    set(key, value, ttl = null) {
        if (!key) {
            return false;
        }

        // 如果快取已滿，移除最舊的項目
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictOldest();
        }

        const cacheEntry = {
            value: value,
            createdAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : null
        };

        this.cache.set(key, cacheEntry);
        this.accessOrder.set(key, Date.now());

        return true;
    }

    // 移除最舊的快取項目（LRU）
    evictOldest() {
        if (this.accessOrder.size === 0) {
            return;
        }

        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, time] of this.accessOrder.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.accessOrder.delete(oldestKey);
        }
    }

    // 檢查快取是否存在
    has(key) {
        if (!key || !this.cache.has(key)) {
            return false;
        }

        const cached = this.cache.get(key);

        // 檢查是否過期
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
            return false;
        }

        return true;
    }

    // 刪除特定快取
    delete(key) {
        if (!key) {
            return false;
        }

        this.cache.delete(key);
        this.accessOrder.delete(key);
        return true;
    }

    // 清空所有快取
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
    }

    // 清理過期的快取
    cleanupExpired() {
        const now = Date.now();
        const keysToDelete = [];

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        });

        return keysToDelete.length;
    }

    // 取得快取統計資訊
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            usage: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%',
            keys: Array.from(this.cache.keys())
        };
    }

    // 取得特定前綴的快取數量
    countByPrefix(prefix) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                count++;
            }
        }
        return count;
    }

    // 清除特定前綴的快取
    clearByPrefix(prefix) {
        const keysToDelete = [];

        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        });

        return keysToDelete.length;
    }
}

// 創建單例實例
const cacheManager = new CacheManager(50);

// 自動定期清理過期快取（每 5 分鐘）
setInterval(() => {
    const cleaned = cacheManager.cleanupExpired();
    if (cleaned > 0) {
        console.log(`清理了 ${cleaned} 個過期快取項目`);
    }
}, 5 * 60 * 1000);

// 導出供其他模組使用
window.CacheManager = cacheManager;
