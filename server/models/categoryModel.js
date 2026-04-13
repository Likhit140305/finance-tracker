const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
}, { timestamps: true });

const CategoryModel = mongoose.model('Category', categorySchema);

class Category {
    static async create(userId, name, type) {
        const category = new CategoryModel({ user_id: userId, name, type });
        await category.save();
        return category._id.toString();
    }
    
    static async findByUserId(userId) {
        const categories = await CategoryModel.find({ user_id: userId }).lean();
        return categories.map(c => ({ ...c, category_id: c._id.toString() }));
    }

    static async findById(id, userId) {
        const category = await CategoryModel.findOne({ _id: id, user_id: userId }).lean();
        if (category) category.category_id = category._id.toString();
        return category;
    }

    static async update(id, userId, name, type) {
        const result = await CategoryModel.updateOne(
            { _id: id, user_id: userId },
            { name, type }
        );
        return result.modifiedCount;
    }

    static async delete(id, userId) {
        const result = await CategoryModel.deleteOne({ _id: id, user_id: userId });
        return result.deletedCount;
    }
}

module.exports = Category;
