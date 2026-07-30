const analysisService = require('../services/analysisService');
const { getCache, setCache, deletePattern } = require('../services/cacheService');

const CACHE_TTL = 300; // 5 minutes

// Helper: Get cache key for user
const getUserCacheKey = (userId, prefix, farmId = null) => {
  return `${prefix}:${userId}${farmId ? `:farm:${farmId}` : ''}`;
};

// Helper: Invalidate user's cache
const invalidateUserCache = async (userId) => {
  await deletePattern(`analyses:${userId}:*`);
  await deletePattern(`stats:${userId}:*`);
  await deletePattern(`trends:${userId}:*`);
};

const createAnalysis = async (req, res) => {
  const {
    farmId,
    imageUrl,
    nitrogenLevel,
    nitrogenStatus,
    biocharAmount,
    confidence,
    analysisMethod,
    cropType,
    soilType,
  } = req.body;
  const userId = req.userId;

  if (!farmId || nitrogenLevel === undefined || !nitrogenStatus) {
    return res.status(400).json({ error: 'farmId, nitrogenLevel, and nitrogenStatus are required' });
  }

  try {
    const analysis = await analysisService.saveAnalysis(userId, farmId, {
      imageUrl,
      nitrogenLevel,
      nitrogenStatus,
      biocharAmount,
      confidence,
      analysisMethod,
      cropType,
      soilType,
    });

    // Invalidate user's cache after creating new analysis
    await invalidateUserCache(userId);

    res.status(201).json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAnalyses = async (req, res) => {
  const userId = req.userId;
  const { farmId, limit = 100, offset = 0, search } = req.query;

  try {
    const start = Date.now();
    const cacheKey = getUserCacheKey(userId, 'analyses', farmId);
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const analyses = await analysisService.getAnalysesByUser(userId, farmId, limit, offset, search);
    
    if (analyses && analyses.length > 0) {
      await setCache(cacheKey, analyses, CACHE_TTL);
    }

    res.json(analyses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  const userId = req.userId;
  const { farmId } = req.query;

  try {
    const start = Date.now();
    const cacheKey = getUserCacheKey(userId, 'stats', farmId);
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const stats = await analysisService.getDashboardStats(userId, farmId);
    
    await setCache(cacheKey, stats, CACHE_TTL);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTrends = async (req, res) => {
  const userId = req.userId;
  const { farmId, days } = req.query;
  const daysInt = days ? parseInt(days, 10) : 30;

  try {
    const start = Date.now();
    const cacheKey = getUserCacheKey(userId, `trends:${daysInt}`, farmId);
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const trends = await analysisService.getTrendAnalytics(userId, farmId, daysInt);
    
    await setCache(cacheKey, trends, CACHE_TTL);

    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateAnalysis = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { nitrogenLevel, nitrogenStatus, cropType, soilType, biocharAmount } = req.body;

  try {
    const updated = await analysisService.updateAnalysis(id, userId, {
      nitrogenLevel,
      nitrogenStatus,
      cropType,
      soilType,
      biocharAmount,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Invalidate user's cache
    await invalidateUserCache(userId);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteAnalysis = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const deleted = await analysisService.deleteAnalysis(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Invalidate user's cache
    await invalidateUserCache(userId);

    res.json({ message: 'Analysis deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHistoricalDashboard = async (req, res) => {
  const userId = req.userId;
  const { farmId, days = 90 } = req.query;
  const daysInt = parseInt(days, 10);

  try {
    const start = Date.now();
    const cacheKey = getUserCacheKey(userId, `historical:${daysInt}`, farmId);
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const dashboard = await analysisService.getHistoricalDashboard(userId, farmId, daysInt);
    
    await setCache(cacheKey, dashboard, CACHE_TTL);

    res.json(dashboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const calculateBiochar = async (req, res) => {
  const { nitrogenLevels, soilType, cropType, cellLength, cellWidth } = req.body;

  if (!nitrogenLevels || !soilType || !cropType || !cellLength || !cellWidth) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (typeof nitrogenLevels !== 'object' || Array.isArray(nitrogenLevels)) {
    return res.status(400).json({ error: 'nitrogenLevels must be an object' });
  }

  if (cellLength <= 0 || cellWidth <= 0) {
    return res.status(400).json({ error: 'cellLength and cellWidth must be positive numbers' });
  }

  const cellArea = cellLength * cellWidth;
  const recommendedNitrogen = analysisService.calculateRecommendedNitrogen(soilType, cropType);
  const recommendations = analysisService.calculateAllBiochar(
    nitrogenLevels,
    recommendedNitrogen,
    cellArea
  );

  res.json({ recommendations, recommendedNitrogen, cellArea });
};

module.exports = {
  createAnalysis,
  getAnalyses,
  getDashboardStats,
  getTrends,
  updateAnalysis,
  deleteAnalysis,
  getHistoricalDashboard,
  calculateBiochar,
};