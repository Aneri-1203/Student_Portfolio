const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        minlength: [3, 'Title must be at least 3 characters long'],
        trim: true
    },

    description: {
        type: String,
        trim: true,
        default: ''
    },

    priority: {
        type: String,
        required: [true, 'Priority is required'],
        enum: {
            values: ['low', 'medium', 'high'],
            message: '{VALUE} is not a valid priority level'
        },
        default: 'medium'
    },

    status: {
        type: String,
        enum: [
            'pending',
            'incomplete',
            'active',
            'completed'
        ],
        default: 'pending'
    },

    dueDate: {
        type: Date,
        default: null
    },

    completed: {
        type: Boolean,
        default: false
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

taskSchema.pre('save', function () {
    this.updatedAt = new Date();

    this.completed = this.status === 'completed';

    if (this.title) {
        this.title = this.title.trim();
    }
});

module.exports = mongoose.model('Task', taskSchema);