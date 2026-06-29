const pool = require('../db/pool');

// Helper: Get internal user ID from auth0_id
const getInternalUserId = async (auth0Id) => {
  const result = await pool.query(
    'SELECT id FROM users WHERE auth0_id = $1',
    [auth0Id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0].id;
};

const createFarm = async (userId, farmData) => {
  // Convert Auth0 sub to internal user ID
  const internalUserId = await getInternalUserId(userId);
  
  const { farmName, locationName, latitude, longitude } = farmData;

  const result = await pool.query(
    `INSERT INTO farms (user_id, farm_name, location_name, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [internalUserId, farmName, locationName, latitude, longitude]
  );

  return result.rows[0];
};

const getFarmsByUser = async (userId) => {
  // Convert Auth0 sub to internal user ID
  const internalUserId = await getInternalUserId(userId);
  
  const result = await pool.query(
    'SELECT * FROM farms WHERE user_id = $1 ORDER BY created_at DESC',
    [internalUserId]
  );
  return result.rows;
};

const getFarmById = async (farmId, userId) => {
  // Convert Auth0 sub to internal user ID
  const internalUserId = await getInternalUserId(userId);
  
  const result = await pool.query(
    'SELECT * FROM farms WHERE id = $1 AND user_id = $2',
    [farmId, internalUserId]
  );
  return result.rows[0];
};

module.exports = { createFarm, getFarmsByUser, getFarmById };
