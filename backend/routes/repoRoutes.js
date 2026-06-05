const express = require('express');
const router = express.Router();
const Repository = require('../models/Repository');
const gitService = require('../services/gitService');
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const path = require('path');

// Ensure all routes are protected
router.use(ensureAuthenticated);

// Create a new repository
router.post('/', async (req, res) => {
    const { name, description, isPrivate } = req.body;
    
    try {
        // Check if user already has a repo with this name
        const existingRepo = await Repository.findOne({ name, owner: req.user._id });
        if (existingRepo) {
            return res.status(400).json({ error: 'You already have a repository with this name.' });
        }

        // To avoid filesystem collisions globally, prepend username to repo path
        // format: username_reponame
        const uniqueDirName = `${req.user.username}_${name}`;

        const repo = new Repository({
            name,
            description,
            owner: req.user._id,
            server_path: uniqueDirName,
            isPrivate: isPrivate || false
        });

        // Save to DB
        await repo.save();

        // Initialize Git on file system
        await gitService.initRepo(uniqueDirName);

        res.status(201).json({ message: 'Repository created successfully', repo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while creating repository' });
    }
});

// List repositories for the logged in user (owned or collaborated)
router.get('/', async (req, res) => {
    try {
        const repos = await Repository.find({ 
            $or: [
                { owner: req.user._id },
                { collaborators: req.user._id }
            ]
        }).sort({ createdAt: -1 }).populate('owner', 'username');
        res.json(repos);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching repositories' });
    }
});

// Get a single repository by ID
router.get('/:id', async (req, res) => {
    try {
        const repo = await Repository.findOne({ _id: req.params.id }).populate('owner', 'username').populate('collaborators', 'username');
        if (!repo) return res.status(404).json({ error: 'Repository not found' });
        
        // Access Check: Owner, Collaborator, or Public
        const isOwner = repo.owner._id.toString() === req.user._id.toString();
        const isCollaborator = repo.collaborators.some(c => c._id.toString() === req.user._id.toString());
        
        if (!isOwner && !isCollaborator && repo.isPrivate) {
            return res.status(403).json({ error: 'Unauthorized to view this repository' });
        }
        
        res.json(repo);
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching repository' });
    }
});

// Delete a repository
router.delete('/:id', async (req, res) => {
    try {
        const repo = await Repository.findOne({ _id: req.params.id, owner: req.user._id });
        
        if (!repo) {
            return res.status(404).json({ error: 'Repository not found or unauthorized' });
        }

        // Delete from file system
        await gitService.deleteRepo(repo.server_path);

        // Delete from DB
        await repo.deleteOne();

        res.json({ message: 'Repository deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error while deleting repository' });
    }
});

const User = require('../models/User');

// Add a collaborator
router.post('/:id/collaborators', async (req, res) => {
    try {
        const { username } = req.body;
        const repo = await Repository.findOne({ _id: req.params.id, owner: req.user._id });
        if (!repo) return res.status(404).json({ error: 'Repository not found or unauthorized' });

        const collabUser = await User.findOne({ username });
        if (!collabUser) return res.status(404).json({ error: 'User not found' });
        
        if (collabUser._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot add yourself as a collaborator' });
        }

        if (repo.collaborators.includes(collabUser._id)) {
            return res.status(400).json({ error: 'User is already a collaborator' });
        }

        repo.collaborators.push(collabUser._id);
        await repo.save();
        res.json({ message: 'Collaborator added successfully', user: collabUser.username });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove a collaborator
router.delete('/:id/collaborators/:username', async (req, res) => {
    try {
        const repo = await Repository.findOne({ _id: req.params.id, owner: req.user._id });
        if (!repo) return res.status(404).json({ error: 'Repository not found or unauthorized' });

        const collabUser = await User.findOne({ username: req.params.username });
        if (!collabUser) return res.status(404).json({ error: 'User not found' });

        repo.collaborators = repo.collaborators.filter(id => id.toString() !== collabUser._id.toString());
        await repo.save();
        res.json({ message: 'Collaborator removed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

const cloudService = require('../services/cloudService');

// Sync to Cloud
router.post('/:id/cloud/sync', async (req, res) => {
    try {
        const repo = await Repository.findOne({ _id: req.params.id });
        if (!repo) return res.status(404).json({ error: 'Repository not found' });

        const isOwner = repo.owner._id.toString() === req.user._id.toString();
        const isCollaborator = repo.collaborators.some(id => id.toString() === req.user._id.toString());

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ error: 'Unauthorized: Write access required to sync to cloud' });
        }

        await cloudService.syncRepoToCloud(repo.server_path);
        
        repo.cloudLastSynced = new Date();
        await repo.save();

        res.json({ message: 'Successfully synced to cloud', lastSynced: repo.cloudLastSynced });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error while syncing to cloud' });
    }
});

// Get Cloud Download Link
router.get('/:id/cloud/download', async (req, res) => {
    try {
        const repo = await Repository.findOne({ _id: req.params.id });
        if (!repo) return res.status(404).json({ error: 'Repository not found' });

        const isOwner = repo.owner._id.toString() === req.user._id.toString();
        const isCollaborator = repo.collaborators.some(id => id.toString() === req.user._id.toString());
        const isPublic = !repo.isPrivate;

        if (!isOwner && !isCollaborator && !isPublic) {
            return res.status(403).json({ error: 'Unauthorized: Read access denied' });
        }

        if (!repo.cloudLastSynced) {
            return res.status(400).json({ error: 'Repository has never been synced to the cloud' });
        }

        const signedUrl = await cloudService.getDownloadUrl(repo.server_path);
        res.json({ downloadUrl: signedUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error generating download link' });
    }
});

module.exports = router;
