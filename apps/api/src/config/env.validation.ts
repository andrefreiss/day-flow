import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  WEB_ORIGIN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN_SECONDS: Joi.number().integer().positive().default(604800),
});
