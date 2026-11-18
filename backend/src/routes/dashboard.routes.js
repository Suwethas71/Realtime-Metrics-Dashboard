const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const validate = require('../middlewares/validate.middleware');
const {
  metricIdValidator,
  createMetricValidator,
  updateMetricValidator,
  queryCategoryValidator
} = require('../validators/dashboard.validator');

// List all metrics (optional query filter: ?category=...)
router.get(
  '/metrics',
  queryCategoryValidator,
  validate,
  dashboardController.getMetrics
);

// Get a single metric by ID
router.get(
  '/metrics/:id',
  metricIdValidator,
  validate,
  dashboardController.getMetricById
);

// Create a new metric
router.post(
  '/metrics',
  createMetricValidator,
  validate,
  dashboardController.createMetric
);

// Update an existing metric by ID
router.put(
  '/metrics/:id',
  updateMetricValidator,
  validate,
  dashboardController.updateMetric
);

// Delete a metric by ID
router.delete(
  '/metrics/:id',
  metricIdValidator,
  validate,
  dashboardController.deleteMetric
);

module.exports = router;
