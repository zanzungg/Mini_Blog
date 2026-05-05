import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APP_PORT: Joi.number().port().default(3000),
  TRUST_PROXY: Joi.boolean().default(false),
  CORS_ORIGIN: Joi.string().trim().default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().default(false),
  THROTTLE_TTL_MS: Joi.number().integer().positive().default(60000),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  JWT_SECRET: Joi.string().min(10).required(),
  JWT_EXPIRES_IN_SECONDS: Joi.number().integer().positive().default(900),
  REFRESH_TOKEN_SECRET: Joi.string().min(10).required(),
  REFRESH_TOKEN_EXPIRES_IN_SECONDS: Joi.number()
    .integer()
    .positive()
    .default(604800),
});
