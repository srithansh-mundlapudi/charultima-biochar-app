const farmService = require('../services/farmService');

const createFarm = async (req, res) => {
  const { farmName, locationName, latitude, longitude } = req.body;
  const userId = req.userId;

  // Input validation
  if (!farmName || !locationName || latitude === undefined || longitude === undefined) {
    return res
      .status(400)
      .json({ error: 'farmName, locationName, latitude, and longitude are required' });
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude and longitude must be numbers' });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const farm = await farmService.createFarm(userId, {
      farmName,
      locationName,
      latitude,
      longitude,
    });
    res.status(201).json(farm);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: err.message });
  }
};

const getFarms = async (req, res) => {
  const userId = req.userId;

  try {
    const farms = await farmService.getFarmsByUser(userId);
    res.json(farms);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: err.message });
  }
};

const getFarmById = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const farm = await farmService.getFarmById(id, userId);
    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }
    res.json(farm);
  } catch (err) {
    if (err.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createFarm, getFarms, getFarmById };
