const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const connectDB = require('./config/db');
const gitRoutes = require('./routes/gitRoutes');
const authRoutes = require('./routes/authRoutes');
const repoRoutes = require('./routes/repoRoutes');

const app = express();

// Passport config
require('./config/passport')(passport);

// Connect to Database
connectDB();

// Middleware
// CORS must be configured to allow credentials for session cookies to work across origins if frontend/backend run on different ports
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

const { MongoStore } = require('connect-mongo');

// Express Session Middleware
// Using connect-mongo to persist sessions in the database so they survive server restarts
app.use(session({
    secret: process.env.SESSION_SECRET || 'versionvlt_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/versionvlt',
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60 // 7 days in seconds
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        httpOnly: true, 
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    } 
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/git', gitRoutes); // Note: You can apply the ensureAuthenticated middleware here to protect all git routes.

// Mock Cloud Download Route (Used when AWS keys are not set)
app.get('/api/mock-cloud/download/:repoName', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const cloudDir = path.join(__dirname, '../cloud-backups');
    const filePath = path.join(cloudDir, `${req.params.repoName}.zip`);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, `${req.params.repoName}-cloud-backup.zip`);
    } else {
        res.status(404).send('Backup not found');
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`VersionVLT Backend running on port ${PORT}`);
});
