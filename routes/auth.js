const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');

console.log('Auth routes module loaded'); // 确认模块加载

// 注册页面
router.get('/register', (req, res) => {
  console.log('GET /register - Rendering register page');
  res.render('register', { error: req.flash('error') });
});

// 处理注册
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    console.log('POST /register - Registering user:', { username, email });
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) {
      console.log('Username already exists:', username);
      req.flash('error', 'Username already exists');
      return res.render('register', { error: req.flash('error') });
    }
    const existingEmail = await knex('users').where({ email }).first();
    if (existingEmail) {
      console.log('Email already exists:', email);
      req.flash('error', 'Email already exists');
      return res.render('register', { error: req.flash('error') });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await knex('users').insert({ id, username, email, password: hashedPassword });
    console.log('User registered successfully:', email);
    res.redirect('/login');
  } catch (err) {
    console.error('Error during registration:', err);
    req.flash('error', 'An error occurred during registration');
    res.render('register', { error: req.flash('error') });
  }
});

// 登录页面
router.get('/login', (req, res) => {
  console.log('GET /login - Rendering login page');
  console.log('Session:', req.session);
  console.log('Authenticated:', req.isAuthenticated());
  res.render('login', { error: req.flash('error') });
});

// 处理登录
router.post('/login', (req, res, next) => {
  console.log('POST /login - Login attempt with body:', req.body);
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    // 手动登录
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      console.log('User logged in:', user.email);
      // 保存会话后再重定向
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return next(err);
        }
        console.log('Session saved:', req.session);
        res.redirect('/posts');
      });
    });
  })(req, res, next);
});

// 登出
router.get('/logout', (req, res, next) => {
  console.log('GET /logout - Logging out user');
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    // 销毁会话，确保登出后认证状态清除
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return next(err);
      }
      console.log('Session destroyed');
      res.redirect('/login');
    });
  });
});

module.exports = router;