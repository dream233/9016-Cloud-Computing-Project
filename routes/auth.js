const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');

console.log('Auth routes module loaded');

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
  res.render('login', { error: req.flash('error') });
});

// 处理登录（不保存用户信息，仅验证后跳转）
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('POST /login - Login attempt with body:', { email });
  try {
    const user = await knex('users').where({ email }).first();
    if (!user) {
      console.log('No user found with email:', email);
      req.flash('error', 'No user with that email');
      return res.redirect('/login');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password incorrect for email:', email);
      req.flash('error', 'Password incorrect');
      return res.redirect('/login');
    }
    console.log('User authenticated successfully:', email);
    res.redirect('/posts');
  } catch (err) {
    console.error('Error during login:', err);
    req.flash('error', 'An error occurred during login');
    res.redirect('/login');
  }
});

// 登出（无需会话，直接跳转）
router.get('/logout', (req, res) => {
  console.log('GET /logout - Logging out user');
  res.redirect('/login');
});

module.exports = router;