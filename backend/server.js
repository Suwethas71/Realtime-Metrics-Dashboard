const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Metrics Dashboard Backend API Server Running  `);
  console.log(` URL: http://localhost:${PORT}                 `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
  console.log(` Base Endpoint: /api/v1/dashboard/metrics      `);
  console.log(`===============================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down gracefully...', err);
  process.exit(1);
});

module.exports = server;
