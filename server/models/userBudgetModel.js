const mongoose = require('mongoose');

const userBudgetSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    salary: { type: Number, required: true },
    strategy_type: { type: String, enum: ['70-10-10-10', '50-30-20', 'custom'], required: true },
    goals: { type: String, default: '' },
    allocations: [{
        category: String,
        percentage: Number,
        amount: Number
    }]
}, { timestamps: true });

const UserBudgetModel = mongoose.model('UserBudget', userBudgetSchema);

class UserBudget {
    static async upsert(userId, data) {
        const result = await UserBudgetModel.findOneAndUpdate(
            { user_id: userId },
            data,
            { upsert: true, new: true }
        ).lean();
        return result;
    }

    static async get(userId) {
        return await UserBudgetModel.findOne({ user_id: userId }).lean();
    }
}

module.exports = UserBudget;