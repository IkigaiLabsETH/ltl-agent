import { z } from "zod";

/**
 * Bitcoin Plugin Configuration Schema
 * Defines the required environment variables for Bitcoin data access
 */
export const configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z
    .string()
    .min(1, "Example plugin variable cannot be empty")
    .optional()
    .describe("Example plugin variable for testing and demonstration"),
  COINGECKO_API_KEY: z
    .string()
    .optional()
    .describe("CoinGecko API key for premium Bitcoin data"),
  THIRDWEB_SECRET_KEY: z
    .string()
    .optional()
    .describe("Thirdweb secret key for blockchain data access"),
  LUMA_API_KEY: z
    .string()
    .optional()
    .describe("Luma AI API key for video generation"),
  SUPABASE_URL: z
    .string()
    .optional()
    .describe("Supabase URL for data persistence"),
  SUPABASE_ANON_KEY: z
    .string()
    .optional()
    .describe("Supabase anonymous key for database access"),
  "cache-service": z.object({
    defaultTtl: z.number().default(300000),
    maxSize: z.number().default(1000),
    cleanupInterval: z.number().default(600000),
    enableRedis: z.boolean().default(false),
    redisUrl: z.string().optional(),
    redisPassword: z.string().optional(),
    redisDb: z.number().optional(),
    compressionEnabled: z.boolean().default(true),
    compressionThreshold: z.number().default(1024),
  }).optional().describe("CacheService configuration object (Redis optional)"),
});
