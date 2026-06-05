const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

const STORAGE_PATH = path.join(__dirname, '../storage');

// Ensure the main storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

// Helper to instantiate git for a specific repository
const getGit = (repoName) => {
    const repoPath = path.join(STORAGE_PATH, repoName);
    if (!fs.existsSync(repoPath)) throw new Error('Repository does not exist');
    return simpleGit(repoPath);
};

module.exports = {
    // --- Basic Operations ---
    initRepo: async (repoName) => {
        const repoPath = path.join(STORAGE_PATH, repoName);
        if (!fs.existsSync(repoPath)) {
            fs.mkdirSync(repoPath, { recursive: true });
        }
        await simpleGit(repoPath).init();
        return { message: `Repository ${repoName} initialized.` };
    },

    deleteRepo: async (repoName) => {
        const repoPath = path.join(STORAGE_PATH, repoName);
        if (fs.existsSync(repoPath)) {
            fs.rmSync(repoPath, { recursive: true, force: true });
        }
        return { message: `Repository ${repoName} deleted from file system.` };
    },

    cloneRepo: async (repoUrl, repoName) => {
        const repoPath = path.join(STORAGE_PATH, repoName);
        await simpleGit().clone(repoUrl, repoPath);
        return { message: `Repository cloned into ${repoName}.` };
    },

    status: async (repoName) => {
        return await getGit(repoName).status();
    },

    add: async (repoName, files = ['.']) => {
        return await getGit(repoName).add(files);
    },

    commit: async (repoName, message) => {
        return await getGit(repoName).commit(message);
    },

    log: async (repoName) => {
        return await getGit(repoName).log();
    },

    // --- Branching & Merging ---
    getBranches: async (repoName) => {
        return await getGit(repoName).branch();
    },

    createBranch: async (repoName, branchName) => {
        return await getGit(repoName).checkoutLocalBranch(branchName);
    },

    checkoutBranch: async (repoName, branchName) => {
        return await getGit(repoName).checkout(branchName);
    },

    mergeBranch: async (repoName, fromBranch) => {
        return await getGit(repoName).merge([fromBranch]);
    },

    // --- Advanced Operations ---
    diff: async (repoName) => {
        return await getGit(repoName).diff();
    },

    tag: async (repoName, tagName, message) => {
        return await getGit(repoName).addAnnotatedTag(tagName, message);
    },

    stash: async (repoName, action = 'save') => {
        if (action === 'pop') return await getGit(repoName).stash(['pop']);
        return await getGit(repoName).stash();
    },

    blame: async (repoName, filePath) => {
        const result = await getGit(repoName).raw(['blame', filePath]);
        return result;
    },

    // --- File Management ---
    getFileTree: (repoName, subPath = '') => {
        const repoPath = path.join(STORAGE_PATH, repoName);
        const targetPath = path.join(repoPath, subPath);
        
        if (!fs.existsSync(targetPath)) {
            throw new Error('Path does not exist');
        }

        const items = fs.readdirSync(targetPath, { withFileTypes: true });
        const tree = [];

        for (const item of items) {
            if (item.name === '.git') continue; // Skip git internals

            const relativePath = path.join(subPath, item.name).replace(/\\/g, '/');
            const itemStat = fs.statSync(path.join(targetPath, item.name));

            tree.push({
                name: item.name,
                path: relativePath,
                type: item.isDirectory() ? 'folder' : 'file',
                size: itemStat.size,
                modified: itemStat.mtime
            });
        }
        
        // Sort folders first, then files
        tree.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });

        return tree;
    },

    readFile: (repoName, filePath) => {
        const fullPath = path.join(STORAGE_PATH, repoName, filePath);
        if (!fs.existsSync(fullPath)) throw new Error('File not found');
        return fs.readFileSync(fullPath, 'utf8');
    },

    writeFile: (repoName, filePath, content) => {
        const fullPath = path.join(STORAGE_PATH, repoName, filePath);
        // Ensure directory exists
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        return { message: `File ${filePath} written successfully.` };
    },

    writeBinaryFile: (repoName, filePath, buffer) => {
        const fullPath = path.join(STORAGE_PATH, repoName, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, buffer);
        return { message: `File ${filePath} uploaded successfully.` };
    }
};
