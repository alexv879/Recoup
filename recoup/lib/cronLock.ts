import { Redis } from '@upstash/redis';
import { logInfo, logError, logWarn } from '@/utils/logger';

/**
 * Distributed Cron Job Locking System
 *
 * Prevents multiple instances of the same cron job from running simultaneously.
 * Uses Upstash Redis for distributed locking to ensure exactly-once execution
 * even when deployed across multiple serverless instances (Vercel, etc.).
 *
 * Features:
 * - Automatic TTL (Time To Live) to prevent stuck locks
 * - Heartbeat mechanism to extend lock during long-running jobs
 * - Graceful lock release on completion
 * - Configurable lock duration based on job expected runtime
 */

// Initialize Redis client
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in environment variables'
      );
    }

    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

export interface CronLockOptions {
  /**
   * Job name (unique identifier)
   * e.g., 'retry-webhooks', 'process-escalations'
   */
  jobName: string;

  /**
   * Maximum duration the lock should be held (in seconds)
   * Default: 300 seconds (5 minutes)
   *
   * This is a safety mechanism - if the job crashes and doesn't release the lock,
   * it will auto-expire after this duration.
   */
  lockDuration?: number;

  /**
   * How often to send heartbeat to keep lock alive (in seconds)
   * Default: 60 seconds
   *
   * For long-running jobs, this extends the lock TTL periodically
   * to prevent it from expiring while the job is still running.
   */
  heartbeatInterval?: number;
}

export class CronLock {
  private jobName: string;
  private lockKey: string;
  private lockDuration: number;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lockValue: string;
  private redis: Redis;

  constructor(options: CronLockOptions) {
    this.jobName = options.jobName;
    this.lockKey = `cron:lock:${options.jobName}`;
    this.lockDuration = options.lockDuration || 300; // 5 minutes default
    this.heartbeatInterval = options.heartbeatInterval || 60; // 1 minute default
    this.lockValue = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    this.redis = getRedisClient();
  }

  /**
   * Acquire the lock
   * Returns true if lock acquired, false if already locked by another instance
   */
  async acquire(): Promise<boolean> {
    try {
      // Try to set the lock with NX (only if not exists) and EX (expiration)
      const result = await this.redis.set(
        this.lockKey,
        this.lockValue,
        {
          nx: true, // Only set if key doesn't exist
          ex: this.lockDuration, // Expire after lockDuration seconds
        }
      );

      if (result === 'OK') {
        logInfo(`[cronLock] Lock acquired for job: ${this.jobName}`);

        // Start heartbeat to keep lock alive
        this.startHeartbeat();

        return true;
      } else {
        // Lock is held by another instance
        const ttl = await this.redis.ttl(this.lockKey);
        logWarn(
          `[cronLock] Lock already held for job: ${this.jobName} (TTL: ${ttl}s)`
        );
        return false;
      }
    } catch (error) {
      logError(`[cronLock] Error acquiring lock for ${this.jobName}:`, error);
      return false;
    }
  }

  /**
   * Release the lock
   * Only releases if this instance owns the lock (using lock value)
   */
  async release(): Promise<void> {
    try {
      // Stop heartbeat first
      this.stopHeartbeat();

      // Delete the lock only if we own it (atomic operation using Lua script)
      // This prevents accidentally releasing another instance's lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redis.eval(
        script,
        [this.lockKey],
        [this.lockValue]
      );

      if (result === 1) {
        logInfo(`[cronLock] Lock released for job: ${this.jobName}`);
      } else {
        logWarn(
          `[cronLock] Could not release lock for ${this.jobName} - may have expired or been taken over`
        );
      }
    } catch (error) {
      logError(`[cronLock] Error releasing lock for ${this.jobName}:`, error);
    }
  }

  /**
   * Start heartbeat to keep lock alive during long-running jobs
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(async () => {
      try {
        // Extend the lock TTL
        const current = await this.redis.get(this.lockKey);

        // Only extend if we still own the lock
        if (current === this.lockValue) {
          await this.redis.expire(this.lockKey, this.lockDuration);
          logInfo(`[cronLock] Heartbeat sent for job: ${this.jobName}`);
        } else {
          logWarn(
            `[cronLock] Lost lock ownership for ${this.jobName} - stopping heartbeat`
          );
          this.stopHeartbeat();
        }
      } catch (error) {
        logError(`[cronLock] Error sending heartbeat for ${this.jobName}:`, error);
      }
    }, this.heartbeatInterval * 1000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Check if lock is currently held
   */
  async isLocked(): Promise<boolean> {
    try {
      const value = await this.redis.get(this.lockKey);
      return value !== null;
    } catch (error) {
      logError(`[cronLock] Error checking lock status for ${this.jobName}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for the lock
   */
  async getTTL(): Promise<number> {
    try {
      const ttl = await this.redis.ttl(this.lockKey);
      return ttl;
    } catch (error) {
      logError(`[cronLock] Error getting TTL for ${this.jobName}:`, error);
      return -1;
    }
  }
}

/**
 * Higher-order function to wrap cron job handlers with locking
 *
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   return await withCronLock(
 *     {
 *       jobName: 'process-escalations',
 *       lockDuration: 600, // 10 minutes
 *     },
 *     async () => {
 *       // Your cron job logic here
 *       await processEscalations();
 *       return NextResponse.json({ success: true });
 *     }
 *   );
 * }
 * ```
 */
export async function withCronLock<T>(
  options: CronLockOptions,
  handler: () => Promise<T>
): Promise<T> {
  const lock = new CronLock(options);

  try {
    // Try to acquire lock
    const acquired = await lock.acquire();

    if (!acquired) {
      const ttl = await lock.getTTL();
      const message = `Job ${options.jobName} is already running (TTL: ${ttl}s). Skipping this execution.`;
      logInfo(`[cronLock] ${message}`);

      // Return early with a response indicating job is already running
      // Type assertion needed because we can't know the exact return type
      return {
        skipped: true,
        reason: 'already_running',
        message,
        ttl,
      } as T;
    }

    // Execute the job
    const result = await handler();

    // Release lock on success
    await lock.release();

    return result;
  } catch (error) {
    // Release lock on error
    await lock.release();

    logError(`[cronLock] Error executing job ${options.jobName}:`, error);
    throw error;
  }
}

/**
 * Force release a lock (use with caution!)
 * This should only be used for manual intervention when a lock is stuck
 */
export async function forceReleaseLock(jobName: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const lockKey = `cron:lock:${jobName}`;

    const result = await redis.del(lockKey);

    if (result === 1) {
      logInfo(`[cronLock] Force released lock for job: ${jobName}`);
    } else {
      logInfo(`[cronLock] No lock found to release for job: ${jobName}`);
    }
  } catch (error) {
    logError(`[cronLock] Error force releasing lock for ${jobName}:`, error);
    throw error;
  }
}

/**
 * Get status of all cron locks
 * Useful for monitoring and debugging
 */
export async function getCronLockStatus(): Promise<
  Array<{ jobName: string; isLocked: boolean; ttl: number }>
> {
  try {
    const redis = getRedisClient();

    // Get all keys matching cron:lock:*
    const keys = await redis.keys('cron:lock:*');

    const status = await Promise.all(
      keys.map(async (key) => {
        const jobName = key.replace('cron:lock:', '');
        const ttl = await redis.ttl(key);

        return {
          jobName,
          isLocked: ttl > 0,
          ttl,
        };
      })
    );

    return status;
  } catch (error) {
    logError('[cronLock] Error getting cron lock status:', error);
    return [];
  }
}
