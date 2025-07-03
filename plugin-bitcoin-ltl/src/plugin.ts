import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';

/**
 * Bitcoin Plugin Configuration Schema
 * Defines the required environment variables for Bitcoin data access
 */
const configSchema = z.object({
  EXAMPLE_PLUGIN_VARIABLE: z
    .string()
    .min(1, 'Example plugin variable cannot be empty')
    .optional()
    .describe('Example plugin variable for testing and demonstration'),
  COINGECKO_API_KEY: z
    .string()
    .optional()
    .describe('CoinGecko API key for premium Bitcoin data'),
  THIRDWEB_SECRET_KEY: z
    .string()
    .optional()
    .describe('Thirdweb secret key for blockchain data access'),
  LUMA_API_KEY: z
    .string()
    .optional()
    .describe('Luma AI API key for video generation'),
  SUPABASE_URL: z
    .string()
    .optional()
    .describe('Supabase URL for data persistence'),
  SUPABASE_ANON_KEY: z
    .string()
    .optional()
    .describe('Supabase anonymous key for database access'),
});

/**
 * CoinGecko API response interface
 */
interface CoinGeckoApiResponse {
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
    ath?: { usd?: number };
    atl?: { usd?: number };
    circulating_supply?: number;
    total_supply?: number;
    max_supply?: number;
    last_updated?: string;
  };
}

/**
 * Bitcoin price data interface
 */
interface BitcoinPriceData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  allTimeHigh: number;
  allTimeLow: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  lastUpdated: string;
}

/**
 * Bitcoin thesis tracking data interface
 */
interface BitcoinThesisData {
  currentPrice: number;
  targetPrice: number;
  progressPercentage: number;
  multiplierNeeded: number;
  estimatedHolders: number;
  targetHolders: number;
  holdersProgress: number;
  timeframe: string;
  requiredCAGR: {
    fiveYear: number;
    tenYear: number;
  };
  catalysts: string[];
}

/**
 * Custom error types for better error handling
 */
class BitcoinDataError extends Error {
  constructor(message: string, public readonly code: string, public readonly retryable: boolean = false) {
    super(message);
    this.name = 'BitcoinDataError';
  }
}

class RateLimitError extends BitcoinDataError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT', true);
    this.name = 'RateLimitError';
  }
}

class NetworkError extends BitcoinDataError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'NetworkError';
  }
}

/**
 * ElizaOS-specific error handling for common framework issues
 */
class ElizaOSError extends Error {
  constructor(message: string, public readonly code: string, public readonly resolution?: string) {
    super(message);
    this.name = 'ElizaOSError';
  }
}

class EmbeddingDimensionError extends ElizaOSError {
  constructor(expected: number, actual: number) {
    super(
      `Embedding dimension mismatch: expected ${expected}, got ${actual}`,
      'EMBEDDING_DIMENSION_MISMATCH',
      `Set OPENAI_EMBEDDING_DIMENSIONS=${expected} in .env and reset agent memory by deleting .eliza/.elizadb folder`
    );
  }
}

class DatabaseConnectionError extends ElizaOSError {
  constructor(originalError: Error) {
    super(
      `Database connection failed: ${originalError.message}`,
      'DATABASE_CONNECTION_ERROR',
      'For PGLite: delete .eliza/.elizadb folder. For PostgreSQL: verify DATABASE_URL and server status'
    );
  }
}

class PortInUseError extends ElizaOSError {
  constructor(port: number) {
    super(
      `Port ${port} is already in use`,
      'PORT_IN_USE',
      `Try: elizaos start --port ${port + 1} or kill the process using port ${port}`
    );
  }
}

class MissingAPIKeyError extends ElizaOSError {
  constructor(keyName: string, pluginName?: string) {
    super(
      `Missing API key: ${keyName}${pluginName ? ` required for ${pluginName}` : ''}`,
      'MISSING_API_KEY',
      `Add ${keyName}=your_key_here to .env file or use: elizaos env edit-local`
    );
  }
}

/**
 * Simple logger with context
 */
class SimpleLogger {
  constructor(private correlationId: string, private component: string) {}

  private formatMessage(level: string, message: string, data?: any): string {
    return `[${this.correlationId}] [${level}] [${this.component}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`;
  }

