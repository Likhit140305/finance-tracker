const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const Budget = require('../models/budgetModel');
const aiEngine = require('../utils/aiEngine');

exports.getMonthlyInsights = async (req, res) => {
    const { month } = req.query; // format: YYYY-MM
    const userId = req.user;

    if (!month) {
        return res.status(400).json({ message: 'Month query parameter is required (YYYY-MM)' });
    }

    try {
        const [year, mon] = month.split('-').map(Number);

        // Use UTC noon boundaries — matches how transactions are stored (UTC noon)
        // Start: first day of month at 00:00 UTC
        // End:   first day of NEXT month at 23:59 UTC (inclusive of last day stored at noon)
        const startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0));
        const endDate   = new Date(Date.UTC(year, mon, 1, 23, 59, 59));

        // Load all categories for this user into a map
        const categories = await Category.findByUserId(userId);
        const catMap = {};
        categories.forEach(c => {
            catMap[c.category_id] = c;
        });

        // Query transactions directly via Mongoose model (raw, for date filtering)
        // Query all transactions for AI engines (predictions, anomalies)
        const TransactionModel = mongoose.model('Transaction');
        const allTransactions = await TransactionModel.find({ user_id: userId }).sort({ date: 1 }).lean();

        // Query transactions directly via Mongoose model (raw, for date filtering)
        const transactions = allTransactions.filter(t => t.date >= startDate && t.date <= endDate);

        let totalIncome  = 0;
        let totalExpense = 0;
        let needsExpense = 0;
        let wantsExpense = 0;
        const categoryBreakdownMap = {};

        transactions.forEach(t => {
            // category_id is stored as String in your schema
            const catId = t.category_id ? t.category_id.toString() : null;
            const cat   = catId ? catMap[catId] : null;

            const amt = Number(t.amount);

            if (!cat) {
                // Uncategorized transactions are treated as expenses on the UI
                totalExpense += amt;
                categoryBreakdownMap['uncategorized'] = (categoryBreakdownMap['uncategorized'] || 0) + amt;
                return;
            }

            if (cat.type === 'income') {
                totalIncome += amt;
            } else if (cat.type === 'expense') {
                totalExpense += amt;
                categoryBreakdownMap[catId] = (categoryBreakdownMap[catId] || 0) + amt;
                
                // Track Needs vs Wants for 50-30-20
                if (['rent', 'groceries', 'transport (ola/uber/metro)', 'electricity', 'water', 'utilities', 'insurance'].includes(cat.name.toLowerCase())) {
                    needsExpense += amt;
                } else {
                    wantsExpense += amt;
                }
            }
        });

        const categoryBreakdown = Object.keys(categoryBreakdownMap)
            .map(catId => ({
                category:    catId === 'uncategorized' ? 'Uncategorized' : (catMap[catId]?.name || 'Unknown'),
                amount:      categoryBreakdownMap[catId],
                category_id: catId === 'uncategorized' ? null : catId
            }))
            .sort((a, b) => b.amount - a.amount);

        // Load budgets and compute spent per budget category
        const budgets = await Budget.findByUserIdAndMonth(userId, month);

        const budgetProgress = budgets.map(b => {
            const catId = b.category_id ? b.category_id.toString() : null;

            const spent = transactions
                .filter(t => {
                    const tCatId = t.category_id ? t.category_id.toString() : null;
                    const cat    = tCatId ? catMap[tCatId] : null;
                    return tCatId === catId && cat?.type === 'expense';
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return {
                budget_id:     b.budget_id,
                category_id:   catId,
                category_name: b.category_name || catMap[catId]?.name || 'Unknown',
                limit_amount:  Number(b.limit_amount),
                spent
            };
        });

        // --- AI Engine Computations ---
        // Calculate health score with budget progress
        const healthScore = aiEngine.calculateHealthScore(totalIncome, totalExpense, budgetProgress);
        
        // Predict next month's average expense based on all transactions
        const prediction = aiEngine.predictNextMonthExpenses(allTransactions);
        
        // Detect anomalies in all transactions
        const anomalies = aiEngine.detectAnomalies(allTransactions);
        
        // Savings tips
        const savingsTips = aiEngine.getSavingsTips(needsExpense, wantsExpense, totalIncome);

        res.json({
            totals: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense
            },
            categoryBreakdown,
            budgetProgress,
            ai: {
                healthScore,
                prediction,
                anomalies,
                savingsTips
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
