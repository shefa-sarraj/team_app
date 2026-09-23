require('dotenv').config();

const REQUIRED_VARS = ['PORT', 'DATABASE_URL', 'NODE_ENV', 'CLIENT_ORIGIN'];

const missing = REQUIRED_VARS.filter((name) => !process.env[name] || process.env[name].trim() === '');

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. Check backend/.env against backend/.env.example.`
  );
}

module.exports = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
};
