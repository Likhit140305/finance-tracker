const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', insightController.getMonthlyInsights);

module.exports = router;
