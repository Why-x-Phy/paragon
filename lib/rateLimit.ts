// Einfaches In-Memory Rate-Limiting
// In Produktion sollte Redis oder eine Datenbank verwendet werden

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Prüft ob ein Request innerhalb der Rate-Limit-Grenzen liegt
 * @param identifier Eindeutiger Identifier (z.B. Wallet-Adresse oder IP)
 * @param maxRequests Maximale Anzahl Requests
 * @param windowMs Zeitfenster in Millisekunden
 * @returns true wenn Request erlaubt, false wenn limitiert
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 Minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier.toLowerCase();

  // Prüfe ob Eintrag existiert und noch gültig ist
  if (store[key] && store[key].resetTime > now) {
    if (store[key].count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: store[key].resetTime,
      };
    }
    
    store[key].count++;
    return {
      allowed: true,
      remaining: maxRequests - store[key].count,
      resetAt: store[key].resetTime,
    };
  }

  // Neuer Eintrag oder abgelaufen - reset
  store[key] = {
    count: 1,
    resetTime: now + windowMs,
  };

  // Cleanup alte Einträge (alle 5 Minuten)
  if (Math.random() < 0.01) {
    // 1% Chance bei jedem Request
    cleanupExpiredEntries();
  }

  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetAt: store[key].resetTime,
  };
}

function cleanupExpiredEntries() {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  });
}

/**
 * Holt Rate-Limit-Status ohne den Counter zu erhöhen
 */
export function getRateLimitStatus(
  identifier: string,
  maxRequests: number = 10
): { remaining: number; resetAt: number | null } {
  const key = identifier.toLowerCase();
  const entry = store[key];
  const now = Date.now();

  if (!entry || entry.resetTime <= now) {
    return {
      remaining: maxRequests,
      resetAt: null,
    };
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetTime,
  };
}

