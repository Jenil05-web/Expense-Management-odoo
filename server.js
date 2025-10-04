require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const path = require('path');

const connectDB = require('./src/config/database');
const passportConfig = require('./src/config/passport');

const app = express();

// Connect to MongoDB
connectDB();

// Passport configuration
passportConfig(passport);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'expense-management-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_management',
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

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.moment = require('moment');
  next();
});

// Routes
app.use('/', require('./src/routes/index'));
app.use('/auth', require('./src/routes/auth'));
app.use('/dashboard', require('./src/routes/dashboard'));
app.use('/users', require('./src/routes/users'));
app.use('/expenses', require('./src/routes/expenses'));
app.use('/approvals', require('./src/routes/approvals'));
app.use('/company', require('./src/routes/company'));

// Error handling
app.use((req, res, next) => {
  res.status(404).render('layouts/error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('layouts/error', {
    title: '500 - Server Error',
    message: 'Something went wrong on our end.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});