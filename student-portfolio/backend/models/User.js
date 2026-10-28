const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        default: null
    },

    work: {
        type: String,
        required: [true, 'Work or relationship is required'],
        trim: true
    },

    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },

    // Email verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationToken: {
        type: String,
        default: null
    },

    emailVerificationExpires: {
        type: Date,
        default: null
    },

    // Resend rate limiting
    lastVerificationSentAt: {
        type: Date,
        default: null
    },

    googleId: {
        type: String,
        default: null
    },

    profileImage: {
        type: String,
        default: ''
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
