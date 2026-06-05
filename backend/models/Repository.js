const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    server_path: {
        type: String,
        required: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    cloudLastSynced: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure a user cannot have two repositories with the exact same name
repositorySchema.index({ name: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('Repository', repositorySchema);
