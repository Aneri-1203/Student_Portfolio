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
            name: user.name
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );
}

function getSafeUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        work: user.work,
        profileImage: user.profileImage || '',
        createdAt: user.createdAt
    };
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

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            work: work.trim()
        });

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            data: getSafeUser(user)
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

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

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

        /*
         * New Google user:
         * We need work/relationship before creating the account.
         */
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
            user = await User.create({
                name: payload.name || 'Google User',
                email,
                password: null,
                work: work.trim(),
                googleId: payload.sub,
                profileImage: payload.picture || ''
            });
        } else {
            /*
             * Link Google account to an existing email account.
             */
            if (!user.googleId) {
                user.googleId = payload.sub;
            }

            if (payload.picture && !user.profileImage) {
                user.profileImage = payload.picture;
            }

            if (!user.work && work) {
                user.work = work.trim();
            }

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
            '-password -resetPasswordToken -resetPasswordExpires'
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

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        /*
         * Always return the same message so that
         * registered emails cannot be discovered.
         */
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

        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:5173';

        const resetUrl =
            `${frontendUrl}/reset-password?token=${resetToken}`;

        /*
         * Email configuration
         */
        if (
            process.env.EMAIL_USER &&
            process.env.EMAIL_PASSWORD
        ) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Reset Your Portfolio Password',
                html: `
                    <h2>Password Reset</h2>
                    <p>Hello ${user.name},</p>
                    <p>You requested a password reset.</p>
                    <p>This link will expire in 15 minutes.</p>
                    <a href="${resetUrl}">
                        Reset Password
                    </a>
                    <p>If you did not request this, you can ignore this email.</p>
                `
            });
        } else {
            /*
             * Development fallback.
             * Once email is configured, the reset link will
             * be sent to the user's email instead.
             */
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

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: {
                $gt: Date.now()
            }
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
            message: 'Password reset successfully'
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   GET ALL TASKS
   PUBLIC
========================= */

app.get('/tasks', async (req, res, next) => {
    try {
        const tasks = await Task.find()
            .populate(
                'createdBy',
                'name email work profileImage'
            )
            .sort({
                createdAt: -1
            });

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
   GET SINGLE TASK
   PUBLIC
========================= */

app.get('/tasks/:id', async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate(
                'createdBy',
                'name email work profileImage'
            );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   CREATE TASK
   PROTECTED
========================= */

app.post(
    '/tasks',
    authMiddleware,
    validateTask,
    async (req, res, next) => {
        try {
            const {
                title,
                description,
                priority,
                status,
                dueDate,
                completed
            } = req.body;

            const task = await Task.create({
                title,
                description,
                priority,
                status,
                dueDate,
                completed,
                createdBy: req.user.id
            });

            const populatedTask = await Task.findById(task._id)
                .populate(
                    'createdBy',
                    'name email work profileImage'
                );

            res.status(201).json({
                success: true,
                data: populatedTask
            });
        } catch (err) {
            next(err);
        }
    }
);


/* =========================
   UPDATE TASK
   OWNER ONLY
========================= */

app.put('/tasks/:id', authMiddleware, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (task.createdBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own tasks'
            });
        }

        const {
            title,
            description,
            priority,
            status,
            dueDate
        } = req.body;

        if (title !== undefined) {
            task.title = title;
        }

        if (description !== undefined) {
            task.description = description;
        }

        if (priority !== undefined) {
            task.priority = priority;
        }

        if (status !== undefined) {
            task.status = status;
            task.completed = status === 'completed';
        }

        if (dueDate !== undefined) {
            task.dueDate = dueDate || null;
        }

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate(
                'createdBy',
                'name email work profileImage'
            );

        res.json({
            success: true,
            data: updatedTask
        });
    } catch (err) {
        next(err);
    }
});


/* =========================
   DELETE TASK
   OWNER ONLY
========================= */

app.delete('/tasks/:id', authMiddleware, async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        if (task.createdBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own tasks'
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
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
        const errors = Object.values(err.errors).map(
            (error) => error.message
        );

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Email already registered'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Server error'
    });
});


/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});