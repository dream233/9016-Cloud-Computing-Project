const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'database-svc.prod.svc.cluster.local',
    user: process.env.DB_USER || 'mysqluser',
    password: process.env.DB_PASSWORD || 'mysqlpassword',
    database: process.env.DB_NAME || 'social_platform_db',
    port: 3306,
    pool: { min: 0, max: 10 } // 添加连接池配置
  }
});

module.exports = knex;