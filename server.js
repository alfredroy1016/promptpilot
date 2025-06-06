
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const passport = require('passport');
const paymentRoutes = require('./routes/user/payment');
const downloadRoutes = require('./routes/user/download');
const buyRoutes = require('./routes/user/buy');

const cookieParser = require('cookie-parser');





// Load environment variables
dotenv.config();

// Init Express app
const app = express();

// Passport config (after dotenv)
require('./config/passport');

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup (after app is defined!)
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false
}));


app.use((req, res, next) => {
  console.log('[Session]', req.session);
  console.log('[User]', req.user);
  next();
});


app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true only with https
}));


// Passport middlewares
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const adminPromptRoutes = require('./routes/admin/prompts');
const adminAuthRoutes = require('./routes/admin/auth');
const userPromptRoutes = require('./routes/user/prompts');
const authRoutes = require('./routes/user/auth');
const pageRoutes = require('./routes/user/pages'); 


app.use('/admin', adminAuthRoutes);
app.use('/admin/prompts', adminPromptRoutes);
app.use('/prompts', userPromptRoutes);
app.use('/auth', authRoutes);
app.use('/', paymentRoutes);
app.use('/user', downloadRoutes);

app.use('/buy-now', buyRoutes); // or similar route

app.use('/buy', buyRoutes);
app.use('/payment', paymentRoutes);
app.use('/', pageRoutes);

app.get('/', (req, res) => res.render('user/index'));
console.log('🔑 Razorpay ID:', process.env.RAZORPAY_KEY_ID);
console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
