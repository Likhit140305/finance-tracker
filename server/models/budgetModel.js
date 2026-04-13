const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    category_id: { type: String, required: true },
    limit_amount: { type: Number, required: true },
    month: { type: String, required: true }, // Format YYYY-MM
}, { timestamps: true });

// Ensure uniqueness per user+category+month
budgetSchema.index({ user_id: 1, category_id: 1, month: 1 }, { unique: true });

const BudgetModel = mongoose.model('Budget', budgetSchema);

class Budget {
    static async createOrUpdate(userId, categoryId, limitAmount, month) {
        const result = await BudgetModel.findOneAndUpdate(
            { user_id: userId, category_id: categoryId, month },
            { limit_amount: limitAmount },
            { upsert: true, new: true }
        ).lean();

        return {
            ...result,
            budget_id: result._id.toString()
        };
    }

    static async findByUserIdAndMonth(userId, month) {
        const budgets = await BudgetModel.find({ user_id: userId, month }).lean();
        const categoryIds = [...new Set(budgets.map(b => b.category_id))];
        let catMap = {};

        if (categoryIds.length > 0) {
            const categories = await mongoose.model('Category')
                .find({ _id: { $in: categoryIds } })
                .lean();

            categories.forEach(c => {
                catMap[c._id.toString()] = c;
            });
        }

        return budgets.map(b => ({
            ...b,
            budget_id: b._id.toString(),
            category_name: catMap[b.category_id] ? catMap[b.category_id].name : null,
            category_type: catMap[b.category_id] ? catMap[b.category_id].type : null
        }));
    }

    static async delete(id, userId) {
        const result = await BudgetModel.deleteOne({ _id: id, user_id: userId });
        return result.deletedCount;
    }
}

module.exports = Budget;
