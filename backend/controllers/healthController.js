const pool = require('../db/pool');
const { getClient } = require('../services/cacheService');

const health = async (req, res) => {
  const checks = {
    postgres: false,
    redis: false,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  try {
    await pool.query('SELECT 1');
    checks.postgres = true;
  } catch (err) {
    checks.postgres = false;
  }

  try {
    const redis = getClient();
    if (redis) {
      await redis.ping();
      checks.redis = true;
    }
  } catch (err) {
    checks.redis = false;
  }

  const isHealthy = checks.postgres && checks.redis;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
};

const ready = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
};

module.exports = { health, ready };
