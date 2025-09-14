const Joi = require('joi');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Phone number validation (Indian format)
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number'
    }),

  // Email validation
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  // Password validation
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters'
    }),

  // Name validation
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),

  // UUID validation
  uuid: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid ID format'
    }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Address validation
  address: Joi.object({
    street: Joi.string().min(5).max(200).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required(),
    landmark: Joi.string().max(100).optional(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }),

  // Material validation
  material: Joi.object({
    material_id: Joi.string().uuid().required(),
    estimated_weight: Joi.number().positive().required(),
    description: Joi.string().max(500).optional()
  }),

  // Booking validation
  booking: Joi.object({
    pickup_address: schemas.address,
    materials: Joi.array().items(schemas.material).min(1).required(),
    scheduled_at: Joi.date().greater('now').required(),
    special_instructions: Joi.string().max(500).optional()
  })
};

// Predefined validation middleware
const validations = {
  // User registration
  registerUser: validate(Joi.object({
    phone: schemas.phone,
    email: schemas.email,
    name: schemas.name,
    password: schemas.password,
    role: Joi.string().valid('customer', 'collector').required(),
    address: schemas.address.optional()
  })),

  // User login
  loginUser: validate(Joi.object({
    phone: schemas.phone,
    password: schemas.password
  })),

  // Create booking
  createBooking: validate(schemas.booking),

  // Update profile
  updateProfile: validate(Joi.object({
    name: schemas.name.optional(),
    email: schemas.email,
    address: schemas.address.optional(),
    profile_image_url: Joi.string().uri().optional()
  })),

  // Change password
  changePassword: validate(Joi.object({
    current_password: schemas.password,
    new_password: schemas.password
  })),

  // Pagination
  pagination: validate(schemas.pagination, 'query'),

  // UUID parameter
  uuidParam: validate(Joi.object({
    id: schemas.uuid
  }), 'params')
};

module.exports = {
  validate,
  schemas,
  validations
};
