const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const knex = require('./db');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/prismatic-fact-455403-c4-9e843b43904b.json'
});

const app = express();

// 设置视图引擎和静态文件
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 配置 session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// 添加 connect-flash
app.use(flash());

// 初始化 passport
app.use(passport.initialize());
app.use(passport.session());

// 加载 passport 配置
require('./config/passport')(passport);

// 初始化数据库表
async function initializeDatabase() {
  try {
    // 测试数据库连接
    await knex.raw('SELECT 1');
    console.log('Connected to MySQL database');

    // 检查并创建 users 表
    if (await knex.schema.hasTable('users')) {
      await knex.schema.dropTable('users'); // 删除现有表以避免约束冲突
    }
    await knex.schema.createTable('users', (table) => {
      table.string('id', 255).primary();
      table.string('username', 255).unique().notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('password', 255).notNullable();
      table.string('profilePicture', 255);
      table.string('backgroundPicture', 255);
    });

    // 检查并创建 posts 表
    if (await knex.schema.hasTable('posts')) {
      await knex.schema.dropTable('posts');
    }
    await knex.schema.createTable('posts', (table) => {
      table.string('id', 255).primary();
      table.string('author_id', 255).references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.dateTime('timestamp').defaultTo(knex.fn.now());
    });

    // 检查并创建 post_images 表
    if (await knex.schema.hasTable('post_images')) {
      await knex.schema.dropTable('post_images');
    }
    await knex.schema.createTable('post_images', (table) => {
      table.string('id', 255).primary();
      table.string('post_id', 255).references('id').inTable('posts').onDelete('CASCADE');
      table.string('image_url', 255);
    });

    // 检查并创建 comments 表
    if (await knex.schema.hasTable('comments')) {
      await knex.schema.dropTable('comments');
    }
    await knex.schema.createTable('comments', (table) => {
      table.string('id', 255).primary();
      table.string('post_id', 255).references('id').inTable('posts').onDelete('CASCADE');
      table.string('author_id', 255).references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.dateTime('timestamp').defaultTo(knex.fn.now());
    });

    // 检查并创建 likes 表
    if (await knex.schema.hasTable('likes')) {
      await knex.schema.dropTable('likes');
    }
    await knex.schema.createTable('likes', (table) => {
      table.string('id', 255).primary();
      table.string('user_id', 255).references('id').inTable('users').onDelete('CASCADE');
      table.string('post_id', 255).references('id').inTable('posts').onDelete('CASCADE');
      table.string('comment_id', 255).references('id').inTable('comments').onDelete('CASCADE');
    });

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

// 在服务器启动前初始化数据库
initializeDatabase().then(() => {
  // 路由
  const authRoutes = require('./routes/auth');
  const postRoutes = require('./routes/posts');
  const profileRoutes = require('./routes/profile');

  app.use('/', authRoutes);
  app.use('/posts', postRoutes);
  app.use('/profile', profileRoutes);

  // 根路由
  app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
      res.redirect('/posts');
    } else {
      res.redirect('/login');
    }
  });

  // 启动服务器
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = { app, knex };