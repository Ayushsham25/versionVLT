const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

// Initialize S3 Client
// In a real environment, this should be wrapped in a try/catch or configured securely.
// If env vars are missing, we mock it or fail gracefully.
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy-key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy-secret'
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'versionvlt-cloud-backups';

class CloudService {
    /**
     * Zips a repository and streams it directly to S3
     */
    async syncRepoToCloud(repoName) {
        const repoPath = path.join(process.env.REPOS_DIR || path.join(__dirname, '../storage'), repoName);
        
        if (!fs.existsSync(repoPath)) {
            throw new Error('Repository not found on disk');
        }

        const useMock = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'dummy-key';

        if (useMock) {
            console.log('AWS keys not found, using Local Mock Cloud Storage');
            const cloudDir = path.join(__dirname, '../../cloud-backups');
            if (!fs.existsSync(cloudDir)) fs.mkdirSync(cloudDir, { recursive: true });

            return new Promise((resolve, reject) => {
                const output = fs.createWriteStream(path.join(cloudDir, `${repoName}.zip`));
                const archive = archiver('zip', { zlib: { level: 9 } });
                
                output.on('close', () => resolve({ success: true, key: `backups/${repoName}.zip`, mock: true }));
                archive.on('error', (err) => reject(err));
                
                archive.pipe(output);
                archive.glob('**/*', { cwd: repoPath, dot: true });
                archive.finalize();
            });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            throw err;
        });

        // Append files, including .git
        archive.glob('**/*', {
            cwd: repoPath,
            dot: true 
        });

        archive.finalize();

        // Upload stream to S3
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: `backups/${repoName}.zip`,
                Body: archive, // Streaming the zip directly to S3
                ContentType: 'application/zip'
            }
        });

        await upload.done();
        return { success: true, key: `backups/${repoName}.zip` };
    }

    /**
     * Generates a temporary Signed URL to download the backup
     */
    async getDownloadUrl(repoName) {
        const useMock = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'dummy-key';
        if (useMock) {
            return `http://localhost:5000/api/mock-cloud/download/${encodeURIComponent(repoName)}`;
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `backups/${repoName}.zip`
        });

        // URL expires in 1 hour (3600 seconds)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    }
}

module.exports = new CloudService();
