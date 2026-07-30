const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const responseTime = require('response-time');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

dotenv.config();

const pool = require('./db/pool');
const farmRoutes = require('./routes/farms');
const analysisRoutes = require('./routes/analyses');
const { connectRedis, getMetrics, logMetrics } = require('./services/cacheService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Response time middleware (for latency metrics)
app.use(
  responseTime((req, res, time) => {
    console.log(`⏱️ ${req.method} ${req.originalUrl} - ${time.toFixed(2)} ms`);
  })
);

// =======================
// RATE LIMITING
// =======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.LOAD_TEST === 'true' ? 1000000 : 100, // 100 requests per window (raised for local load testing via LOAD_TEST env var)
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// =======================
// SWAGGER / OPENAPI
// =======================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// =======================
// HEALTH CHECK (Public)
// =======================
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now, deployTest: 'cd-verified-v1' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// USER REGISTRATION (Public)
// =======================
app.post('/api/users', async (req, res) => {
  const { auth0Id, email } = req.body;

  if (!auth0Id || !email) {
    return res.status(400).json({ error: 'auth0Id and email are required' });
  }

  try {
    let result = await pool.query('SELECT * FROM users WHERE auth0_id = $1', [auth0Id]);

    if (result.rows.length === 0) {
      result = await pool.query('INSERT INTO users (auth0_id, email) VALUES ($1, $2) RETURNING *', [
        auth0Id,
        email,
      ]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// FARMS ROUTES (Protected)
// =======================
app.use('/api/farms', farmRoutes);

// =======================
// ANALYSES ROUTES (Protected)
// =======================
app.use('/api/analyses', analysisRoutes);

// =======================
// METRICS ENDPOINT
// =======================
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = getMetrics();
    logMetrics();
    res.json({
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// SETUP (Development only)
// =======================
app.get('/api/setup', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Setup disabled in production' });
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth0_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        farm_name TEXT NOT NULL,
        location_name TEXT,
        latitude DECIMAL(10, 6),
        longitude DECIMAL(10, 6),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER REFERENCES farms(id),
        user_id INTEGER REFERENCES users(id),
        image_url TEXT,
        nitrogen_level DECIMAL(5, 2),
        nitrogen_status TEXT,
        biochar_amount DECIMAL(5, 2),
        confidence DECIMAL(5, 2),
        analysis_method TEXT,
        crop_type TEXT,
        soil_type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_farms_user ON farms(user_id);
      CREATE INDEX IF NOT EXISTS idx_analyses_farm ON analyses(farm_id);
      CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_auth0 ON users(auth0_id);
    `);

    res.json({ message: 'Tables and indexes created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// ERROR HANDLING MIDDLEWARE
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const startServer = async () => {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📈 Metrics available at /api/metrics`);
      console.log(`📚 Swagger docs available at /api/docs`);
    });

    // Log metrics every 5 minutes
    setInterval(() => {
      logMetrics();
    }, 5 * 60 * 1000);
  };

  startServer();
}

module.exports = app;