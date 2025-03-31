const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash'); // 添加 connect-flash
const knex = require('./db'); // 导入 db.js
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  keyFilename: 'D:/BaiduSyncdisk/western文件/25Winter/ece9016/prismatic-fact-455403-c4-9e843b43904b.json'
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

// 加载 passport 配置（确保在 app 配置完成后）
require('./config/passport')(passport);

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

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = { app, knex };