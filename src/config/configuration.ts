export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  openweather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    apiUrl:
      process.env.OPENWEATHER_API_URL ||
      'https://api.openweathermap.org/data/2.5',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  cache: {
    weatherTtl: parseInt(process.env.WEATHER_CACHE_TTL, 10) || 300,
  },
});
