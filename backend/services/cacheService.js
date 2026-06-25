const redis = require('redis');

let redisClient = null;

// =======================
// METRICS TRACKING
// =======================
let hits = 0;
let misses = 0;
let cachedResponseTimes = [];
let uncachedResponseTimes = [];

const getMetrics = () => ({
  hits,
  misses,
  totalRequests: hits + misses,
  hitRate: hits + misses === 0 ? 0 : ((hits / (hits + misses)) * 100).toFixed(1),
  avgCachedMs: cachedResponseTimes.length === 0 ? 0 : (cachedResponseTimes.reduce((a,b) => a+b, 0) / cachedResponseTimes.length).toFixed(1),
  avgUncachedMs: uncachedResponseTimes.length === 0 ? 0 : (uncachedResponseTimes.reduce((a,b) => a+b, 0) / uncachedResponseTimes.length).toFixed(1),
});

const resetMetrics = () => {
  hits = 0;
  misses = 0;
  cachedResponseTimes = [];
  uncachedResponseTimes = [];
};

// =======================
// REDIS CONNECTION
// =======================
const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('✅ Connected to Redis'));

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    return null;
  }
};

const getClient = () => redisClient;

// =======================
// CACHE OPERATIONS
// =======================
const getCache = async (key) => {
  try {
    if (!redisClient) return null;
    const start = Date.now();
    const data = await redisClient.get(key);
    const duration = Date.now() - start;

    if (data) {
      hits++;
      cachedResponseTimes.push(duration);
      const hitRate = getMetrics().hitRate;
      console.log(`📦 Redis HIT: ${key} (${duration}ms) [Hit Rate: ${hitRate}%]`);
      return JSON.parse(data);
    }
    misses++;
    uncachedResponseTimes.push(duration);
    const hitRate = getMetrics().hitRate;
    console.log(`❌ Redis MISS: ${key} (${duration}ms) [Hit Rate: ${hitRate}%]`);
    return null;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

const setCache = async (key, value, ttl = 300) => {
  try {
    if (!redisClient) return false;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    console.log(`✅ Redis SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    console.error('Cache set error:', err);
    return false;
  }
};

const deleteCache = async (key) => {
  try {
    if (!redisClient) return false;
    await redisClient.del(key);
    console.log(`🗑️ Redis DEL: ${key}`);
    return true;
  } catch (err) {
    console.error('Cache delete error:', err);
    return false;
  }
};

const deletePattern = async (pattern) => {
  try {
    if (!redisClient) return false;
    let deleted = 0;
    const iterator = redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    });

    for await (const key of iterator) {
      await redisClient.del(key);
      deleted++;
    }
    console.log(`🗑️ Redis DEL pattern: ${pattern} (${deleted} keys)`);
    return true;
  } catch (err) {
    console.error('Cache delete pattern error:', err);
    return false;
  }
};

// =======================
// LOG METRICS TO CONSOLE
// =======================
const logMetrics = () => {
  const metrics = getMetrics();
  console.log('\n📊 ===== Redis Cache Metrics =====');
  console.log(`  Cache Hit Rate:  ${metrics.hitRate}%`);
  console.log(`  Hits: ${metrics.hits} | Misses: ${metrics.misses}`);
  console.log(`  Total Requests: ${metrics.totalRequests}`);
  console.log(`  Avg Cached: ${metrics.avgCachedMs}ms`);
  console.log(`  Avg Uncached: ${metrics.avgUncachedMs}ms`);
  console.log('================================\n');
  return metrics;
};

module.exports = {
  connectRedis,
  getClient,
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  getMetrics,
  resetMetrics,
  logMetrics,
};