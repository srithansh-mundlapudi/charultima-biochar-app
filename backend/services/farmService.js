const pool = require('../db/pool');

const createFarm = async (userId, farmData) => {
  const { farmName, locationName, latitude, longitude } = farmData;

  const result = await pool.query(
    `INSERT INTO farms (user_id, farm_name, location_name, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, farmName, locationName, latitude, longitude]
  );

  return result.rows[0];
};

const getFarmsByUser = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM farms WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const getFarmById = async (farmId, userId) => {
  const result = await pool.query('SELECT * FROM farms WHERE id = $1 AND user_id = $2', [
    farmId,
    userId,
  ]);
  return result.rows[0];
};

module.exports = { createFarm, getFarmsByUser, getFarmById };
