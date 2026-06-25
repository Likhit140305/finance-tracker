const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Otp = require('../models/otpModel');
const { sendOtpEmail } = require('../utils/emailService');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = await User.create(name, email, passwordHash);

        // Inject default Indian categories
        const defaultCategories = [
            { name: 'Salary',                    type: 'income' },
            { name: 'UPI Payments',              type: 'expense' },
            { name: 'Groceries',                 type: 'expense' },
            { name: 'Rent',                      type: 'expense' },
            { name: 'Transport (Ola/Uber/Metro)', type: 'expense' }
        ];
        for (const cat of defaultCategories) {
            await Category.create(userId, cat.name, cat.type);
        }

        // Generate OTP and email it
        const otp = await Otp.create(email, 'register');

        // Always log OTP so it's visible in Render logs as fallback
        console.log(`[OTP] register | ${email} | OTP: ${otp}`);

        if (process.env.BYPASS_OTP !== 'true') {
            sendOtpEmail(email, otp, 'register').catch(err =>
                console.error('OTP email send failed (register):', err.message)
            );
        }

        res.status(201).json({
            message: 'Account created! Please enter the OTP sent to your email to continue.',
            requiresOTP: true,
            email,
            purpose: 'register'
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate OTP and email it
        const otp = await Otp.create(email, 'login');

        // Always log OTP so it's visible in Render logs as fallback
        console.log(`[OTP] login | ${email} | OTP: ${otp}`);

        if (process.env.BYPASS_OTP !== 'true') {
            sendOtpEmail(email, otp, 'login').catch(err =>
                console.error('OTP email send failed (login):', err.message)
            );
        }

        res.json({
            message: 'Password verified. Please enter the OTP sent to your email.',
            requiresOTP: true,
            email,
            purpose: 'login'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    const { email, code, purpose } = req.body;

    if (!email || !code || !purpose) {
        return res.status(400).json({ message: 'Email, OTP code and purpose are required' });
    }

    try {
        const result = await Otp.verify(email, code.trim(), purpose);
        if (!result.valid) {
            return res.status(400).json({ message: result.reason });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: purpose === 'register' ? 'Account verified! Welcome.' : 'Login successful',
            token,
            user: { id: user.user_id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error verifying OTP' });
    }
};

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
        return res.status(400).json({ message: 'Email and purpose are required' });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        const otp = await Otp.create(email, purpose);
        await sendOtpEmail(email, otp, purpose);

        res.json({ message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ message: 'Server error resending OTP' });
    }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ id: user.user_id, name: user.name, email: user.email });
    } catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
