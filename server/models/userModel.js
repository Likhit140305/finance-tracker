const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

class User {
    static async create(name, email, passwordHash) {
        const user = new UserModel({
            name,
            email: email.toLowerCase(),
            password_hash: passwordHash
        });
        await user.save();
        return user._id.toString();
    }

    static async findByEmail(email) {
        const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
        if (user) user.user_id = user._id.toString();
        return user;
    }

    static async findById(id) {
        const user = await UserModel.findById(id).lean();
        if (user) user.user_id = user._id.toString();
        return user;
    }
}

module.exports = User;