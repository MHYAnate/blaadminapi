import Joi from 'joi';

// Schema for creating a product
export const createProductSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'Product name is required',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().required().messages({
    'string.empty': 'Product description is required',
    'any.required': 'Product description is required',
  }),
  categoryId: Joi.number().required().messages({
    'number.base': 'Category ID must be a number',
    'any.required': 'Category ID is required',
  }),
  manufacturerId: Joi.number().required().messages({
    'number.base': 'Manufacturer ID must be a number',
    'any.required': 'Manufacturer ID is required',
  }),
  options: Joi.array()
    .items(
      Joi.object({
        value: Joi.string().required().messages({
          'string.empty': 'Option value is required',
          'any.required': 'Option value is required',
        }),
        weight: Joi.number().default(0),
        stockPrice: Joi.number().default(0),
        sellingPrice: Joi.number().default(0),
        markupType: Joi.string().valid('FIXED', 'PERCENTAGE').default('FIXED'),
        markupValue: Joi.number().default(0),
        price: Joi.number().default(0),
        moq: Joi.number().default(1),
        unit: Joi.string().required().messages({
          'string.empty': 'Unit is required',
          'any.required': 'Unit is required',
        }),
        image: Joi.array().items(Joi.string().uri()).required().messages({
          'array.base': 'Image must be an array of URLs',
          'any.required': 'Image is required',
        }),
        inventory: Joi.number().default(0),
        lowStockThreshold: Joi.number().default(10),
      })
    )
    .required()
    .messages({
      'array.base': 'Options must be an array',
      'any.required': 'Options are required',
    }),
});


// Schema for updating a product
export const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  categoryId: Joi.number().optional(),
  manufacturerId: Joi.number().optional(),
  options: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().optional(), // Allow the id field for updates
        value: Joi.string().optional(),
        weight: Joi.number().optional(),
        stockPrice: Joi.number().optional(),
        sellingPrice: Joi.number().optional(),
        markupType: Joi.string().valid('FIXED', 'PERCENTAGE').optional(),
        markupValue: Joi.number().optional(),
        price: Joi.number().optional(),
        moq: Joi.number().optional(),
        unit: Joi.string().optional(),
        image: Joi.array().items(Joi.string().uri()).optional(),
        inventory: Joi.number().optional(),
        lowStockThreshold: Joi.number().optional(),
      })
    )
    .optional(),
});


// Define the validation schema
export const createNotificationSchema = Joi.object({
  userId: Joi.number().required().messages({
    'number.base': 'User ID must be a number',
    'any.required': 'User ID is required',
  }),
  title: Joi.string().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required',
  }),
  message: Joi.string().required().messages({
    'string.empty': 'Message is required',
    'any.required': 'Message is required',
  }),
  type: Joi.string()
    .valid('INFO', 'WARNING', 'SUCCESS', 'ERROR') // Adjust based on your enum values
    .required()
    .messages({
      'any.only': 'Type must be one of INFO, WARNING, SUCCESS, ERROR',
      'any.required': 'Type is required',
    }),
});

