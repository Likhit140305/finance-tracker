const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    category_id: { type: String, default: null },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
    source: { type: String, enum: ['manual', 'ocr'], default: 'manual' }
}, { timestamps: true });

const TransactionModel = mongoose.model('Transaction', transactionSchema);

class Transaction {
    static async create(userId, categoryId, amount, date, note, source = 'manual') {
        const txn = new TransactionModel({
            user_id: userId,
            category_id: categoryId,
            amount,
            date,
            note,
            source
        });
        await txn.save();
        return txn._id.toString();
    }

    static async findByUserId(userId) {
        const transactions = await TransactionModel.find({ user_id: userId })
            .sort({ date: -1 })
            .lean();

        const categoryIds = [...new Set(transactions.map(t => t.category_id).filter(Boolean))];
        let catMap = {};

        if (categoryIds.length > 0) {
            const categories = await mongoose.model('Category')
                .find({ _id: { $in: categoryIds } })
                .lean();

            categories.forEach(c => {
                catMap[c._id.toString()] = c;
            });
        }

        return transactions.map(t => ({
            ...t,
            txn_id: t._id.toString(),
            category_name: t.category_id && catMap[t.category_id] ? catMap[t.category_id].name : null,
            category_type: t.category_id && catMap[t.category_id] ? catMap[t.category_id].type : null
        }));
    }

    static async update(id, userId, categoryId, amount, date, note) {
        const result = await TransactionModel.updateOne(
            { _id: id, user_id: userId },
            { category_id: categoryId, amount, date, note }
        );
        return result.modifiedCount;
    }

    static async delete(id, userId) {
        const result = await TransactionModel.deleteOne({ _id: id, user_id: userId });
        return result.deletedCount;
    }
}

module.exports = Transaction;
