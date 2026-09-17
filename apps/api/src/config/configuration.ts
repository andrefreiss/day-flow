export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  apiPrefix: process.env.API_PREFIX,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS),
  webOrigin: process.env.WEB_ORIGIN,
});
