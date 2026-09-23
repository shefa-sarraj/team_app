const prisma = require('../config/db');
const { success, failure } = require('../utils/ApiResponse');

async function getHealth(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json(success({ status: 'ok' }));
  } catch (err) {
    res.status(503).json(failure('Database connection unavailable'));
  }
}

module.exports = { getHealth };
