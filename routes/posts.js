const express = require('express');
const router = express.Router();
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');
const { ensureAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

// 配置 Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/prismatic-fact-455403-c4-9e843b43904b.json'
});
const bucket = storage.bucket('social_platform_image');

// 配置 Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 获取所有帖子
router.get('/', ensureAuthenticated, async (req, res, next) => {
  try {
    const posts = await knex('posts')
      .leftJoin('users', 'posts.author_id', 'users.id')
      .select(
        'posts.*',
        knex.raw('users.username as "author_username"')
      )
      .orderBy('posts.timestamp', 'desc');
    
    const postsWithImagesAndLikes = await Promise.all(posts.map(async (post) => {
      const images = await knex('post_images')
        .where({ post_id: post.id })
        .select('image_url');
      const likes = await knex('likes')
        .where({ post_id: post.id })
        .count('id as count')
        .first();
      return {
        ...post,
        author: { username: post.author_username || 'Unknown' },
        images: images.map(img => img.image_url),
        likes: likes ? Number(likes.count) : 0
      };
    }));
    
    res.render('posts', { posts: postsWithImagesAndLikes });
  } catch (err) {
    next(err); // 传递错误给 Express 错误处理中间件
  }
});

// 创建帖子页面
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('new_post');
});

// 创建新帖子
router.post('/', ensureAuthenticated, upload.array('images', 5), async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = uuidv4();
    
    await knex('posts').insert({
      id: postId,
      author_id: req.user.id,
      content
    });

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = bucket.file(`uploads/${Date.now()}_${file.originalname}`);
        const blobStream = blob.createWriteStream({
          resumable: false,
          metadata: { contentType: file.mimetype }
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', (err) => reject(err));
          blobStream.on('finish', () => resolve());
          blobStream.end(file.buffer);
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        imageUrls.push({ id: uuidv4(), post_id: postId, image_url: publicUrl });
      }

      await knex('post_images').insert(imageUrls);
    }

    res.redirect('/posts');
  } catch (err) {
    next(err);
  }
});

// 获取单个帖子
router.get('/:id', ensureAuthenticated, async (req, res, next) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
    return res.status(400).send('Invalid post ID');
  }

  try {
    const post = await knex('posts')
      .leftJoin('users', 'posts.author_id', 'users.id')
      .where('posts.id', req.params.id)
      .select(
        'posts.*',
        knex.raw('users.username as "author_username"')
      )
      .first();
    
    if (!post) {
      return res.status(404).send('Post not found');
    }

    const images = await knex('post_images')
      .where({ post_id: post.id })
      .select('image_url');
    const likes = await knex('likes')
      .where({ post_id: post.id })
      .count('id as count')
      .first();

    const comments = await knex('comments')
      .leftJoin('users', 'comments.author_id', 'users.id')
      .where('comments.post_id', req.params.id)
      .select(
        'comments.*',
        knex.raw('users.username as "author_username"')
      )
      .orderBy('comments.timestamp', 'asc');

    const commentsWithLikes = await Promise.all(comments.map(async (comment) => {
      const commentLikes = await knex('likes')
        .where({ comment_id: comment.id })
        .count('id as count')
        .first();
      return {
        ...comment,
        author: { username: comment.author_username || 'Unknown' },
        likes: commentLikes ? Number(commentLikes.count) : 0
      };
    }));

    res.render('post', {
      post: {
        ...post,
        author: { username: post.author_username || 'Unknown' },
        images: images.map(img => img.image_url),
        likes: likes ? Number(likes.count) : 0
      },
      comments: commentsWithLikes
    });
  } catch (err) {
    next(err);
  }
});

// 添加评论
router.post('/:id/comments', ensureAuthenticated, async (req, res, next) => {
  try {
    const { content } = req.body;
    const commentId = uuidv4();
    
    await knex('comments').insert({
      id: commentId,
      post_id: req.params.id,
      author_id: req.user.id,
      content
    });

    res.redirect(`/posts/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// 点赞帖子
router.post('/:id/like', ensureAuthenticated, async (req, res, next) => {
  try {
    const existingLike = await knex('likes')
      .where({ user_id: req.user.id, post_id: req.params.id })
      .first();
    
    if (existingLike) {
      return res.redirect(`/posts/${req.params.id}`);
    }

    const likeId = uuidv4();
    await knex('likes').insert({
      id: likeId,
      user_id: req.user.id,
      post_id: req.params.id
    });

    res.redirect(`/posts/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// 点赞评论
router.post('/comments/:id/like', ensureAuthenticated, async (req, res, next) => {
  try {
    const comment = await knex('comments')
      .where({ id: req.params.id })
      .first();
    
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    const existingLike = await knex('likes')
      .where({ user_id: req.user.id, comment_id: req.params.id })
      .first();
    
    if (existingLike) {
      return res.redirect(`/posts/${comment.post_id}`);
    }

    const likeId = uuidv4();
    await knex('likes').insert({
      id: likeId,
      user_id: req.user.id,
      comment_id: req.params.id
    });

    res.redirect(`/posts/${comment.post_id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;