const knex = require('./db');

async function initializeDatabase() {
  try {
    // 测试数据库连接
    await knex.raw('SELECT 1');
    console.log('Connected to MySQL database');

    // 创建 users 表
    await knex.schema.createTable('users', (table) => {
      table.string('id', 255).primary();
      table.string('username', 255).notNullable();
      table.string('email', 255).notNullable();
      table.string('password', 255).notNullable();
      table.string('profilePicture', 255);
      table.string('backgroundPicture', 255);
      table.unique('username', { indexName: 'users_username_unique' });
      table.unique('email', { indexName: 'users_email_unique' });
    });

    // 创建 posts 表
    await knex.schema.createTable('posts', (table) => {
      table.string('id', 255).primary();
      table.string('author_id', 255).references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.dateTime('timestamp').defaultTo(knex.fn.now());
    });

    // 创建 post_images 表
    await knex.schema.createTable('post_images', (table) => {
      table.string('id', 255).primary();
      table.string('post_id', 255).references('id').inTable('posts').onDelete('CASCADE');
      table.string('image_url', 255);
    });

    // 创建 comments 表
    await knex.schema.createTable('comments', (table) => {
      table.string('id', 255).primary();
      table.string('post_id', 255).references('id').inTable('posts').onDelete('CASCADE');
      table.string('author_id', 255).references('id').inTable('users').onDelete('CASCADE');
      table.text('content').notNullable();
      table.dateTime('timestamp').defaultTo(knex.fn.now());
    });

    // 创建 likes 表
    await knex.schema.createTable('likes', (table) => {
      table.string('id', 255).primary();
      table.string('user_id', 255).references('id').inTable('users').onDelete('CASCADE');
      table.string('post_id', 255).references('id').inTable('posts').onDelete('CASCADE');
      table.string('comment_id', 255).references('id').inTable('comments').onDelete('CASCADE');
    });

    console.log('Database tables initialized');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

initializeDatabase();