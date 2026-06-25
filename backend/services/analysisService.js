const pool = require('../db/pool');

// Soil and crop constants (same as your frontend)
const SOIL_DATA = {
  'Sandy Soil': 20,
  'Loamy Soil': 25,
  'Clay Soil': 35,
  'Peat Soil': 40,
};

const CROP_DATA = {
  Corn: 27.5,
  Wheat: 22.5,
  Soybeans: 12.5,
  Tomatoes: 40,
  Potatoes: 32.5,
  Carrots: 25,
  Lettuce: 27.5,
  Rice: 25,
  'Fruit Trees': 15,
};

const METERS_TO_ACRES = 4046.86;
const NITROGEN_RETENTION_RATE = 0.4;
const BIOCHAR_EFFECTIVENESS = 1.1;
const BIOCHAR_DENSITY = 10; // tons/acre

// =======================
// CALCULATIONS
// =======================

const calculateRecommendedNitrogen = (soilType, cropType) => {
  const soilNitrogen = SOIL_DATA[soilType] || 25;
  const cropNitrogen = CROP_DATA[cropType] || 25;
  return (soilNitrogen + cropNitrogen) / 2;
};

const calculateBiocharForZone = (nitrogenLevel, recommendedNitrogen, cellAreaMeters) => {
  const nitrogenDeficit = nitrogenLevel - recommendedNitrogen;

  if (nitrogenDeficit <= 0) {
    return {
      recommendation: 'No biochar needed',
      biocharNeeded: 0,
      applicationRate: 0,
      totalAmount: 0,
      deficit: 0,
    };
  }

  const biocharNeeded = nitrogenDeficit / (NITROGEN_RETENTION_RATE * BIOCHAR_EFFECTIVENESS);
  const applicationRate = biocharNeeded / BIOCHAR_DENSITY;
  const cellAreaAcres = cellAreaMeters / METERS_TO_ACRES;
  const totalBiochar = applicationRate * cellAreaAcres;

  return {
    recommendation: `${applicationRate.toFixed(2)} tons/acre (${totalBiochar.toFixed(2)} tons total)`,
    biocharNeeded: biocharNeeded.toFixed(2),
    applicationRate: applicationRate.toFixed(2),
    totalAmount: totalBiochar.toFixed(2),
    deficit: nitrogenDeficit.toFixed(2),
  };
};

const calculateAllBiochar = (nitrogenLevels, recommendedNitrogen, cellAreaMeters) => {
  const recommendations = {};

  Object.entries(nitrogenLevels).forEach(([zone, level]) => {
    recommendations[zone] = calculateBiocharForZone(level, recommendedNitrogen, cellAreaMeters);
  });

  const cells = Object.keys(nitrogenLevels).length;
  const totalBiochar = Object.values(recommendations).reduce(
    (sum, r) => sum + parseFloat(r.totalAmount || 0),
    0
  );

  recommendations.summary = {
    totalCells: cells,
    totalBiocharNeeded: totalBiochar.toFixed(2),
    averageBiocharPerCell: (totalBiochar / cells).toFixed(2),
  };

  return recommendations;
};

// =======================
// CRUD OPERATIONS
// =======================

