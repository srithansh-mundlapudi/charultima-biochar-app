const express = require('express');
const { createFarm, getFarms, getFarmById } = require('../controllers/farmController');
const { checkJwt, getUserIdFromToken } = require('../middleware/auth');

const router = express.Router();

router.use(checkJwt);
router.use((req, res, next) => {
  req.userId = getUserIdFromToken(req);
  next();
});

router.post('/', createFarm);
router.get('/', getFarms);
router.get('/:id', getFarmById); // NEW: Get single farm by ID

module.exports = router;
