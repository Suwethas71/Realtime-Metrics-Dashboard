const express = require('express');
const cors = require('cors');

const dashboardRoutes = require('./routes/dashboard.routes');
const { AppError, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// API Route Mount
app.use('/api/v1/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Realtime Metrics Dashboard API is operational',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
