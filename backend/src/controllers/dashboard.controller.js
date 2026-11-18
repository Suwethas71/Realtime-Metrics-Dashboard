const { AppError } = require('../middlewares/error.middleware');

/**
 * Pre-seeded in-memory metric store representing real-time dashboard data.
 */
let metrics = [
  {
    id: 1,
    title: 'Active Platform Users',
    value: 12450,
    category: 'TRAFFIC',
    status: 'ACTIVE',
    updatedAt: new Date('2026-03-30T10:00:00.000Z').toISOString()
  },
  {
    id: 2,
    title: 'Server CPU Utilization',
    value: 78.5,
    category: 'SYSTEM',
    status: 'WARNING',
    updatedAt: new Date('2026-03-30T10:05:00.000Z').toISOString()
  },
  {
    id: 3,
    title: 'Monthly Recurring Revenue',
    value: 94250.0,
    category: 'REVENUE',
    status: 'ACTIVE',
    updatedAt: new Date('2026-03-30T10:10:00.000Z').toISOString()
  }
];

let nextId = 4;

/**
 * Get all metrics, optionally filtered by category.
 * GET /api/v1/dashboard/metrics
 */
const getMetrics = (req, res) => {
  const { category } = req.query;

  let filteredMetrics = [...metrics];
  if (category) {
    filteredMetrics = filteredMetrics.filter(
      (m) => m.category.toUpperCase() === category.trim().toUpperCase()
    );
  }

  return res.status(200).json({
    success: true,
    count: filteredMetrics.length,
    data: filteredMetrics
  });
};

/**
 * Get a single metric by its ID.
 * GET /api/v1/dashboard/metrics/:id
 */
const getMetricById = (req, res, next) => {
  const metricId = parseInt(req.params.id, 10);
  const metric = metrics.find((m) => m.id === metricId);

  if (!metric) {
    return next(new AppError(`Metric with ID ${metricId} not found`, 404));
  }

  return res.status(200).json({
    success: true,
    data: metric
  });
};

/**
 * Create a new dashboard metric.
 * POST /api/v1/dashboard/metrics
 */
const createMetric = (req, res) => {
  const { title, value, category, status } = req.body;

  const newMetric = {
    id: nextId++,
    title: title.trim(),
    value: Number(value),
    category: category.trim().toUpperCase(),
    status: (status && status.trim().toUpperCase()) || 'ACTIVE',
    updatedAt: new Date().toISOString()
  };

  metrics.push(newMetric);

  return res.status(201).json({
    success: true,
    message: 'Metric created successfully',
    data: newMetric
  });
};

/**
 * Update an existing dashboard metric.
 * PUT /api/v1/dashboard/metrics/:id
 */
const updateMetric = (req, res, next) => {
  const metricId = parseInt(req.params.id, 10);
  const metricIndex = metrics.findIndex((m) => m.id === metricId);

  if (metricIndex === -1) {
    return next(new AppError(`Metric with ID ${metricId} not found`, 404));
  }

  const { title, value, category, status } = req.body;

  const updatedMetric = {
    ...metrics[metricIndex],
    title: title.trim(),
    value: Number(value),
    category: category.trim().toUpperCase(),
    status: (status && status.trim().toUpperCase()) || metrics[metricIndex].status,
    updatedAt: new Date().toISOString()
  };

  metrics[metricIndex] = updatedMetric;

  return res.status(200).json({
    success: true,
    message: 'Metric updated successfully',
    data: updatedMetric
  });
};

/**
 * Delete a dashboard metric by ID.
 * DELETE /api/v1/dashboard/metrics/:id
 */
const deleteMetric = (req, res, next) => {
  const metricId = parseInt(req.params.id, 10);
  const metricIndex = metrics.findIndex((m) => m.id === metricId);

  if (metricIndex === -1) {
    return next(new AppError(`Metric with ID ${metricId} not found`, 404));
  }

  const [deletedMetric] = metrics.splice(metricIndex, 1);

  return res.status(200).json({
    success: true,
    message: 'Metric deleted successfully',
    data: deletedMetric
  });
};

module.exports = {
  getMetrics,
  getMetricById,
  createMetric,
  updateMetric,
  deleteMetric
};
