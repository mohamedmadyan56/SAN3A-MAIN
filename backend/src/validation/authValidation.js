const Joi = require('joi');


// ---------- Signup ----------
exports.signupSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'الاسم مطلوب',
      'any.required': 'الاسم مطلوب',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'البريد الإلكتروني غير صالح',
      'any.required': 'البريد الإلكتروني مطلوب',
    }),

  phone: Joi.string()
    .pattern(/^01[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'رقم الهاتف غير صالح - يجب أن يبدأ 01 ويتبعه 9 أرقام',
      'any.required': 'رقم الهاتف مطلوب',
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'كلمة السر لازم 8 أحرف على الأقل',
      'any.required': 'كلمة السر مطلوبة',
    }),

  role: Joi.string()
    .valid('customer', 'craftsman')
    .default('customer')
    .messages({
      'any.only': 'الدور يجب أن يكون customer أو craftsman',
    }),
});

// ---------- Login ----------
exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'any.required': 'البريد الإلكتروني مطلوب',
  }),
  password: Joi.string().required().messages({
    'any.required': 'كلمة السر مطلوبة',
  }),
});