const saveAnalysis = async (userId, farmId, analysisData) => {
  const {
    imageUrl,
    nitrogenLevel,
    nitrogenStatus,
    biocharAmount,
    confidence,
    analysisMethod,
    cropType,
    soilType,
  } = analysisData;

  const result = await pool.query(
    `INSERT INTO analyses (user_id, farm_id, image_url, nitrogen_level, nitrogen_status, biochar_amount, confidence, analysis_method, crop_type, soil_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      userId,
      farmId,
      imageUrl,
      nitrogenLevel,
      nitrogenStatus,
      biocharAmount,
      confidence,
      analysisMethod,
      cropType,
      soilType,
    ]
  );

  return result.rows[0];
};

const getAnalysesByUser = async (userId, farmId = null, limit = 100, offset = 0, search = null) => {
  let query = 'SELECT * FROM analyses WHERE user_id = $1';
  let params = [userId];
  let paramCount = 2;

  if (farmId) {
    query += ` AND farm_id = $${paramCount}`;
    params.push(farmId);
    paramCount++;
  }

  if (search) {
    query += ` AND (crop_type ILIKE $${paramCount} OR soil_type ILIKE $${paramCount} OR nitrogen_status ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
};

const getAnalysisById = async (id, userId) => {
  const result = await pool.query(
    'SELECT * FROM analyses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
};

const updateAnalysis = async (id, userId, data) => {
  const { nitrogenLevel, nitrogenStatus, cropType, soilType, biocharAmount } = data;

  const result = await pool.query(
    `UPDATE analyses 
     SET nitrogen_level = $1, nitrogen_status = $2, crop_type = $3, soil_type = $4, biochar_amount = $5
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [nitrogenLevel, nitrogenStatus, cropType, soilType, biocharAmount, id, userId]
  );

  return result.rows[0];
};

const deleteAnalysis = async (id, userId) => {
  const result = await pool.query(
    'DELETE FROM analyses WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0];
};

// =======================
// ANALYTICS & DASHBOARDS
// =======================

const getTrendAnalytics = async (userId, farmId = null, days = 30) => {
  let query = `
    SELECT 
      DATE(created_at) as date,
      AVG(nitrogen_level) as avg_nitrogen,
      COUNT(*) as analysis_count
    FROM analyses 
    WHERE user_id = $1 
      AND created_at > NOW() - $2::INTERVAL
  `;
  let params = [userId, `${days} days`];

  if (farmId) {
    query += ' AND farm_id = $3';
    params.push(farmId);
  }

  query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

const getDashboardStats = async (userId, farmId = null) => {
  let query = `
    SELECT 
      COUNT(*) as total_analyses,
      AVG(nitrogen_level) as avg_nitrogen,
      AVG(biochar_amount) as avg_biochar,
      SUM(biochar_amount) as total_biochar,
      MIN(nitrogen_level) as min_nitrogen,
      MAX(nitrogen_level) as max_nitrogen
    FROM analyses
    WHERE user_id = $1
  `;
  let params = [userId];

  if (farmId) {
    query += ' AND farm_id = $2';
    params.push(farmId);
  }

  const result = await pool.query(query, params);
  return result.rows[0];
};

const getHistoricalDashboard = async (userId, farmId = null, days = 90) => {
  // Overall stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_analyses,
      AVG(nitrogen_level) as avg_nitrogen,
      AVG(biochar_amount) as avg_biochar,
      SUM(biochar_amount) as total_biochar,
      MIN(nitrogen_level) as min_nitrogen,
      MAX(nitrogen_level) as max_nitrogen
    FROM analyses
    WHERE user_id = $1
    ${farmId ? 'AND farm_id = $2' : ''}
    AND created_at > NOW() - INTERVAL '${days} days'
  `;
  const statsParams = [userId, farmId].filter(Boolean);
  const statsResult = await pool.query(statsQuery, statsParams);

  // Weekly trend
  const trendQuery = `
    SELECT 
      DATE_TRUNC('week', created_at) as week,
      AVG(nitrogen_level) as avg_nitrogen,
      COUNT(*) as analysis_count
    FROM analyses
    WHERE user_id = $1
    ${farmId ? 'AND farm_id = $2' : ''}
    AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week DESC
  `;
  const trendParams = [userId, farmId].filter(Boolean);
  const trendResult = await pool.query(trendQuery, trendParams);

  // Nitrogen distribution
  const distQuery = `
    SELECT 
      CASE 
        WHEN nitrogen_level < 30 THEN 'Deficient'
        WHEN nitrogen_level < 60 THEN 'Moderate'
        ELSE 'Healthy'
      END as status,
      COUNT(*) as count
    FROM analyses
    WHERE user_id = $1
    ${farmId ? 'AND farm_id = $2' : ''}
    GROUP BY status
  `;
  const distParams = [userId, farmId].filter(Boolean);
  const distResult = await pool.query(distQuery, distParams);

  return {
    stats: statsResult.rows[0] || {
      total_analyses: 0,
      avg_nitrogen: 0,
      avg_biochar: 0,
      total_biochar: 0,
      min_nitrogen: 0,
      max_nitrogen: 0,
    },
    trends: trendResult.rows,
    distribution: distResult.rows,
    timeRange: `${days} days`,
  };
};

module.exports = {
  SOIL_DATA,
  CROP_DATA,
  calculateRecommendedNitrogen,
  calculateBiocharForZone,
  calculateAllBiochar,
  saveAnalysis,
  getAnalysesByUser,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  getTrendAnalytics,
  getDashboardStats,
  getHistoricalDashboard,
};