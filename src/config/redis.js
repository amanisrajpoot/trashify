const redis = require('redis');

let redisClient = null;

// Mock Redis client for development when Redis is not available
const mockRedis = {
  async get(key) { 
    console.log(`[Mock Redis] GET ${key}`);
    return null; 
  },
  async set(key, value, options) { 
    console.log(`[Mock Redis] SET ${key} = ${value}`);
    return 'OK'; 
  },
  async del(key) { 
    console.log(`[Mock Redis] DEL ${key}`);
    return 1; 
  },
  async exists(key) { 
    console.log(`[Mock Redis] EXISTS ${key}`);
    return 0; 
  },
  async expire(key, seconds) { 
    console.log(`[Mock Redis] EXPIRE ${key} ${seconds}`);
    return 1; 
  },
  async disconnect() { 
    console.log('[Mock Redis] Disconnected');
    return; 
  }
};

async function connectRedis() {
  // Skip Redis connection in development if not configured
  if (!process.env.REDIS_URL || process.env.REDIS_URL === 'redis://localhost:6379') {
    console.warn('⚠️  Redis not configured. Using mock Redis for development.');
    redisClient = mockRedis;
    return redisClient;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis connection failed, using mock Redis:', error.message);
    redisClient = mockRedis;
    return redisClient;
  }
}

function getRedisClient() {
  if (!redisClient) {
    console.warn('⚠️  Redis client not initialized, using mock Redis');
    return mockRedis;
  }
  return redisClient;
}

module.exports = {
  connectRedis,
  getRedisClient
};
