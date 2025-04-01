const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const knex = require('./db');
const { Storage } = require('@google-cloud/storage');

console.log('Starting application...');

let storage;
try {
  storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/prismatic-fact-455403-c4-9e843b43904b.json'
  });
  console.log('Google Cloud Storage initialized');
} catch (err) {
  console.error('Failed to initialize Google Cloud Storage:', err);
  process.exit(1);
}

const app = express();
console.log('Express app created');

// 测试数据库连接
(async () => {
  try {
    await knex.raw('SELECT 1');
    console.log('Database connection successful');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  console.log('View engine and middleware configured');

  app.use(session({
    secret: 'my_hardcoded_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
  }));
  console.log('Session middleware configured');

  app.use(flash());
  console.log('Flash middleware configured');

  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport middleware configured');

  try {
    require('./config/passport')(passport);
    console.log('Passport configuration loaded');
  } catch (err) {
    console.error('Failed to load passport configuration:', err);
    process.exit(1);
  }

  // 根路由
  app.get('/', (req, res) => {
    console.log('Root route accessed');
    console.log('Session:', req.session);
    console.log('Authenticated:', req.isAuthenticated(), 'User:', req.user);
    if (req.isAuthenticated()) {
      console.log('User authenticated, redirecting to /posts');
      res.redirect('/posts');
    } else {
      console.log('User not authenticated, redirecting to /login');
      res.redirect('/login');
    }
  });

  // 其他路由
  try {
    const authRoutes = require('./routes/auth');
    const postRoutes = require('./routes/posts');
    const profileRoutes = require('./routes/profile');

    app.use('/', authRoutes);
    app.use('/posts', postRoutes);
    app.use('/profile', profileRoutes);
    console.log('Routes loaded');
  } catch (err) {
    console.error('Failed to load routes:', err);
    process.exit(1);
  }

  app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).render('error', { error: err.message || 'Something broke!' });
  });

  // 添加 404 处理
  app.use((req, res) => {
    console.log('404 - Requested path:', req.path);
    res.status(404).send('Cannot GET ' + req.path);
  });
})();