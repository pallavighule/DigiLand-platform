export const config = () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  jwtSecret: process.env.JWT_SECRET,

  nats: {
    url: process.env.NATS_URL,
  },

  database: {
    type: 'postgres',
    port: 5432,
    DATABASE_URL: process.env.DATABASE_URL,
    synchronize: false,
    logging: false,
    entities: [__dirname + '/../**/**.model{.ts,.js}'],
  },
});
