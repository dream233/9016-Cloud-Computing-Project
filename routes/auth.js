const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { knex } = require('../app');
const { v4: uuidv4 } = require('uuid');

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) {
      return res.render('register', { error: 'Username already exists' });
    }
    const existingEmail = await knex('users').where({ email }).first();
    if (existingEmail) {
      return res.render('register', { error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await knex('users').insert({ id, username, email, password: hashedPassword });
    res.redirect('/login');
  } catch (err) {
    res.render('register', { error: 'An error occurred' });
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/posts',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

module.exports = router;