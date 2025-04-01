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

  // 设置视图引擎和静态文件
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.urlencoded({ extended: true }));
  console.log('View engine and middleware configured');

  // 配置 session，使用硬编码的 secret
  app.use(session({
    secret: 'my_hardcoded_secret_key', // 临时硬编码，生产环境建议改为环境变量
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // 本地开发用 false，生产环境 HTTPS 用 true
      maxAge: 24 * 60 * 60 * 1000 // 1 天有效期
    }
  }));
  console.log('Session middleware configured');

  // 添加 connect-flash
  app.use(flash());
  console.log('Flash middleware configured');

  // 初始化 passport
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('Passport middleware configured');

  // 加载 passport 配置
  try {
    require('./config/passport')(passport);
    console.log('Passport configuration loaded');
  } catch (err) {
    console.error('Failed to load passport configuration:', err);
    process.exit(1);
  }

  // 路由
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

  // 根路由
  app.get('/', (req, res) => {
    console.log('Root route accessed, isAuthenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
      res.redirect('/posts');
    } else {
      res.redirect('/login');
    }
  });
  console.log('Root route configured');

  // 健康检查路由
  app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
  });
  console.log('Health check route configured');

  // 启动服务器
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // 错误处理
  app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).render('error', { error: err.message || 'Something broke!' });
  });
})();

module.exports = { app, knex };