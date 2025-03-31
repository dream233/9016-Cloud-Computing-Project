const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/register', (req, res) => {
  console.log('Rendering register page');
  res.render('register', { error: req.flash('error') });
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    console.log('Registering user:', { username, email });
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

router.get('/login', (req, res) => {
  console.log('Rendering login page');
  res.render('login', { error: req.flash('error') });
});

router.post('/login', (req, res, next) => {
  console.log('Login attempt with body:', req.body);
  passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/login',
    failureFlash: true
  }, (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      console.log('User logged in successfully:', user.email);
      return res.redirect('/posts');
    });
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  console.log('Logging out user');
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    res.redirect('/login');
  });
});

module.exports = router;