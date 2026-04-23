import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  APP_PORT: Joi.number().port().default(3000),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  JWT_SECRET: Joi.string().min(10).required(),
});
