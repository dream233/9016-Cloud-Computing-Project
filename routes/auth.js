const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser'); // 新增依赖

router.use(cookieParser()); // 添加 cookie 支持

router.get('/register', (req, res) => {
  console.log('GET /register - Rendering register page');
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    console.log('POST /register - Registering user:', { username, email });
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) {
      console.log('Username already exists:', username);
      return res.render('register', { error: 'Username already exists' });
    }
    const existingEmail = await knex('users').where({ email }).first();
    if (existingEmail) {
      console.log('Email already exists:', email);
      return res.render('register', { error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await knex('users').insert({ id, username, email, password: hashedPassword });
    console.log('User registered successfully:', email);
    res.redirect('/login');
  } catch (err) {
    console.error('Error during registration:', err);
    res.render('register', { error: 'An error occurred during registration' });
  }
});

router.get('/login', (req, res) => {
  console.log('GET /login - Rendering login page');
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('POST /login - Login attempt with body:', { email });
  try {
    const user = await knex('users').where({ email }).first();
    if (!user) {
      console.log('No user found with email:', email);
      return res.render('login', { error: 'No user with that email' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password incorrect for email:', email);
      return res.render('login', { error: 'Password incorrect' });
    }
    console.log('User authenticated successfully:', email);
    // 设置 cookie 记录用户名
    res.cookie('username', user.username, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    res.redirect('/posts');
  } catch (err) {
    console.error('Error during login:', err);
    res.render('login', { error: 'An error occurred during login' });
  }
});

router.get('/logout', (req, res) => {
  console.log('GET /logout - Logging out user');
  res.clearCookie('username'); // 清除 cookie
  res.redirect('/login');
});

module.exports = router;