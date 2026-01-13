/**
 * Shared fetch utility with retry logic and caching
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with exponential backoff retry
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx) - retry
      if (response.status >= 500 && i < retries - 1) {
        throw new Error(`Server error ${response.status}`);
      }

      return response;
    } catch (error) {
      // Last attempt - throw error
      if (i === retries - 1) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = 1000 * Math.pow(2, i);
      await sleep(delay);
    }
  }
}

/**
 * Simple in-memory cache for API responses
 */
class ResponseCache {
  constructor(ttl = 600000) {
    // Default 10 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance
const apiCache = new ResponseCache();

/**
 * Fetch with caching
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} cacheTTL - Cache time-to-live in ms (default: 10 minutes)
 * @returns {Promise<any>}
 */
export async function fetchWithCache(url, options = {}, cacheTTL = 600000) {
  const cacheKey = `${url}${JSON.stringify(options)}`;

  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch with retry
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = await response.json();

  // Store in cache
  apiCache.set(cacheKey, data);

  return data;
}

/**
 * Get timestamp for last update
 */
export function formatTimestamp(date = new Date()) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export { apiCache };
