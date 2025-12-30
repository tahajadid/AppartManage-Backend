require('dotenv').config();

const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

module.exports = {
  PORT,
  allowedOrigins,
};

