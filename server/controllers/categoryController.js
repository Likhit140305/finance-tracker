const Category = require('../models/categoryModel');

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findByUserId(req.user);
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createCategory = async (req, res) => {
    let { name, type } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Name and type are required' });
    }

    name = name.trim();

    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Type must be income or expense' });
    }

    try {
        const categoryId = await Category.create(req.user, name, type);
        res.status(201).json({ categoryId, name, type });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    let { name, type } = req.body;

    if (!name || !type || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ message: 'Invalid name or type' });
    }

    name = name.trim();

    try {
        const affected = await Category.update(id, req.user, name, type);
        if (affected === 0) {
            return res.status(404).json({ message: 'Category not found or unauthorized' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const affected = await Category.delete(id, req.user);
        if (affected === 0) {
            return res.status(404).json({ message: 'Category not found or unauthorized' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};