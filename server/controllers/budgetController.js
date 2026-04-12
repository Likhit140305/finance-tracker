const Budget = require('../models/budgetModel');

exports.getBudgets = async (req, res) => {
    const { month } = req.query;
    
    if (!month) {
        return res.status(400).json({ message: 'Month query parameter is required (YYYY-MM)' });
    }

    try {
        const budgets = await Budget.findByUserIdAndMonth(req.user, month);
        res.json(budgets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.upsertBudget = async (req, res) => {
    const { categoryId, limitAmount, month } = req.body;

    if (!categoryId || !limitAmount || !month) {
        return res.status(400).json({ message: 'Category, limit amount, and month are required' });
    }

    try {
        const budget = await Budget.createOrUpdate(req.user, categoryId, limitAmount, month);
        res.json({
            message: 'Budget set successfully',
            budget
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteBudget = async (req, res) => {
    const { id } = req.params;

    try {
        const affected = await Budget.delete(id, req.user);
        if (affected === 0) {
            return res.status(404).json({ message: 'Budget not found or unauthorized' });
        }
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};