const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection using Render's connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Render PostgreSQL
  }
});

// Test endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create tables (run once)
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth0_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS farm_locations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        location_name TEXT,
        latitude DECIMAL(10, 6),
        longitude DECIMAL(10, 6),
        saved_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        image_url TEXT,
        nitrogen_level DECIMAL(5, 2),
        nitrogen_status TEXT,
        biochar_amount DECIMAL(5, 2),
        crop_type TEXT,
        soil_type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    res.json({ message: 'Tables created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save farm location
app.post('/api/farm-locations', async (req, res) => {
  const { userId, locationName, latitude, longitude } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO farm_locations (user_id, location_name, latitude, longitude)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, locationName, latitude, longitude]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get farm locations
app.get('/api/farm-locations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM farm_locations WHERE user_id = $1 ORDER BY saved_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});