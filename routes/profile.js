const express = require('express');
const router = express.Router();
const knex = require('../db');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

router.get('/', async (req, res, next) => {
  try {
    console.log('GET /profile - Fetching profile for username:', req.cookies.username);
    const username = req.cookies.username || 'anonymous';
    
    // 根据用户名查询用户（假设 users 表有 username 字段）
    const user = await knex('users').where({ username }).first();
    
    if (!user) {
      console.log('User not found for username:', username);
      return res.render('profile', { user: { username: 'anonymous' }, error: 'User not found' });
    }

    res.render('profile', { user, error: null });
  } catch (err) {
    console.error('Error fetching profile:', err);
    next(err); // 使用全局错误处理
  }
});

module.exports = router;