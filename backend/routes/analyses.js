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

/**
 * @swagger
 * tags:
 *   name: Analyses
 *   description: Analysis endpoints
 */

// =======================
// PUBLIC ROUTES (No Auth)
// =======================

/**
 * @swagger
 * /api/analyses/calculate:
 *   post:
 *     summary: Calculate biochar without saving
 *     tags: [Analyses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nitrogenLevels
 *               - soilType
 *               - cropType
 *               - cellLength
 *               - cellWidth
 *             properties:
 *               nitrogenLevels:
 *                 type: object
 *                 description: Object mapping zone names to nitrogen levels
 *                 example: { "zone1": 30, "zone2": 50 }
 *               soilType:
 *                 type: string
 *                 enum: [Sandy Soil, Loamy Soil, Clay Soil, Peat Soil]
 *               cropType:
 *                 type: string
 *                 enum: [Corn, Wheat, Soybeans, Tomatoes, Potatoes, Carrots, Lettuce, Rice, Fruit Trees]
 *               cellLength:
 *                 type: number
 *                 description: Cell length in meters
 *               cellWidth:
 *                 type: number
 *                 description: Cell width in meters
 *     responses:
 *       200:
 *         description: Biochar calculation results
 *       400:
 *         description: Invalid input
 */
router.post('/calculate', calculateBiochar);

// =======================
// PROTECTED ROUTES (Auth Required)
// =======================
router.use(checkJwt);
router.use((req, res, next) => {
  req.userId = getUserIdFromToken(req);
  next();
});

/**
 * @swagger
 * /api/analyses:
 *   post:
 *     summary: Create a new analysis
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnalysisRequest'
 *     responses:
 *       201:
 *         description: Analysis created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all analyses for the authenticated user
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: integer
 *         description: Filter by farm ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by crop type, soil type, or status
 *     responses:
 *       200:
 *         description: List of analyses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Analysis'
 *       401:
 *         description: Unauthorized
 */
router.post('/', createAnalysis);
router.get('/', getAnalyses);

/**
 * @swagger
 * /api/analyses/{id}:
 *   put:
 *     summary: Update an analysis
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nitrogenLevel:
 *                 type: number
 *               nitrogenStatus:
 *                 type: string
 *                 enum: [deficient, moderate, healthy]
 *               cropType:
 *                 type: string
 *               soilType:
 *                 type: string
 *               biocharAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated analysis
 *       404:
 *         description: Analysis not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete an analysis
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Analysis deleted successfully
 *       404:
 *         description: Analysis not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', updateAnalysis);
router.delete('/:id', deleteAnalysis);

/**
 * @swagger
 * /api/analyses/trends:
 *   get:
 *     summary: Get trend analytics over time
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Trend data
 *       401:
 *         description: Unauthorized
 */
router.get('/trends', getTrends);

/**
 * @swagger
 * /api/analyses/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/analyses/dashboard/historical:
 *   get:
 *     summary: Get historical dashboard data
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farmId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *     responses:
 *       200:
 *         description: Historical dashboard data
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/historical', getHistoricalDashboard);

module.exports = router;
