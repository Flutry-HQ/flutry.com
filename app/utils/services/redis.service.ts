import 'dotenv/config';
import Redis, { Cluster } from 'ioredis';

interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

class RedisService {
  private client: Redis | Cluster | null = null;
  private isConnected: boolean = false;

  constructor() {
    if (process.env.REDIS_TYPE === 'true') {
      this.connect();
    }
  }
  private async connect(): Promise<void> {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword = process.env.REDIS_PASSWORD;

      // Single node mód
      const redisConfig: RedisConfig = {
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      };

      this.client = new Redis(redisConfig);

      console.log(`Connecting to Redis: ${redisHost}:${redisPort}`);

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error: any) => {
        console.error('Redis connection error:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private ensureConnection(): void {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis is not connected');
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      this.ensureConnection();
      const result = await this.client!.get(`${process.env.REDIS_PREFIX || ''}${key}`);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      throw error;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<'OK'> {
    try {
      this.ensureConnection();
      const jsonString = JSON.stringify(value);
      if (ttlSeconds) {
        return await this.client!.set(`${process.env.REDIS_PREFIX || ''}${key}`, jsonString, 'EX', ttlSeconds);
      } else {
        return await this.client!.set(`${process.env.REDIS_PREFIX || ''}${key}`, jsonString);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      this.ensureConnection();
      return await this.client!.del(`${process.env.REDIS_PREFIX || ''}${key}`);
    } catch (error) {
      console.error('Redis DELETE error:', error);
      throw error;
    }
  }

  getConnectionStatus(): { connected: boolean; mode: string } {
    return {
      connected: this.isConnected,
      mode: 'single',
    };
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
        this.isConnected = false;
        console.log('Redis disconnected');
      }
    } catch (error) {
      console.error('Redis disconnect error:', error);
      throw error;
    }
  }
}

const redisService = new RedisService();

export default redisService;
export { RedisService };
