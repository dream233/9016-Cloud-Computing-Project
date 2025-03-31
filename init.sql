CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  profilePicture VARCHAR(255),
  backgroundPicture VARCHAR(255)
);

CREATE TABLE posts (
  id VARCHAR(255) PRIMARY KEY,
  author_id VARCHAR(255),
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE post_images (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255),
  image_url VARCHAR(255),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE TABLE comments (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255),
  author_id VARCHAR(255),
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE likes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  post_id VARCHAR(255),
  comment_id VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (comment_id) REFERENCES comments(id)
);