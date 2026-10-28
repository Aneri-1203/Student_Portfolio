require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const Task = require('./models/Tasks');
const User = require('./models/User');
const authMiddleware = require('./middleware/auth');
const adminMiddleware = require('./middleware/adminMiddleware');
const validateTask = require('./middleware/validateTask');

const app = express();
const PORT = process.env.PORT || 5000;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((err) => console.error('MongoDB Connection Error:', err.message));


/* =========================
   HELPER FUNCTIONS
========================= */

function generateToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role || 'student'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function getSafeUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        work: user.work,
        role: user.role || 'student',
        isEmailVerified: user.isEmailVerified || false,
        profileImage: user.profileImage || '',
        createdAt: user.createdAt
    };
}

async function sendEmail({ to, subject, html }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email not configured — EMAIL_USER/EMAIL_PASSWORD missing.');
        return false;
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    await transporter.sendMail({
        from: `"Portfolio" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
    return true;
}

// Returns the admin email from environment (the portfolio owner)
function getAdminEmail() {
    return (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
}


/* =========================
   REGISTER
========================= */

app.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, work } = req.body;

        if (!name || !email || !password || !work) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password and work/relationship are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate email verification token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Check if this email matches the admin email in env
        const isAdmin = getAdminEmail() && normalizedEmail === getAdminEmail();

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            work: work.trim(),
            role: isAdmin ? 'admin' : 'student',
            isEmailVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            lastVerificationSentAt: new Date()
        });

        // Send verification email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify-email?token=${rawToken}`;

        const emailSent = await sendEmail({
            to: user.email,
            subject: 'Verify your Portfolio account',
            html: `
                <h2>Welcome, ${user.name}!</h2>
                <p>Please verify your email address to access the Task Manager.</p>
                <p>This link expires in 24 hours.</p>
                <a href="${verifyUrl}" style="
                    display:inline-block;
                    padding:12px 24px;
                    background:#67e8a5;
                    color:#0b0f14;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:600;
                ">Verify Email</a>
                <p>Or copy this link: ${verifyUrl}</p>
                <p>If you did not create this account, ignore this email.</p>
            `
        });

        if (!emailSent) {
            // Dev fallback
            console.log('EMAIL VERIFICATION URL:', verifyUrl);
        }

        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Account created! Please check your email to verify your account.'
                : 'Account created! Email service not configured — check server console for verification link.',
            requiresVerification: true
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   VERIFY EMAIL
========================= */

app.get('/auth/verify-email', async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Verification link is invalid or has expired'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        const jwtToken = generateToken(user);

        res.json({
            success: true,
            message: 'Email verified successfully! You are now logged in.',
            token: jwtToken,
            data: getSafeUser(user)
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   RESEND VERIFICATION EMAIL
========================= */

app.post('/auth/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If an unverified account exists, a new verification email has been sent.'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'This account is already verified.'
            });
        }

        // Rate limit: 1 email per 2 minutes
        if (user.lastVerificationSentAt) {
            const diffMs = Date.now() - new Date(user.lastVerificationSentAt).getTime();
            if (diffMs < 2 * 60 * 1000) {
                return res.status(429).json({
                    success: false,
                    message: 'Please wait 2 minutes before requesting another verification email.'
                });
            }
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        user.lastVerificationSentAt = new Date();
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify-email?token=${rawToken}`;

        const emailSent = await sendEmail({
            to: user.email,
            subject: 'Verify your Portfolio account',
            html: `
                <h2>Email Verification</h2>
                <p>Hello ${user.name},</p>
                <p>Here is your new verification link. It expires in 24 hours.</p>
                <a href="${verifyUrl}" style="
                    display:inline-block;
                    padding:12px 24px;
                    background:#67e8a5;
                    color:#0b0f14;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:600;
                ">Verify Email</a>
                <p>Or copy: ${verifyUrl}</p>
            `
        });

        if (!emailSent) {
            console.log('RESEND VERIFICATION URL:', verifyUrl);
        }

        res.json({
            success: true,
            message: 'If an unverified account exists, a new verification email has been sent.'
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   LOGIN
========================= */

app.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: 'This account uses Google login. Please continue with Google.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in.',
                requiresVerification: true,
                email: user.email
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            data: getSafeUser(user)
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   GOOGLE LOGIN / SIGNUP
========================= */

app.post('/auth/google', async (req, res, next) => {
    try {
        const { credential, work } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: 'Google login is not configured on the server'
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                message: 'Unable to read Google account information'
            });
        }

        const email = payload.email.toLowerCase().trim();
        let user = await User.findOne({ email });

        // New Google user — need work field
        if (!user && !work) {
            return res.json({
                success: false,
                requiresProfile: true,
                profile: {
                    name: payload.name || '',
                    email,
                    profileImage: payload.picture || ''
                },
                message: 'Please provide your work or relationship'
            });
        }

        if (!user) {
            const isAdmin = getAdminEmail() && email === getAdminEmail();
            user = await User.create({
                name: payload.name || 'Google User',
                email,
                password: null,
                work: work.trim(),
                role: isAdmin ? 'admin' : 'student',
                isEmailVerified: true, // Google emails are pre-verified
                googleId: payload.sub,
                profileImage: payload.picture || ''
            });
        } else {
            if (!user.googleId) user.googleId = payload.sub;
            if (payload.picture && !user.profileImage) user.profileImage = payload.picture;
            if (!user.work && work) user.work = work.trim();
            // Google accounts are auto-verified
            if (!user.isEmailVerified) user.isEmailVerified = true;
            await user.save();
        }

        if (!user.work) {
            return res.json({
                success: false,
                requiresProfile: true,
                profile: {
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage || ''
                },
                message: 'Please provide your work or relationship'
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Google login successful',
            token,
            data: getSafeUser(user)
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   CURRENT USER
========================= */

app.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select(
            '-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires'
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: getSafeUser(user)
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   FORGOT PASSWORD
========================= */

app.post('/auth/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        if (!user.password) {
            return res.json({
                success: true,
                message: 'This account uses Google login. Please continue with Google.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const emailSent = await sendEmail({
            to: user.email,
            subject: 'Reset Your Portfolio Password',
            html: `
                <h2>Password Reset</h2>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset. This link expires in 15 minutes.</p>
                <a href="${resetUrl}" style="
                    display:inline-block;
                    padding:12px 24px;
                    background:#67e8a5;
                    color:#0b0f14;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:600;
                ">Reset Password</a>
                <p>Or copy: ${resetUrl}</p>
                <p>If you did not request this, ignore this email.</p>
            `
        });

        if (!emailSent) {
            console.log('PASSWORD RESET URL:', resetUrl);
        }

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   RESET PASSWORD
========================= */

app.post('/auth/reset-password', async (req, res, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is invalid or expired'
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in.'
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   GET ALL TASKS (public read)
========================= */

app.get('/tasks', async (req, res, next) => {
    try {
        const tasks = await Task.find()
            .populate('createdBy', 'name email work profileImage role')
            .populate('assignedTo', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   GET MY TASKS (authenticated user's own tasks)
========================= */

app.get('/tasks/mine', authMiddleware, async (req, res, next) => {
    try {
        const tasks = await Task.find({ createdBy: req.user.id })
            .populate('createdBy', 'name email work profileImage')
            .populate('assignedTo', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   GET SINGLE TASK (public)
========================= */

app.get('/tasks/:id', async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('createdBy', 'name email work profileImage')
            .populate('assignedTo', 'name email role');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({ success: true, data: task });
    } catch (err) {
        next(err);
    }
});


/* =========================
   CREATE TASK (protected, verified users only)
========================= */

app.post('/tasks', authMiddleware, validateTask, async (req, res, next) => {
    try {
        // Check email verification
        const user = await User.findById(req.user.id).select('isEmailVerified role');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before creating tasks.'
            });
        }

        const { title, description, priority, status, dueDate, completed, category, notes } = req.body;

        // Default assignedTo = admin (portfolio owner) — looked up by ADMIN_EMAIL
        let assignedTo = null;
        const adminEmail = getAdminEmail();
        if (adminEmail) {
            const adminUser = await User.findOne({ email: adminEmail, role: 'admin' }).select('_id');
            if (adminUser) assignedTo = adminUser._id;
        }

        const task = await Task.create({
            title,
            description,
            priority,
            status,
            dueDate,
            completed,
            category,
            notes,
            createdBy: req.user.id,
            assignedTo
        });

        const populatedTask = await Task.findById(task._id)
            .populate('createdBy', 'name email work profileImage')
            .populate('assignedTo', 'name email role');

        res.status(201).json({ success: true, data: populatedTask });
    } catch (err) {
        next(err);
    }
});


/* =========================
   UPDATE TASK (owner or admin)
========================= */

app.put('/tasks/:id', authMiddleware, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const user = await User.findById(req.user.id).select('role');
        const isAdmin = user && user.role === 'admin';
        const isOwner = task.createdBy.toString() === req.user.id.toString();

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own tasks'
            });
        }

        const { title, description, priority, status, dueDate, category, notes, assignedTo } = req.body;

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (category !== undefined) task.category = category;
        if (notes !== undefined) task.notes = notes;

        if (status !== undefined) {
            task.status = status;
            task.completed = status === 'completed';
        }

        if (dueDate !== undefined) task.dueDate = dueDate || null;

        // Only admin can reassign tasks
        if (assignedTo !== undefined && isAdmin) {
            task.assignedTo = assignedTo || null;
        }

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('createdBy', 'name email work profileImage')
            .populate('assignedTo', 'name email role');

        res.json({ success: true, data: updatedTask });
    } catch (err) {
        next(err);
    }
});


/* =========================
   DELETE TASK (owner or admin)
========================= */

app.delete('/tasks/:id', authMiddleware, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const user = await User.findById(req.user.id).select('role');
        const isAdmin = user && user.role === 'admin';
        const isOwner = task.createdBy.toString() === req.user.id.toString();

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own tasks'
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        next(err);
    }
});


/* =========================
   ADMIN — GET ALL USERS
========================= */

app.get('/admin/users', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { search, role } = req.query;

        const filter = {};
        if (role && ['student', 'admin'].includes(role)) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
});


/* =========================
   ADMIN — UPDATE USER ROLE
========================= */

app.patch('/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!['student', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        // Prevent demoting yourself
        if (req.params.id === req.user.id && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'You cannot demote your own admin account'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password -resetPasswordToken -emailVerificationToken');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: getSafeUser(user) });
    } catch (err) {
        next(err);
    }
});


/* =========================
   ADMIN — DELETE USER
========================= */

app.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Remove their tasks too
        await Task.deleteMany({ createdBy: req.params.id });

        res.json({ success: true, message: 'User and their tasks deleted successfully' });
    } catch (err) {
        next(err);
    }
});


/* =========================
   ADMIN — GET ALL TASKS (with filters)
========================= */

app.get('/admin/tasks', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { priority, status, createdBy, sort } = req.query;

        const filter = {};
        if (priority) filter.priority = priority;
        if (status) filter.status = status;
        if (createdBy) filter.createdBy = createdBy;

        let sortObj = { createdAt: -1 };
        if (sort === 'oldest') sortObj = { createdAt: 1 };
        if (sort === 'deadline') sortObj = { dueDate: 1 };

        const tasks = await Task.find(filter)
            .populate('createdBy', 'name email work profileImage')
            .populate('assignedTo', 'name email role')
            .sort(sortObj);

        // Stats
        const now = new Date();
        const stats = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            active: tasks.filter(t => t.status === 'active').length,
            completed: tasks.filter(t => t.completed).length,
            overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length
        };

        res.json({ success: true, count: tasks.length, stats, data: tasks });
    } catch (err) {
        next(err);
    }
});


/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
    console.error(err);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    res.status(500).json({ success: false, message: 'Server error' });
});


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
