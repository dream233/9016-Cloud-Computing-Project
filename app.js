const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 会话中间件
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Passport 中间件
app.use(passport.initialize());
app.use(passport.session());

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 连接 MongoDB
mongoose.connect('mongodb://localhost:27017/social_platform');

// Passport 配置
require('./config/passport')(passport);

// Multer 设置（图片上传）
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 路由
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

app.use('/', authRoutes);
app.use('/posts', postRoutes);


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