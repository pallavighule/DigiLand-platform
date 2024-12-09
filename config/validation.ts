import * as Joi from 'joi';

export const validationSchema = Joi.object({
  JWT_SECRET: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().required(),
  NATS_URL: Joi.string().required(),
});
