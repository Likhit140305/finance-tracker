const express = require('express');
const router = express.Router();
const plannerController = require('../controllers/plannerController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', plannerController.getPlannerInfo);
router.post('/', plannerController.setPlannerInfo);
router.post('/scan', plannerController.uploadMiddleware, plannerController.scanReceipt);

module.exports = router;
