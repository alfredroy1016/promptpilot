const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const passport = require('passport');

// Load environment variables
require('dotenv').config();

// Import routes
const paymentRoutes = require('./routes/user/payment');
const downloadRoutes = require('./routes/user/download');
const buyRoutes = require('./routes/user/buy');
const adminPromptRoutes = require('./routes/admin/prompts');
const adminAuthRoutes = require('./routes/admin/auth');
const userPromptRoutes = require('./routes/user/prompts');
const authRoutes = require('./routes/user/auth');
const pageRoutes = require('./routes/user/pages');

// Init Express app
const app = express();

// Passport config (after dotenv)
require('./config/passport');

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser (before session)
app.use(cookieParser());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set to true if using HTTPS
  })
);

// Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

// Log session and user info for debugging
app.use((req, res, next) => {
  console.log('[Session]', req.session);
  console.log('[User]', req.user);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/admin', adminAuthRoutes);
app.use('/admin/prompts', adminPromptRoutes);
app.use('/prompts', userPromptRoutes);
app.use('/auth', authRoutes);
app.use('/user', downloadRoutes);
app.use('/buy-now', buyRoutes);
app.use('/buy', buyRoutes);
app.use('/payment', paymentRoutes);
app.use('/', pageRoutes);

// Home route
app.get('/', (req, res) => res.render('user/index'));

// Log Razorpay keys presence (only keys, not secret)
console.log('🔑 Razorpay Key ID:', process.env.RAZORPAY_KEY_ID ? 'Found' : 'Missing');
console.log('🔑 Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Found' : 'Missing');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
