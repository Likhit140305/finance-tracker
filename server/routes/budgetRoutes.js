const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.upsertBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
