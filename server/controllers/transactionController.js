const Transaction = require('../models/transactionModel');
const { autoCategorizeDescription } = require('../utils/aiEngine');

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findByUserId(req.user);
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createTransaction = async (req, res) => {
    let { categoryId, amount, date, note, source } = req.body;

    if (!amount || !date) {
        return res.status(400).json({ message: 'Amount and date are required' });
    }

    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a valid positive number' });
    }

    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) {
        return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }
    const safeDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    if (!categoryId && note) {
        const suggestedName = autoCategorizeDescription(note);
        if (suggestedName) {
            try {
                const mongoose = require('mongoose');
                const CategoryModel = mongoose.model('Category');
                const matchedCategory = await CategoryModel.findOne({ user_id: req.user, name: suggestedName }).lean();
                if (matchedCategory) {
                    categoryId = matchedCategory._id.toString();
                }
            } catch (err) {
                console.error("Auto categorization error:", err);
            }
        }
    }

    let warning = null;
    if (categoryId) {
        try {
            const monthStr = date.slice(0, 7);
            const mongoose = require('mongoose');
            const BudgetModel = mongoose.model('Budget');
            const TransactionModel = mongoose.model('Transaction');
            
            const budget = await BudgetModel.findOne({ user_id: req.user, category_id: categoryId, month: monthStr }).lean();
            if (budget) {
                const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
                const endDate = new Date(Date.UTC(y, m, 1, 23, 59, 59));
                const existingTxns = await TransactionModel.find({
                    user_id: req.user,
                    category_id: categoryId,
                    date: { $gte: startDate, $lte: endDate }
                });
                const spent = existingTxns.reduce((sum, t) => sum + Number(t.amount), 0);
                if (spent + amount > budget.limit_amount) {
                    warning = `Warning: This transaction exceeds your budget limit of ₹${budget.limit_amount} for this category. (Spent so far: ₹${spent}, with this adding ₹${amount}.)`;
                }
            }
        } catch (err) {
            console.error("Budget check error:", err);
        }
    }

    try {
        const txnId = await Transaction.create(
            req.user,
            categoryId || null,
            amount,
            safeDate,
            note || '',
            source || 'manual'
        );

        res.status(201).json({
            txnId,
            categoryId,
            amount,
            date,
            note: note || '',
            source: source || 'manual',
            warning
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTransaction = async (req, res) => {
    const { id } = req.params;
    let { categoryId, amount, date, note } = req.body;

    if (!amount || !date) {
        return res.status(400).json({ message: 'Amount and date are required' });
    }

    amount = Number(amount);
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a valid positive number' });
    }

    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) {
        return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }
    const safeDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    let warning = null;
    if (categoryId) {
        try {
            const monthStr = date.slice(0, 7);
            const mongoose = require('mongoose');
            const BudgetModel = mongoose.model('Budget');
            const TransactionModel = mongoose.model('Transaction');
            
            const budget = await BudgetModel.findOne({ user_id: req.user, category_id: categoryId, month: monthStr }).lean();
            if (budget) {
                const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
                const endDate = new Date(Date.UTC(y, m, 1, 23, 59, 59));
                const existingTxns = await TransactionModel.find({
                    user_id: req.user,
                    category_id: categoryId,
                    date: { $gte: startDate, $lte: endDate },
                    _id: { $ne: id } // exclude current transaction
                });
                const spent = existingTxns.reduce((sum, t) => sum + Number(t.amount), 0);
                if (spent + amount > budget.limit_amount) {
                    warning = `Warning: Updating this transaction exceeds your budget limit of ₹${budget.limit_amount} for this category. (Other spent: ₹${spent}, with this adding ₹${amount}.)`;
                }
            }
        } catch (err) {
            console.error("Budget check error:", err);
        }
    }

    try {
        const affected = await Transaction.update(
            id, req.user, categoryId || null, amount, safeDate, note || ''
        );
        if (affected === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }
        res.json({ message: 'Transaction updated successfully', warning });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const affected = await Transaction.delete(id, req.user);
        if (affected === 0) {
            return res.status(404).json({ message: 'Transaction not found or unauthorized' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};