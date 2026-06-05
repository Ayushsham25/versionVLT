const express = require('express');
const router = express.Router();
const gitService = require('../services/gitService');

const Repository = require('../models/Repository');

// Middleware to handle async route errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware to ensure user has access to the repo
const requireGitAccess = asyncHandler(async (req, res, next) => {
    const server_path = req.params.repoName;
    const repo = await Repository.findOne({ server_path });
    
    if (!repo) return res.status(404).json({ error: 'Repository not found' });

    const isPublic = !repo.isPrivate;

    // Handle unauthenticated users
    if (!req.user) {
        if (isPublic && !['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            req.repo = repo;
            return next();
        }
        return res.status(401).json({ error: 'Please log in to access this repository' });
    }

    const isOwner = repo.owner.toString() === req.user._id.toString();
    const isCollaborator = repo.collaborators.some(id => id.toString() === req.user._id.toString());

    const isWriteAction = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

    if (isWriteAction) {
        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ error: 'Unauthorized: Write access required' });
        }
    } else {
        if (!isOwner && !isCollaborator && !isPublic) {
            return res.status(403).json({ error: 'Unauthorized: Read access denied' });
        }
    }

    req.repo = repo;
    next();
});

// Apply authorization to all routes matching /:repoName (which includes sub-paths)
router.use('/:repoName', requireGitAccess);

// --- Repository Lifecycle ---
router.post('/:repoName/init', asyncHandler(async (req, res) => {
    const result = await gitService.initRepo(req.params.repoName);
    res.status(201).json(result);
}));

router.post('/:repoName/clone', asyncHandler(async (req, res) => {
    const { repoUrl } = req.body;
    const result = await gitService.cloneRepo(repoUrl, req.params.repoName);
    res.status(201).json(result);
}));

// --- Staging & Committing ---
router.get('/:repoName/status', asyncHandler(async (req, res) => {
    const status = await gitService.status(req.params.repoName);
    res.json(status);
}));

router.post('/:repoName/add', asyncHandler(async (req, res) => {
    const { files } = req.body; 
    await gitService.add(req.params.repoName, files);
    res.json({ message: 'Files staged successfully' });
}));

router.post('/:repoName/commit', asyncHandler(async (req, res) => {
    const { message } = req.body;
    const result = await gitService.commit(req.params.repoName, message);
    res.json(result);
}));

router.get('/:repoName/log', asyncHandler(async (req, res) => {
    const log = await gitService.log(req.params.repoName);
    res.json(log);
}));

// --- Branching & Advanced ---
router.get('/:repoName/branches', asyncHandler(async (req, res) => {
    const branches = await gitService.getBranches(req.params.repoName);
    res.json(branches);
}));

router.post('/:repoName/branch', asyncHandler(async (req, res) => {
    const { branchName } = req.body;
    await gitService.createBranch(req.params.repoName, branchName);
    res.json({ message: `Branch ${branchName} created and checked out` });
}));

router.post('/:repoName/checkout', asyncHandler(async (req, res) => {
    const { branchName } = req.body;
    await gitService.checkoutBranch(req.params.repoName, branchName);
    res.json({ message: `Checked out branch ${branchName}` });
}));

router.post('/:repoName/merge', asyncHandler(async (req, res) => {
    const { fromBranch, toBranch } = req.body;
    if (toBranch) {
        await gitService.checkoutBranch(req.params.repoName, toBranch);
    }
    const result = await gitService.mergeBranch(req.params.repoName, fromBranch);
    res.json({ message: `Successfully merged ${fromBranch}`, result });
}));

// --- Diff ---
router.get('/:repoName/diff', asyncHandler(async (req, res) => {
    const diff = await gitService.diff(req.params.repoName);
    res.json({ diff });
}));

// --- File Management ---
router.get('/:repoName/files', asyncHandler(async (req, res) => {
    // path query param allows navigating into subdirectories
    const subPath = req.query.path || '';
    const tree = gitService.getFileTree(req.params.repoName, subPath);
    res.json({ tree });
}));

router.get('/:repoName/files/content', asyncHandler(async (req, res) => {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'path query parameter is required' });
    const content = gitService.readFile(req.params.repoName, filePath);
    res.json({ content });
}));

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/:repoName/files', asyncHandler(async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'path is required' });
    const result = gitService.writeFile(req.params.repoName, filePath, content || '');
    res.json(result);
}));

router.post('/:repoName/upload', upload.single('file'), asyncHandler(async (req, res) => {
    const file = req.file;
    const subPath = req.body.path || '';
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Clean and construct the destination path
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = subPath ? `${subPath}/${safeOriginalName}` : safeOriginalName;
    
    const result = gitService.writeBinaryFile(req.params.repoName, filePath, file.buffer);
    res.json(result);
}));

router.post('/:repoName/upload-folder', upload.array('files'), asyncHandler(async (req, res) => {
    const files = req.files;
    let paths = req.body.paths;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    
    // Parse paths array, since formData sends arrays dynamically, we can assume paths is an array of strings
    if (typeof paths === 'string') {
        try { paths = JSON.parse(paths); } catch (e) { paths = [paths]; }
    }

    if (!Array.isArray(paths) || paths.length !== files.length) {
        return res.status(400).json({ error: 'Paths array does not match files array' });
    }

    const currentPath = req.body.currentPath || '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = paths[i]; // e.g. "MyFolder/src/index.js"
        
        // Clean paths slightly but retain slashes
        const cleanRelativePath = relativePath.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
        const finalPath = currentPath ? `${currentPath}/${cleanRelativePath}` : cleanRelativePath;
        
        gitService.writeBinaryFile(req.params.repoName, finalPath, file.buffer);
    }
    
    res.json({ message: `${files.length} files uploaded successfully.` });
}));

const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

router.get('/:repoName/download', asyncHandler(async (req, res) => {
    const repoPath = path.join(process.env.REPOS_DIR || path.join(__dirname, '../storage'), req.params.repoName);
    
    if (!fs.existsSync(repoPath)) {
        return res.status(404).json({ error: 'Repository not found on disk' });
    }

    res.attachment(`${req.params.repoName}.zip`);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(res);

    // append files from a sub-directory, excluding .git folder
    archive.glob('**/*', {
        cwd: repoPath,
        ignore: ['.git/**']
    });

    await archive.finalize();
}));

module.exports = router;
