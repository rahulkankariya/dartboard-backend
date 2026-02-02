import Joi from 'joi';

export const signupSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'FIRST_NAME_REQUIRED',
      'any.required': 'FIRST_NAME_REQUIRED',
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'LAST_NAME_REQUIRED',
      'any.required': 'LAST_NAME_REQUIRED',
    }),
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'EMAIL_INVALID',
      'string.empty': 'EMAIL_REQUIRED',
      'any.required': 'EMAIL_REQUIRED',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'PASSWORD_MIN',
      'string.empty': 'PASSWORD_REQUIRED',
      'any.required': 'PASSWORD_REQUIRED',
    }),
  terms: Joi.boolean().optional(),
}).required();

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'EMAIL_INVALID',
      'any.required': 'EMAIL_REQUIRED',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'PASSWORD_REQUIRED',
    }),
}).required();