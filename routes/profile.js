const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 显示Profile页面
router.get('/', ensureAuthenticated, (req, res) => {
    res.render('profile', { user: req.user, error: null });
  });

// 处理背景图片上传
router.post('/background', ensureAuthenticated, upload.single('backgroundPicture'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.backgroundPicture = '/uploads/' + req.file.filename;
    await user.save();
    res.redirect('/profile');
  } catch (err) {
    res.render('profile', { user: req.user, error: 'Failed to upload background picture' });
  }
});

module.exports = router;