import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

export const emailQueue = new Queue("email-notifications", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000, age: 7 * 24 * 60 * 60 }, // keep 7 days
    removeOnFail: { count: 500 },
  },
});
