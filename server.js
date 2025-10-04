const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const multer = require('multer');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Import configuration
const connectDB = require('./src/config/database');
require('./src/config/passport')(passport);  // Pass passport to the function

// Import routes
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const userRoutes = require('./src/routes/users');
const expenseRoutes = require('./src/routes/expenses');
const approvalRoutes = require('./src/routes/approvals');
const companyRoutes = require('./src/routes/company');

// Import middleware
const { isAuthenticated } = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');

// Connect to MongoDB
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/receipts/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, .jpeg and .pdf format allowed!'));
        }
    }
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'expense-management-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-management',
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

// Make upload middleware available globally
app.locals.upload = upload;

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', isAuthenticated, dashboardRoutes);
app.use('/users', isAuthenticated, userRoutes);
app.use('/expenses', isAuthenticated, expenseRoutes);
app.use('/approvals', isAuthenticated, approvalRoutes);
app.use('/company', isAuthenticated, companyRoutes);

// Root route
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    res.redirect('/auth/login');
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('layouts/error', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        error: { status: 404 }
    });
});

// Error handler middleware
// app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`
    ====================================
    🚀 Server is running on port ${PORT}
    📱 Access at: http://localhost:${PORT}
    🔧 Environment: ${process.env.NODE_ENV || 'development'}
    ====================================
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;