// db.js
const knex = require('knex')({
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '34.29.132.73',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'social_platform',
      port: 3306
    }
  });
  
  module.exports = knex;