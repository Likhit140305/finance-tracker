/**
 * aiEngine.js
 * Contains robust statistical and heuristic functions to power the AI Spending Insights Engine.
 */

// 1. Prediction using Simple Moving Average (SMA)
function predictNextMonthExpenses(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    
    // Group expenses by month
    const monthlyExpenses = {};
    transactions.forEach(t => {
        if (!t.category_type || t.category_type === 'expense') {
            const monthKey = t.date.toISOString().slice(0, 7); // YYYY-MM
            monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + Number(t.amount);
        }
    });

    const amounts = Object.values(monthlyExpenses);
    if (amounts.length === 0) return 0;

    // Use last 3 months if available
    const recentAmounts = amounts.slice(-3);
    const sum = recentAmounts.reduce((a, b) => a + b, 0);
    return Math.round(sum / recentAmounts.length);
}

// 2. Anomaly Detection (Z-Score on Individual Expenses)
function detectAnomalies(transactions) {
    const expenses = transactions
        .filter(t => !t.category_type || t.category_type === 'expense')
        .map(t => Number(t.amount));

    if (expenses.length < 3) return []; // Need minimum data points

    const mean = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const variance = expenses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / expenses.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return []; // No variance

    const anomalies = [];
    transactions.forEach(t => {
        if (!t.category_type || t.category_type === 'expense') {
            const amount = Number(t.amount);
            const zScore = (amount - mean) / stdDev;
            
            // Flag if amount is more than 2 standard deviations away and > 500 INR
            if (zScore > 2 && amount > 500) {
                anomalies.push({
                    txn_id: t._id || t.txn_id,
                    amount: amount,
                    category: t.category_name || "Uncategorized",
                    zScore: zScore.toFixed(2),
                    message: `Unusually high spend of ₹${amount} in ${t.category_name || "Uncategorized"} detected.`
                });
            }
        }
    });

    return anomalies;
}

// 3. Rule-based Categorization (Fallback heuristic)
function autoCategorizeDescription(note) {
    const text = (note || '').toLowerCase();
    
    if (text.match(/zomato|swiggy|kfc|mcdonalds|food|restaurant/i)) return "Food";
    if (text.match(/uber|ola|rapido|metro|petrol|fuel|ticket/i)) return "Transport (Ola/Uber/Metro)";
    if (text.match(/rent|room|pg|apartment|electricity|water|wifi|broadband/i)) return "Rent";
    if (text.match(/grocery|dmart|blinkit|zepto|instamart|milk|veggies/i)) return "Groceries";
    if (text.match(/amazon|flipkart|myntra|ajio|shopping/i)) return "Shopping";
    if (text.match(/netflix|spotify|prime|hotstar|subscription/i)) return "Subscriptions";
    if (text.match(/upi|gpay|paytm|phonepe/i)) return "UPI Payments";
    if (text.match(/salary|wage|credit/i)) return "Salary";

    return null; // Return null if no match, falls back to User's default uncategorized
}

// 4. Middle-class mode tips based on 50-30-20 constraints (Needs vs Wants)
function getSavingsTips(needsAmount, wantsAmount, incomeAmount) {
    const tips = [];
    if (incomeAmount > 0) {
        const needsRatio = needsAmount / incomeAmount;
        const wantsRatio = wantsAmount / incomeAmount;

        if (needsRatio > 0.55) {
            tips.push("Your essential expenses (Rent, Groceries) are consuming over 50% of your income. Consider looking for ways to reduce utility bills or switch to budget-friendly grocery options.");
        }
        if (wantsRatio > 0.35) {
            tips.push("You're spending more than 30% of your income on wants (Dining, Subscriptions, Shopping). Cutting back slightly on Swiggy/Zomato or unused subscriptions can significantly boost savings.");
        }
        if (needsRatio <= 0.50 && wantsRatio <= 0.30) {
            tips.push("Great job! You're strictly adhering to the 50-30-20 rule. Consider investing your 20% savings into Mutual Funds or Fixed Deposits for stable returns.");
        }
    } else {
        tips.push("Log your income to receive personalized 50-30-20 savings tips.");
    }
    return tips;
}

// 5. Financial Health Score
function calculateHealthScore(totalIncome, totalExpense, budgetsSpentVsLimit) {
    if (totalIncome === 0) return 50; // Base score if no income logged

    let score = 100;

    // Penalty for overspending total income
    if (totalExpense > totalIncome) {
        score -= 40;
    } else {
        const savingsRatio = (totalIncome - totalExpense) / totalIncome;
        if (savingsRatio < 0.20) score -= 15; // Penalty for saving < 20%
        if (savingsRatio < 0.10) score -= 10;
        if (savingsRatio > 0.30) score += 5; // Bonus for saving > 30%
    }

    // Penalty for budget breaches
    budgetsSpentVsLimit.forEach(b => {
        if (b.limit_amount > 0) {
            const usage = b.spent / b.limit_amount;
            if (usage > 1.0) score -= 10; // Over budget
            else if (usage > 0.9) score -= 5;  // At the brim
        }
    });

    return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = {
    predictNextMonthExpenses,
    detectAnomalies,
    autoCategorizeDescription,
    getSavingsTips,
    calculateHealthScore
};
