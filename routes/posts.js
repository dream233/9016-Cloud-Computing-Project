const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 获取所有帖子
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().populate('author').sort({ timestamp: -1 });
    res.render('posts', { posts });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 获取单个帖子
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');
    if (!post) {
      return res.status(404).send('Post not found');
    }
    const comments = await Comment.find({ post: req.params.id }).populate('author').sort({ timestamp: 1 });
    res.render('post', { post, comments });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 创建帖子页面
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('new_post');
});

// 处理创建帖子
router.post('/', ensureAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const { content } = req.body;
    const images = req.files.map(file => '/uploads/' + file.filename);
    const post = new Post({
      author: req.user._id,
      content,
      images
    });
    await post.save();
    res.redirect('/posts');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 点赞帖子
router.post('/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
      await post.save();
    }
    res.redirect('/posts/' + req.params.id);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 添加评论
router.post('/:id/comments', ensureAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = new Comment({
      post: req.params.id,
      author: req.user._id,
      content
    });
    await comment.save();
    res.redirect('/posts/' + req.params.id);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 点赞评论
router.post('/comments/:id/like', ensureAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }
    if (!comment.likes.includes(req.user._id)) {
      comment.likes.push(req.user._id);
      await comment.save();
    }
    res.redirect('/posts/' + comment.post);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;