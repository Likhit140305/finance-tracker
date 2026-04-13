const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true },
    code:  { type: String, required: true },   // plain 6-digit code (not hashed for simplicity)
    purpose: { type: String, enum: ['login', 'register'], default: 'login' },
    used:  { type: Boolean, default: false },
    expiresAt: { type: Date, required: true }
});

// Auto-delete expired documents from MongoDB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure only one active OTP per email+purpose at a time
otpSchema.index({ email: 1, purpose: 1 });

const OtpModel = mongoose.model('Otp', otpSchema);

class Otp {
    // Generate a new 6-digit OTP and upsert for this email+purpose
    static async create(email, purpose = 'login') {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Replace any existing OTP for this email+purpose
        await OtpModel.findOneAndUpdate(
            { email: email.toLowerCase(), purpose },
            { code, expiresAt, used: false },
            { upsert: true, new: true }
        );

        return code;
    }

    // Verify and consume the OTP
    static async verify(email, code, purpose = 'login') {
        const otp = await OtpModel.findOne({
            email: email.toLowerCase(),
            purpose,
            used: false
        });

        if (!otp) return { valid: false, reason: 'No OTP found. Please request a new one.' };
        if (otp.expiresAt < new Date()) return { valid: false, reason: 'OTP has expired. Please request a new one.' };
        if (otp.code !== code) return { valid: false, reason: 'Incorrect OTP. Please try again.' };

        // Mark as used
        await OtpModel.deleteOne({ _id: otp._id });
        return { valid: true };
    }
}

module.exports = Otp;
