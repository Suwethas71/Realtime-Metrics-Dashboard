const { body, param, query } = require('express-validator');

const ALLOWED_CATEGORIES = ['SALES', 'TRAFFIC', 'SYSTEM', 'REVENUE'];
const ALLOWED_STATUSES = ['ACTIVE', 'WARNING', 'CRITICAL'];

/**
 * Route parameter validation for metric ID
 */
const metricIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Metric ID is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Metric ID must be a positive integer')
    .toInt()
];

/**
 * Validation rules for creating a new metric
 */
const createMetricValidator = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('Title is required')
    .bail()
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Title must be between 3 and 50 characters'),

  body('value')
    .exists({ checkNull: true })
    .withMessage('Value is required')
    .bail()
    .isNumeric()
    .withMessage('Value must be a valid numeric value')
    .toFloat(),

  body('category')
    .exists({ checkFalsy: true })
    .withMessage('Category is required')
    .bail()
    .isString()
    .withMessage('Category must be a string')
    .bail()
    .trim()
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`),

  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .bail()
    .trim()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`)
];

/**
 * Validation rules for updating an existing metric
 */
const updateMetricValidator = [
  ...metricIdValidator,
  ...createMetricValidator
];

/**
 * Validation rules for querying metrics
 */
const queryCategoryValidator = [
  query('category')
    .optional()
    .trim()
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`Category filter must be one of: ${ALLOWED_CATEGORIES.join(', ')}`)
];

module.exports = {
  metricIdValidator,
  createMetricValidator,
  updateMetricValidator,
  queryCategoryValidator,
  ALLOWED_CATEGORIES,
  ALLOWED_STATUSES
};
