const express = require('express');
const router = express.Router();
const knex = require('../db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/prismatic-fact-455403-c4-9e843b43904b.json'
});
const bucket = storage.bucket('social_platform_image');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', async (req, res, next) => {
  try {
    const posts = await knex('posts')
      .select('posts.*', 'posts.author_id AS author_username')
      .orderBy('posts.timestamp', 'desc');
    
    const postsWithImagesAndLikes = await Promise.all(posts.map(async (post) => {
      const images = await knex('post_images').where({ post_id: post.id }).select('image_url');
      const likes = await knex('likes').where({ post_id: post.id }).count('id as count').first();
      return {
        ...post,
        author: { username: post.author_username || 'Unknown' },
        images: images.map(img => img.image_url),
        likes: likes ? Number(likes.count) : 0
      };
    }));
    
    res.render('posts', { posts: postsWithImagesAndLikes });
  } catch (err) {
    console.error('Error fetching posts:', err);
    next(err);
  }
});

router.get('/new', (req, res) => {
  res.render('new_post', { error: null });
});

router.post('/', upload.array('images', 5), async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = uuidv4();
    const authorId = req.cookies.username || 'anonymous';
    
    await knex('posts').insert({
      id: postId,
      author_id: authorId,
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
          blobStream.on('error', reject);
          blobStream.on('finish', resolve);
          blobStream.end(file.buffer);
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        imageUrls.push({ id: uuidv4(), post_id: postId, image_url: publicUrl });
      }
      await knex('post_images').insert(imageUrls);
    }

    res.redirect('/posts');
  } catch (err) {
    console.error('Error creating post:', err);
    res.render('new_post', { error: 'Failed to create post: ' + err.message });
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await knex('posts')
      .where('posts.id', req.params.id)
      .select('posts.*', 'posts.author_id AS author_username')
      .first();
    
    if (!post) return res.status(404).send('Post not found');

    const images = await knex('post_images').where({ post_id: post.id }).select('image_url');
    const likes = await knex('likes').where({ post_id: post.id }).count('id as count').first();
    const comments = await knex('comments')
      .where('comments.post_id', req.params.id)
      .select('comments.*', 'comments.author_id AS author_username')
      .orderBy('comments.timestamp', 'asc');

    const commentsWithLikes = await Promise.all(comments.map(async (comment) => {
      const commentLikes = await knex('likes').where({ comment_id: comment.id }).count('id as count').first();
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
    console.error('Error fetching post:', err);
    next(err);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const { content } = req.body;
    const commentId = uuidv4();
    const authorId = req.cookies.username || 'anonymous';
    
    await knex('comments').insert({
      id: commentId,
      post_id: req.params.id,
      author_id: authorId,
      content
    });

    res.redirect(`/posts/${req.params.id}`);
  } catch (err) {
    console.error('Error adding comment:', err);
    next(err);
  }
});

router.post('/:id/like', async (req, res, next) => {
  try {
    const existingLike = await knex('likes').where({ post_id: req.params.id }).first();
    if (existingLike) return res.redirect(`/posts/${req.params.id}`);

    const likeId = uuidv4();
    await knex('likes').insert({ id: likeId, post_id: req.params.id });
    res.redirect(`/posts/${req.params.id}`);
  } catch (err) {
    console.error('Error liking post:', err);
    next(err);
  }
});

router.post('/posts/comments/:id/like', async (req, res, next) => {
  try {
    const comment = await knex('comments').where({ id: req.params.id }).first();
    if (!comment) return res.status(404).send('Comment not found');

    const existingLike = await knex('likes').where({ comment_id: req.params.id }).first();
    if (existingLike) return res.redirect(`/posts/${comment.post_id}`);

    const likeId = uuidv4();
    await knex('likes').insert({ id: likeId, comment_id: req.params.id });
    res.redirect(`/posts/${comment.post_id}`);
  } catch (err) {
    console.error('Error liking comment:', err);
    next(err);
  }
});

router.get('/test-gcs', async (req, res) => {
  try {
    const [buckets] = await storage.getBuckets();
    res.send('GCS authentication successful: ' + buckets.map(b => b.name).join(', '));
  } catch (err) {
    console.error('GCS test error:', err);
    res.status(500).send('GCS authentication failed: ' + err.message);
  }
});

module.exports = router;