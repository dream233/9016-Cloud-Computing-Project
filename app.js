const express = require('express');
const path = require('path');
const knex = require('./db');
const { Storage } = require('@google-cloud/storage');
const cookieParser = require('cookie-parser'); // 添加 cookie 支持

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

// 添加 cookieParser 中间件
app.use(cookieParser());

// 设置视图引擎和静态文件
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 测试数据库连接并初始化应用
(async () => {
  try {
    await knex.raw('SELECT 1');
    console.log('Database connection successful');
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }

  console.log('View engine and middleware configured');

  // 根路由：直接跳转到 /login
  app.get('/', (req, res) => {
    console.log('Root route accessed, redirecting to /login');
    res.redirect('/login');
  });

  // 加载路由
  try {
    const authRoutes = require('./routes/auth');
    const postRoutes = require('./routes/posts');
    const profileRoutes = require('./routes/profile');

    app.use('/', authRoutes);
    app.use('/', postRoutes); // 修改为根路径挂载，避免重复 /posts 前缀
    app.use('/profile', profileRoutes);

    console.log('Routes loaded');
  } catch (err) {
    console.error('Failed to load routes:', err);
    process.exit(1);
  }

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

  // 全局错误处理
  app.use((err, req, res, next) => {
    console.error('Global error:', err.stack);
    res.status(500).render('error', { error: err.message || 'Something broke!' });
  });

  // 404 处理
  app.use((req, res) => {
    console.log('404 - Requested path:', req.path);
    res.status(404).send('Cannot GET ' + req.path);
  });
})();