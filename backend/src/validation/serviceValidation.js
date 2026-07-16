const Joi = require('joi');

exports.createServiceSchema = Joi.object({
  nameAr: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'الاسم بالعربية مطلوب',
    'any.required': 'الاسم بالعربية مطلوب',
  }),
  nameEn: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'الاسم بالإنجليزية مطلوب',
    'any.required': 'الاسم بالإنجليزية مطلوب',
  }),
  slug: Joi.string().required().messages({
    'any.required': 'Slug مطلوب',
  }),
  icon: Joi.string().required().messages({
    'any.required': 'الأيقونة مطلوبة',
  }),
});
