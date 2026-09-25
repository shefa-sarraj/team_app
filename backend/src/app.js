const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const taskRoutes = require('./routes/task.routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// العناوين المسموح لها بالاتصال (السماح للتطوير المحلي + رابط Vercel)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  env.CLIENT_ORIGIN
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;