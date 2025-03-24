const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// 注册页面
router.get('/register', (req, res) => {
  res.render('register');
});

// 处理注册
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// 登录页面
router.get('/login', (req, res) => {
  res.render('login');
});

// 处理登录
router.post('/login', passport.authenticate('local', {
  successRedirect: '/posts',
  failureRedirect: '/login',
  failureFlash: true
}));

// 登出
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

module.exports = router;