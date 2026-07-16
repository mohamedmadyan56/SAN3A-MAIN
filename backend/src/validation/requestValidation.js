const Joi = require('joi');

exports.createRequestSchema = Joi.object({
  service: Joi.string().required().messages({
    'any.required': 'الخدمة مطلوبة',
  }),
  address: Joi.string().min(5).required().messages({
    'string.min': 'العنوان لازم 5 أحرف على الأقل',
    'any.required': 'العنوان مطلوب',
  }),
  coordinates: Joi.array()
    .items(Joi.number().min(-180).max(180))
    .length(2)
    .optional()
    .messages({
      'array.length': 'الإحداثيات لازم تكون [longitude, latitude]',
    }),
  clientNotes: Joi.string().max(500).optional().allow(''),
  paymentMethod: Joi.string()
    .valid('CASH', 'CARD', 'WALLET')
    .default('CASH')
    .messages({
      'any.only': 'طريقة الدفع: CASH, CARD, أو WALLET',
    }),
  scheduledAt: Joi.date().iso().optional().messages({
    'date.format': 'التاريخ يجب أن يكون ISO format',
  }),
});

// Validation لـ Confirm Booking (body: paymentMethod)
exports.confirmBookingSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid('CASH', 'CARD', 'WALLET')
    .required()
    .messages({
      'any.only': 'طريقة الدفع: CASH, CARD, أو WALLET',
      'any.required': 'طريقة الدفع مطلوبة',
    }),
});