// Database connection settings - change these to match your own MySQL login
module.exports = {
  host: process.env.SPARKCLEAN_DB_HOST || '127.0.0.1',
  port: Number(process.env.SPARKCLEAN_DB_PORT || 3306),
  user: process.env.SPARKCLEAN_DB_USER ?? 'sparkclean',
  password: process.env.SPARKCLEAN_DB_PASSWORD ?? 'sparkclean',
  database: 'sparkclean'
};