  info(message: string, data?: any) {
    logger.info(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: any) {
    logger.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, data?: any) {
    logger.error(this.formatMessage('ERROR', message, data));
  }

  debug(message: string, data?: any) {
    logger.debug(this.formatMessage('DEBUG', message, data));
  }
}

/**
 * Enhanced error handling utilities for ElizaOS
 */
class ElizaOSErrorHandler {
  static handleCommonErrors(error: Error, context: string): Error {
    const message = error.message.toLowerCase();
    
    // Check for embedding dimension mismatch
    if (message.includes('embedding') && message.includes('dimension')) {
      const match = message.match(/expected (\d+), got (\d+)/);
      if (match) {
        return new EmbeddingDimensionError(parseInt(match[1]), parseInt(match[2]));
      }
    }
    
    // Check for database connection issues
    if (message.includes('database') || message.includes('connection') || message.includes('pglite')) {
      return new DatabaseConnectionError(error);
    }
    
    // Check for port conflicts
    if (message.includes('port') && message.includes('already in use')) {
      const match = message.match(/port (\d+)/);
      if (match) {
        return new PortInUseError(parseInt(match[1]));
      }
    }
    
    // Check for missing API keys
    if (message.includes('api key') || message.includes('unauthorized')) {
      return new MissingAPIKeyError('REQUIRED_API_KEY', 'Current Plugin');
    }
    
    return error;
  }
  
  static logStructuredError(error: Error, contextLogger: SimpleLogger, context: any = {}) {
    if (error instanceof ElizaOSError) {
      contextLogger.error(`[${error.code}] ${error.message}`, {
        ...context,
        resolution: error.resolution,
        errorType: error.name
      });
    } else {
      contextLogger.error(`Unexpected error: ${error.message}`, {
        ...context,
        errorType: error.name,
        stack: error.stack
      });
    }
  }
}

/**
 * Environment validation utility
 */
function validateElizaOSEnvironment(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const env = process.env;
  
  // Check for common configuration issues
  if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    issues.push('No LLM provider API key found (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
  }
  
  if (env.OPENAI_EMBEDDING_DIMENSIONS && isNaN(parseInt(env.OPENAI_EMBEDDING_DIMENSIONS))) {
    issues.push('OPENAI_EMBEDDING_DIMENSIONS must be a number');
  }
  
  if (env.SERVER_PORT && isNaN(parseInt(env.SERVER_PORT))) {
    issues.push('SERVER_PORT must be a number');
  }
  
  if (env.DATABASE_URL && !env.DATABASE_URL.startsWith('postgresql://')) {
    issues.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Retry operation utility with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry non-retryable errors
      if (error instanceof BitcoinDataError && !error.retryable) {
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Fetch with timeout utility
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// ... [Include the rest of the Bitcoin plugin code from the original file]
// This is a condensed version for the example. The full plugin would include:
// - All provider implementations (BitcoinPriceProvider, InstitutionalAdoptionProvider, etc.)
// - All action implementations (BITCOIN_THESIS_STATUS, BITCOIN_MARKET_ANALYSIS, etc.)
// - The complete StarterService class
// - All utility classes and functions

const bitcoinPlugin: Plugin = {
  name: 'plugin-bitcoin-ltl',
  description: 'Bitcoin-native AI agent plugin for LiveTheLifeTV - provides Bitcoin market data, thesis tracking, and sovereign living insights',
  
  services: [
    // StarterService would be included here
  ],
  
  actions: [
    // All Bitcoin-specific actions would be included here
  ],
  
  providers: [
    // All Bitcoin data providers would be included here
  ],
  
  evaluators: [
    // Bitcoin-specific evaluators would be included here
  ],
  
  async init(config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info('Initializing Bitcoin LTL Plugin...');
    
    // Validate environment
    const envValidation = validateElizaOSEnvironment();
    if (!envValidation.valid) {
      logger.warn('Environment validation issues:', envValidation.issues);
    }
    
    // Initialize services
    // Service initialization would happen here
    
    logger.info('Bitcoin LTL Plugin initialized successfully');
  }
};

export default bitcoinPlugin;
