const express = require('express');
const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: 'your-cloud-sql-ip',
    user: 'root',
    password: 'your-password',
    database: 'social_platform'
  }
});
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// 路由
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile');

app.use('/', authRoutes);
app.use('/posts', postRoutes);
app.use('/profile', profileRoutes);

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/posts');
  } else {
    res.redirect('/login');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, knex };