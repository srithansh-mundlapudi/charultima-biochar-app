const express = require('express');
const {
  createAnalysis,
  getAnalyses,
  getTrends,
  calculateBiochar,
  deleteAnalysis,
  updateAnalysis,
  getDashboardStats,
  getHistoricalDashboard,
} = require('../controllers/analysisController');
const { checkJwt, getUserIdFromToken } = require('../middleware/auth');

const router = express.Router();

// =======================
// PUBLIC ROUTES (No Auth)
// =======================
// Calculate biochar without saving (quick estimation)
router.post('/calculate', calculateBiochar);

// =======================
// PROTECTED ROUTES (Auth Required)
// =======================
router.use(checkJwt);
router.use((req, res, next) => {
  req.userId = getUserIdFromToken(req);
  next();
});

// CRUD for analyses
router.post('/', createAnalysis);        // Create
router.get('/', getAnalyses);            // Read (all)
router.put('/:id', updateAnalysis);      // Update
router.delete('/:id', deleteAnalysis);   // Delete

// Analytics & Dashboards
router.get('/trends', getTrends);                   // Weekly/Monthly trends
router.get('/dashboard/stats', getDashboardStats);  // Stats summary
router.get('/dashboard/historical', getHistoricalDashboard); // Full dashboard

module.exports = router;