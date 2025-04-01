const express = require('express');
const path = require('path');
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

// 测试数据库连接并初始化应用
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

  // 配置 flash（可选，如果你仍需要错误提示）
  app.use(flash());
  console.log('Flash middleware configured');

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

    app.use('/', authRoutes);       // 挂载 auth 路由
    app.use('/posts', postRoutes);  // 挂载 posts 路由
    app.use('/profile', profileRoutes); // 挂载 profile 路由
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