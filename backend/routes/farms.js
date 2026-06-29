const express = require('express');
const { createFarm, getFarms, getFarmById } = require('../controllers/farmController');
const { checkJwt, getUserIdFromToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Farms
 *   description: Farm management endpoints
 */

router.use(checkJwt);
router.use((req, res, next) => {
  req.userId = getUserIdFromToken(req);
  next();
});

/**
 * @swagger
 * /api/farms:
 *   post:
 *     summary: Create a new farm
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFarmRequest'
 *     responses:
 *       201:
 *         description: Farm created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farm'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createFarm);

/**
 * @swagger
 * /api/farms:
 *   get:
 *     summary: Get all farms for the authenticated user
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of farms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Farm'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getFarms);

/**
 * @swagger
 * /api/farms/{id}:
 *   get:
 *     summary: Get a farm by ID
 *     tags: [Farms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Farm ID
 *     responses:
 *       200:
 *         description: Farm details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Farm'
 *       404:
 *         description: Farm not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getFarmById);

module.exports = router;
