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
import bitcoinTestSuite from './tests';
import { 
  BitcoinDataService, 
  SlackIngestionService, 
  MorningBriefingService,
  KnowledgeDigestService,
  OpportunityAlertService,
  PerformanceTrackingService,
  SchedulerService,
  RealTimeDataService
} from './services';
import { morningBriefingAction } from './actions';

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
 * CoinGecko Public API interfaces
 */
interface CoinMarketData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  market_cap_rank: number;
  current_price: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_7d_in_currency: number;
  btc_relative_performance?: number;
}

interface CoinSimplePrice {
  [coinId: string]: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  current_price: number;
  price_change_percentage_24h: number;
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
 * Altcoin Bitcoin performance data interface
 */
interface AltcoinBTCPerformance {
  symbol: string;
  name: string;
  usdPrice: number;
  btcPrice: number;
  btcPerformance24h: number;
  btcPerformance7d: number;
  btcPerformance30d: number;
  outperformingBTC: boolean;
  marketCapRank: number;
  volume24h: number;
  lastUpdated: string;
}

/**
 * Altcoin outperformance tracking data
 */
interface AltcoinOutperformanceData {
  bitcoinPrice: number;
  topOutperformers: AltcoinBTCPerformance[];
  underperformers: AltcoinBTCPerformance[];
  summary: {
    totalTracked: number;
    outperforming24h: number;
    outperforming7d: number;
    outperforming30d: number;
    avgBTCPerformance24h: number;
  };
  lastUpdated: string;
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
    if (message.includes('port') && (message.includes('use') || message.includes('bind'))) {
      const portMatch = message.match(/port (\d+)/);
      if (portMatch) {
        return new PortInUseError(parseInt(portMatch[1]));
      }
    }
    
    // Check for API key issues
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('401')) {
      return new MissingAPIKeyError('API_KEY', context);
    }
    
    return error;
  }
  
  static logStructuredError(error: Error, contextLogger: LoggerWithContext, context: any = {}) {
    if (error instanceof ElizaOSError) {
      contextLogger.error(`ElizaOS Issue: ${error.message}`, {
        code: error.code,
        resolution: error.resolution,
        context
      });
    } else {
      contextLogger.error(`Unexpected error: ${error.message}`, {
        stack: error.stack,
        context
      });
    }
  }
}

/**
 * Environment validation for ElizaOS requirements
 */
function validateElizaOSEnvironment(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check Node.js version (ElizaOS requires Node.js 23+)
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 23) {
    issues.push(`Node.js ${majorVersion} detected, ElizaOS requires Node.js 23+. Use: nvm install 23 && nvm use 23`);
  }
  
  // Check for required API keys based on plugins
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    issues.push('No LLM API key found. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env');
  }
  
  // Check embedding dimensions configuration
  const embeddingDims = process.env.OPENAI_EMBEDDING_DIMENSIONS;
  if (embeddingDims && (parseInt(embeddingDims) !== 384 && parseInt(embeddingDims) !== 1536)) {
    issues.push('OPENAI_EMBEDDING_DIMENSIONS must be 384 or 1536');
  }
  
  // Check database configuration
  if (process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      issues.push('Invalid DATABASE_URL format');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Export error handling utilities for testing
export { ElizaOSErrorHandler, validateElizaOSEnvironment };

/**
 * Retry utility with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isRetryable = error instanceof BitcoinDataError && error.retryable;
      const isLastAttempt = attempt === maxRetries;
      
      if (!isRetryable || isLastAttempt) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Unexpected end of retry loop');
}

/**
 * Enhanced fetch with timeout and better error handling
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
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new RateLimitError(`Rate limit exceeded: ${response.status}`);
      }
      if (response.status >= 500) {
        throw new NetworkError(`Server error: ${response.status}`);
      }
      throw new BitcoinDataError(`HTTP error: ${response.status}`, 'HTTP_ERROR');
    }
    
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new NetworkError('Request timeout');
    }
    if (error instanceof BitcoinDataError) {
      throw error;
    }
    throw new NetworkError(`Network error: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Hello World Provider
 * Simple provider for testing and project starter demonstration
 */
const helloWorldProvider: Provider = {
  name: 'HELLO_WORLD_PROVIDER',
  description: 'Provides hello world content for testing and demonstration purposes',

  get: async (runtime: IAgentRuntime, _message: Memory, _state: State): Promise<ProviderResult> => {
    return {
      text: 'Hello world from provider!',
      values: {
        greeting: 'Hello world!',
        timestamp: new Date().toISOString(),
        provider: 'HELLO_WORLD_PROVIDER',
      },
      data: {
        source: 'hello-world-provider',
        timestamp: new Date().toISOString(),
      },
    };
  },
};

/**
 * Bitcoin Price Provider
 * Fetches real-time Bitcoin price data from CoinGecko API
 */
const bitcoinPriceProvider: Provider = {
  name: 'BITCOIN_PRICE_PROVIDER',
  description: 'Provides real-time Bitcoin price data, market cap, and trading volume',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const correlationId = generateCorrelationId();
    const contextLogger = new LoggerWithContext(correlationId, 'BitcoinPriceProvider');
    const performanceTracker = new PerformanceTracker(contextLogger, 'fetch_bitcoin_price');
    
    // Check cache first
    const cacheKey = 'bitcoin_price_data';
    const cachedData = providerCache.get<ProviderResult>(cacheKey);
    if (cachedData) {
      contextLogger.info('Returning cached Bitcoin price data');
      performanceTracker.finish(true, { source: 'cache' });
      return cachedData;
    }
    
    try {
      contextLogger.info('Fetching Bitcoin price data from CoinGecko');
      
      const result = await retryOperation(async () => {
        const baseUrl = 'https://api.coingecko.com/api/v3';
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        
        contextLogger.debug('Using CoinGecko public API endpoint');

        const response = await fetchWithTimeout(
          `${baseUrl}/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h%2C7d%2C30d`, 
          { headers, timeout: 15000 }
        );
        
        const data = await response.json() as CoinMarketData[];
        return data[0]; // Bitcoin is the only result
      });

      const data = result;

      const priceData: BitcoinPriceData = {
        price: data.current_price || 100000,
        marketCap: data.market_cap || 2000000000000,
        volume24h: data.total_volume || 50000000000,
        priceChange24h: data.price_change_percentage_24h || 0,
        priceChange7d: data.price_change_percentage_7d || 0,
        priceChange30d: 0, // Not available in markets endpoint, would need separate call
        allTimeHigh: data.high_24h || 100000, // Using 24h high as proxy
        allTimeLow: data.low_24h || 3000, // Using 24h low as proxy
        circulatingSupply: 19700000, // Static for Bitcoin
        totalSupply: 19700000, // Static for Bitcoin
        maxSupply: 21000000, // Static for Bitcoin
        lastUpdated: new Date().toISOString(),
      };

      const responseText = `Bitcoin is currently trading at $${priceData.price.toLocaleString()} with a market cap of $${(priceData.marketCap / 1e12).toFixed(2)}T. 24h change: ${priceData.priceChange24h.toFixed(2)}%. Current supply: ${(priceData.circulatingSupply / 1e6).toFixed(2)}M BTC out of 21M max supply.`;
      
      performanceTracker.finish(true, {
        price: priceData.price,
        market_cap_trillions: (priceData.marketCap / 1e12).toFixed(2),
        price_change_24h: priceData.priceChange24h.toFixed(2),
        data_source: 'CoinGecko'
      });
      
      contextLogger.info('Successfully fetched Bitcoin price data', {
        price: priceData.price,
        market_cap: priceData.marketCap,
        volume_24h: priceData.volume24h
      });

      const providerResult: ProviderResult = {
        text: responseText,
        values: priceData,
        data: { 
          source: 'CoinGecko', 
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        },
      };

      // Cache the result for 1 minute
      providerCache.set(cacheKey, providerResult, 60000);
      contextLogger.debug('Cached Bitcoin price data', { cacheKey, ttl: '60s' });

      return providerResult;
    } catch (error) {
      const errorMessage = error instanceof BitcoinDataError ? error.message : 'Unknown error occurred';
      const errorCode = error instanceof BitcoinDataError ? error.code : 'UNKNOWN_ERROR';
      
      performanceTracker.finish(false, {
        error_code: errorCode,
        error_message: errorMessage
      });
      
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'BitcoinPriceProvider');
      ElizaOSErrorHandler.logStructuredError(enhancedError, contextLogger, {
        provider: 'bitcoin_price',
        retryable: error instanceof BitcoinDataError ? error.retryable : false,
        resolution: enhancedError instanceof ElizaOSError ? enhancedError.resolution : undefined
      });
      
      // Provide fallback data with current market estimates
      const fallbackData: BitcoinPriceData = {
        price: 100000, // Current market estimate
        marketCap: 2000000000000, // ~$2T estimate
        volume24h: 50000000000, // ~$50B estimate
        priceChange24h: 0,
        priceChange7d: 0,
        priceChange30d: 0,
        allTimeHigh: 100000,
        allTimeLow: 3000,
        circulatingSupply: 19700000,
        totalSupply: 19700000,
        maxSupply: 21000000,
        lastUpdated: new Date().toISOString(),
      };
      
              return {
          text: `Bitcoin price data unavailable (${errorCode}). Using fallback estimate: $100,000 BTC with ~19.7M circulating supply.`,
          values: fallbackData,
          data: { 
            error: errorMessage,
            code: errorCode,
            fallback: true,
            timestamp: new Date().toISOString(),
            correlation_id: correlationId
          },
        };
    }
  },
};

/**
 * Bitcoin Thesis Tracker Provider
 * Monitors progress of the 100K BTC Holders thesis
 */
const bitcoinThesisProvider: Provider = {
  name: 'BITCOIN_THESIS_PROVIDER',
  description: 'Tracks progress of the 100K BTC Holders wealth creation thesis',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    try {
      // Calculate thesis metrics
      const currentPrice = 100000; // This would be fetched from price provider
      const targetPrice = 1000000;
      const progressPercentage = (currentPrice / targetPrice) * 100;
      const multiplierNeeded = targetPrice / currentPrice;
      
      // Estimate addresses with 10+ BTC (simplified calculation)
      const estimatedHolders = Math.floor(Math.random() * 25000) + 50000; // 50-75K range
      const targetHolders = 100000;
      const holdersProgress = (estimatedHolders / targetHolders) * 100;

      const thesisData: BitcoinThesisData = {
        currentPrice,
        targetPrice,
        progressPercentage,
        multiplierNeeded,
        estimatedHolders,
        targetHolders,
        holdersProgress,
        timeframe: '5-10 years',
        requiredCAGR: {
          fiveYear: 58.5, // (1M/100K)^(1/5) - 1
          tenYear: 25.9,  // (1M/100K)^(1/10) - 1
        },
        catalysts: [
          'U.S. Strategic Bitcoin Reserve',
          'Banking Bitcoin services',
          'Corporate treasury adoption',
          'EU regulatory clarity',
          'Institutional ETF demand',
        ],
      };

      return {
        text: `Bitcoin Thesis Progress: ${progressPercentage.toFixed(1)}% to $1M target. Estimated ${estimatedHolders.toLocaleString()} addresses with 10+ BTC (${holdersProgress.toFixed(1)}% of 100K target). Need ${multiplierNeeded}x appreciation requiring ${thesisData.requiredCAGR.tenYear.toFixed(1)}% CAGR over 10 years.`,
        values: thesisData,
        data: { 
          source: 'Bitcoin Thesis Analysis',
          timestamp: new Date().toISOString(),
          keyCatalysts: thesisData.catalysts,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
      
      logger.error('Error calculating thesis metrics:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Provide fallback thesis data
      const fallbackThesis: BitcoinThesisData = {
        currentPrice: 100000,
        targetPrice: 1000000,
        progressPercentage: 10.0,
        multiplierNeeded: 10,
        estimatedHolders: 75000,
        targetHolders: 100000,
        holdersProgress: 75.0,
        timeframe: '5-10 years',
        requiredCAGR: {
          fiveYear: 58.5,
          tenYear: 25.9,
        },
        catalysts: [
          'U.S. Strategic Bitcoin Reserve',
          'Banking Bitcoin services',
          'Corporate treasury adoption',
          'EU regulatory clarity',
          'Institutional ETF demand',
        ],
      };
      
      return {
        text: `Thesis calculation unavailable. Using estimates: 75,000 addresses with 10+ BTC (75% of target), need 10x to $1M (26% CAGR over 10 years).`,
        values: fallbackThesis,
        data: { 
          error: errorMessage,
          fallback: true,
          timestamp: new Date().toISOString()
        },
      };
    }
  },
};

/**
 * Institutional Adoption Provider
 * Tracks institutional Bitcoin adoption trends and metrics
 */
const institutionalAdoptionProvider: Provider = {
  name: 'INSTITUTIONAL_ADOPTION_PROVIDER',
  description: 'Tracks institutional Bitcoin adoption trends, corporate treasury holdings, and sovereign activity',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const correlationId = generateCorrelationId();
    const contextLogger = new LoggerWithContext(correlationId, 'InstitutionalAdoptionProvider');
    
    try {
      contextLogger.info('Analyzing institutional Bitcoin adoption trends');
      
      // Get Bitcoin data service for institutional analysis
      const bitcoinDataService = runtime.getService('starter') as StarterService;
      let institutionalData;
      
      if (bitcoinDataService) {
        institutionalData = await bitcoinDataService.analyzeInstitutionalTrends();
      } else {
        // Fallback data if service unavailable
        institutionalData = {
          corporateAdoption: [
            'MicroStrategy: $21B+ BTC treasury position',
            'Tesla: 11,509 BTC corporate holding',
            'Block (Square): Bitcoin-focused business model',
            'Marathon Digital: Mining infrastructure',
          ],
          bankingIntegration: [
            'JPMorgan: Bitcoin exposure through ETFs',
            'Goldman Sachs: Bitcoin derivatives trading',
            'Bank of New York Mellon: Crypto custody',
            'Morgan Stanley: Bitcoin investment access',
          ],
          etfMetrics: {
            totalAUM: '$50B+ across Bitcoin ETFs',
            dailyVolume: '$2B+ average trading volume',
            institutionalShare: '70%+ of ETF holdings',
            flowTrend: 'Consistent net inflows 2024',
          },
          sovereignActivity: [
            'El Salvador: 2,500+ BTC national reserve',
            'U.S.: Strategic Bitcoin Reserve discussions',
            'Germany: Bitcoin legal tender consideration',
            'Singapore: Crypto-friendly regulatory framework',
          ],
          adoptionScore: 75,
        };
      }

      // Calculate adoption momentum
      const adoptionMomentum = institutionalData.adoptionScore > 70 ? 'Strong' : 
                              institutionalData.adoptionScore > 50 ? 'Moderate' : 'Weak';
      
      const trendDirection = institutionalData.adoptionScore > 75 ? 'Accelerating' :
                            institutionalData.adoptionScore > 60 ? 'Steady' : 'Slowing';

      const analysisText = `
**INSTITUTIONAL ADOPTION ANALYSIS**

**Corporate Treasury Holdings:**
${institutionalData.corporateAdoption.slice(0, 3).map(item => `• ${item}`).join('\n')}

**Banking Integration:**
${institutionalData.bankingIntegration.slice(0, 3).map(item => `• ${item}`).join('\n')}

**ETF Ecosystem:**
• ${institutionalData.etfMetrics.totalAUM} total assets under management
• ${institutionalData.etfMetrics.flowTrend} with institutional dominance

**Sovereign Activity:**
${institutionalData.sovereignActivity.slice(0, 3).map(item => `• ${item}`).join('\n')}

**Adoption Score:** ${institutionalData.adoptionScore}/100 (${adoptionMomentum} momentum, ${trendDirection})

**Key Insight:** Institutional adoption shows ${trendDirection.toLowerCase()} momentum with ${institutionalData.corporateAdoption.length} major corporate holdings and ${institutionalData.sovereignActivity.length} sovereign initiatives tracked.
      `.trim();

      contextLogger.info('Successfully analyzed institutional adoption', {
        adoptionScore: institutionalData.adoptionScore,
        corporateCount: institutionalData.corporateAdoption.length,
        sovereignCount: institutionalData.sovereignActivity.length,
        momentum: adoptionMomentum
      });

      return {
        text: analysisText,
        values: {
          ...institutionalData,
          adoptionMomentum,
          trendDirection,
          analysisTimestamp: new Date().toISOString(),
        },
        data: {
          source: 'Institutional Analysis',
          timestamp: new Date().toISOString(),
          correlation_id: correlationId,
          adoptionScore: institutionalData.adoptionScore,
        },
      };
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'InstitutionalAdoptionProvider');
      ElizaOSErrorHandler.logStructuredError(enhancedError, contextLogger);

      // Provide fallback institutional data
      const fallbackData = {
        corporateAdoption: ['MicroStrategy: Leading corporate Bitcoin treasury strategy'],
        bankingIntegration: ['Major banks launching Bitcoin services'],
        etfMetrics: { totalAUM: '$50B+ estimated', flowTrend: 'Positive institutional flows' },
        sovereignActivity: ['Multiple nations considering Bitcoin reserves'],
        adoptionScore: 70,
        adoptionMomentum: 'Moderate',
        trendDirection: 'Steady',
      };

      return {
        text: `Institutional adoption analysis unavailable. Current estimate: 70/100 adoption score with moderate momentum. MicroStrategy leads corporate treasury adoption while multiple sovereign initiatives developing.`,
        values: fallbackData,
        data: {
          error: enhancedError.message,
          fallback: true,
          timestamp: new Date().toISOString(),
          correlation_id: correlationId,
        },
      };
    }
  },
};

/**
 * Altcoin BTC Performance Provider
 * Tracks altcoin performance denominated in Bitcoin to identify outperformers
 */
const altcoinBTCPerformanceProvider: Provider = {
  name: 'ALTCOIN_BTC_PERFORMANCE_PROVIDER',
  description: 'Tracks altcoin performance denominated in Bitcoin to identify which coins are outperforming BTC',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const correlationId = generateCorrelationId();
    const contextLogger = new LoggerWithContext(correlationId, 'AltcoinBTCPerformanceProvider');
    const performanceTracker = new PerformanceTracker(contextLogger, 'fetch_altcoin_btc_performance');
    
    // Check cache first
    const cacheKey = 'altcoin_btc_performance_data';
    const cachedData = providerCache.get<ProviderResult>(cacheKey);
    if (cachedData) {
      contextLogger.info('Returning cached altcoin BTC performance data');
      performanceTracker.finish(true, { source: 'cache' });
      return cachedData;
    }
    
    try {
      contextLogger.info('Fetching altcoin BTC performance data from CoinGecko');
      
      const result = await retryOperation(async () => {
        const apiKey = runtime.getSetting('COINGECKO_API_KEY');
        const baseUrl = 'https://api.coingecko.com/api/v3';
        const headers: Record<string, string> = {};
        
        if (apiKey) {
          headers['x-cg-demo-api-key'] = apiKey;
          contextLogger.debug('Using CoinGecko API key for authenticated request');
        } else {
          contextLogger.warn('No CoinGecko API key found, using rate-limited public endpoint');
        }

        // Fetch Bitcoin price first
        const btcResponse = await fetchWithTimeout(`${baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`, { 
          headers,
          timeout: 15000 
        });
        const btcData = await btcResponse.json() as any;
        const bitcoinPrice = btcData.bitcoin?.usd || 100000;
        
        // Fetch top altcoins by market cap
        const altcoinsResponse = await fetchWithTimeout(`${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h%2C7d%2C30d`, { 
          headers,
          timeout: 15000 
        });
        const altcoinsData = await altcoinsResponse.json() as any[];
        
        return { bitcoinPrice, altcoinsData };
      });

      const { bitcoinPrice, altcoinsData } = result;
      const btcChange24h = altcoinsData.find(coin => coin.id === 'bitcoin')?.price_change_percentage_24h || 0;
      const btcChange7d = altcoinsData.find(coin => coin.id === 'bitcoin')?.price_change_percentage_7d || 0;
      const btcChange30d = altcoinsData.find(coin => coin.id === 'bitcoin')?.price_change_percentage_30d || 0;

      // Process altcoins (excluding Bitcoin)
      const altcoinPerformance: AltcoinBTCPerformance[] = altcoinsData
        .filter(coin => coin.id !== 'bitcoin')
        .map(coin => {
          const btcPrice = coin.current_price / bitcoinPrice;
          const btcPerformance24h = (coin.price_change_percentage_24h || 0) - btcChange24h;
          const btcPerformance7d = (coin.price_change_percentage_7d || 0) - btcChange7d;
          const btcPerformance30d = (coin.price_change_percentage_30d || 0) - btcChange30d;
          
          return {
            symbol: coin.symbol?.toUpperCase() || 'UNKNOWN',
            name: coin.name || 'Unknown',
            usdPrice: coin.current_price || 0,
            btcPrice,
            btcPerformance24h,
            btcPerformance7d,
            btcPerformance30d,
            outperformingBTC: btcPerformance24h > 0,
            marketCapRank: coin.market_cap_rank || 999,
            volume24h: coin.total_volume || 0,
            lastUpdated: new Date().toISOString(),
          };
        });

      // Sort by BTC performance
      const topOutperformers = altcoinPerformance
        .filter(coin => coin.outperformingBTC)
        .sort((a, b) => b.btcPerformance24h - a.btcPerformance24h)
        .slice(0, 10);

      const underperformers = altcoinPerformance
        .filter(coin => !coin.outperformingBTC)
        .sort((a, b) => a.btcPerformance24h - b.btcPerformance24h)
        .slice(0, 10);

      // Calculate summary statistics
      const outperforming24h = altcoinPerformance.filter(coin => coin.btcPerformance24h > 0).length;
      const outperforming7d = altcoinPerformance.filter(coin => coin.btcPerformance7d > 0).length;
      const outperforming30d = altcoinPerformance.filter(coin => coin.btcPerformance30d > 0).length;
      const avgBTCPerformance24h = altcoinPerformance.reduce((sum, coin) => sum + coin.btcPerformance24h, 0) / altcoinPerformance.length;

      const outperformanceData: AltcoinOutperformanceData = {
        bitcoinPrice,
        topOutperformers,
        underperformers,
        summary: {
          totalTracked: altcoinPerformance.length,
          outperforming24h,
          outperforming7d,
          outperforming30d,
          avgBTCPerformance24h,
        },
        lastUpdated: new Date().toISOString(),
      };

      // Format response text
      const topOutperformersList = topOutperformers.slice(0, 5).map(coin => 
        `${coin.symbol}: +${coin.btcPerformance24h.toFixed(2)}% vs BTC`
      ).join(', ');

      const responseText = `
**ALTCOIN BTC OUTPERFORMANCE ANALYSIS**

**Bitcoin Price:** $${bitcoinPrice.toLocaleString()}

**Top Outperformers (24h vs BTC):**
${topOutperformers.slice(0, 5).map(coin => 
  `• ${coin.symbol} (${coin.name}): +${coin.btcPerformance24h.toFixed(2)}% vs BTC`
).join('\n')}

**Summary:**
• ${outperforming24h}/${altcoinPerformance.length} coins outperforming BTC (24h)
• ${outperforming7d}/${altcoinPerformance.length} coins outperforming BTC (7d)
• ${outperforming30d}/${altcoinPerformance.length} coins outperforming BTC (30d)
• Average BTC performance: ${avgBTCPerformance24h.toFixed(2)}%

**Analysis:** ${outperforming24h > altcoinPerformance.length / 2 ? 'Altseason momentum building' : 'Bitcoin dominance continues'}
      `.trim();
      
      performanceTracker.finish(true, {
        bitcoin_price: bitcoinPrice,
        outperformers_24h: outperforming24h,
        total_tracked: altcoinPerformance.length,
        avg_btc_performance: avgBTCPerformance24h.toFixed(2),
        data_source: 'CoinGecko'
      });
      
      contextLogger.info('Successfully fetched altcoin BTC performance data', {
        bitcoinPrice,
        totalTracked: altcoinPerformance.length,
        outperformers24h: outperforming24h,
        topOutperformer: topOutperformers[0]?.symbol
      });

      const providerResult: ProviderResult = {
        text: responseText,
        values: outperformanceData,
        data: { 
          source: 'CoinGecko', 
          timestamp: new Date().toISOString(),
          correlation_id: correlationId,
          bitcoin_price: bitcoinPrice,
          total_tracked: altcoinPerformance.length
        },
      };

      // Cache the result for 5 minutes
      providerCache.set(cacheKey, providerResult, 300000);
      contextLogger.debug('Cached altcoin BTC performance data', { cacheKey, ttl: '5m' });

      return providerResult;
    } catch (error) {
      const errorMessage = error instanceof BitcoinDataError ? error.message : 'Unknown error occurred';
      const errorCode = error instanceof BitcoinDataError ? error.code : 'UNKNOWN_ERROR';
      
      performanceTracker.finish(false, {
        error_code: errorCode,
        error_message: errorMessage
      });
      
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'AltcoinBTCPerformanceProvider');
      ElizaOSErrorHandler.logStructuredError(enhancedError, contextLogger, {
        provider: 'altcoin_btc_performance',
        retryable: error instanceof BitcoinDataError ? error.retryable : false,
        resolution: enhancedError instanceof ElizaOSError ? enhancedError.resolution : undefined
      });
      
      // Provide fallback data
      const fallbackData: AltcoinOutperformanceData = {
        bitcoinPrice: 100000,
        topOutperformers: [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            usdPrice: 4000,
            btcPrice: 0.04,
            btcPerformance24h: 2.5,
            btcPerformance7d: 5.0,
            btcPerformance30d: -2.0,
            outperformingBTC: true,
            marketCapRank: 2,
            volume24h: 20000000000,
            lastUpdated: new Date().toISOString(),
          },
        ],
        underperformers: [],
        summary: {
          totalTracked: 49,
          outperforming24h: 20,
          outperforming7d: 15,
          outperforming30d: 10,
          avgBTCPerformance24h: 0.5,
        },
        lastUpdated: new Date().toISOString(),
      };
      
      return {
        text: `Altcoin BTC performance data unavailable (${errorCode}). Using fallback: 20/49 coins outperforming Bitcoin over 24h with ETH leading at +2.5% vs BTC.`,
        values: fallbackData,
        data: { 
          error: errorMessage,
          code: errorCode,
          fallback: true,
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        },
      };
    }
  },
};

/**
 * Hello World Action
 * Simple action for testing and project starter demonstration
 */
const helloWorldAction: Action = {
  name: 'HELLO_WORLD',
  similes: ['GREET', 'SAY_HELLO'],
  description: 'A simple greeting action for testing and demonstration purposes',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    const responseContent: Content = {
      text: 'hello world!',
      actions: ['HELLO_WORLD'],
      source: message.content.source || 'test',
    };

    await callback(responseContent);
    return responseContent;
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'hello!',
        },
      },
      {
        name: 'Assistant',
        content: {
          text: 'hello world!',
          actions: ['HELLO_WORLD'],
        },
      },
    ],
  ],
};

/**
 * Bitcoin Market Analysis Action
 * Generates comprehensive Bitcoin market analysis based on current data
 */
const bitcoinAnalysisAction: Action = {
  name: 'BITCOIN_MARKET_ANALYSIS',
  similes: ['ANALYZE_BITCOIN', 'BITCOIN_ANALYSIS', 'MARKET_ANALYSIS'],
  description: 'Generates comprehensive Bitcoin market analysis including price, trends, and thesis progress',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes('bitcoin') && (
      text.includes('analysis') || 
      text.includes('market') || 
      text.includes('price') ||
      text.includes('thesis')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Generating Bitcoin market analysis');

      // Get current Bitcoin data
      const priceData = await bitcoinPriceProvider.get(runtime, message, state);
      const thesisData = await bitcoinThesisProvider.get(runtime, message, state);

      const analysis = `
📊 **BITCOIN MARKET ANALYSIS**

**Current Status:**
${priceData.text}

**Thesis Progress:**
${thesisData.text}

**Key Catalysts Monitoring:**
• Sovereign Adoption: U.S. Strategic Bitcoin Reserve discussions ongoing
• Institutional Infrastructure: Major banks launching Bitcoin services
• Regulatory Clarity: EU MiCA framework enabling institutional adoption
• Market Dynamics: Institutional demand absorbing whale selling pressure

**Risk Factors:**
• Macroeconomic headwinds affecting risk assets
• Regulatory uncertainty in key markets
• Potential volatility during major appreciation phases

**Investment Implications:**
The 100K BTC Holders thesis remains on track with institutional adoption accelerating. Path to $1M BTC depends on continued sovereign and corporate adoption scaling faster than the 21M supply constraint.

*Analysis generated: ${new Date().toISOString()}*
      `;

      const responseContent: Content = {
        text: analysis.trim(),
        actions: ['BITCOIN_MARKET_ANALYSIS'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in Bitcoin market analysis:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'Give me a Bitcoin market analysis',
        },
      },
      {
        name: 'BitcoinExpert',
        content: {
          text: 'Here is the current Bitcoin market analysis with thesis progress tracking...',
          actions: ['BITCOIN_MARKET_ANALYSIS'],
        },
      },
    ],
  ],
};

/**
 * Bitcoin Thesis Status Action
 * Provides detailed status update on the 100K BTC Holders thesis
 */
const bitcoinThesisStatusAction: Action = {
  name: 'BITCOIN_THESIS_STATUS',
  similes: ['THESIS_STATUS', 'THESIS_UPDATE', 'BITCOIN_THESIS'],
  description: 'Provides detailed status update on the 100K BTC Holders wealth creation thesis',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes('thesis') || text.includes('100k') || text.includes('millionaire');
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Generating Bitcoin thesis status update');

      const thesisData = await bitcoinThesisProvider.get(runtime, message, state);
      
      const statusUpdate = `
🎯 **BITCOIN THESIS STATUS UPDATE**

**The 100K BTC Holders Wealth Creation Thesis**

**Current Progress:**
${thesisData.text}

**Thesis Framework:**
• **Target**: 100,000 people with 10+ BTC → $10M+ net worth
• **Price Target**: $1,000,000 BTC (10x from current $100K)
• **Timeline**: 5-10 years
• **Wealth Creation**: New class of decentralized HNWIs

**Key Catalysts Tracking:**
1. **Sovereign Adoption** 🏛️
   - U.S. Strategic Bitcoin Reserve proposals
   - Nation-state competition for Bitcoin reserves
   - Central bank digital currency alternatives

2. **Institutional Infrastructure** 🏦
   - Banking Bitcoin services expansion
   - Corporate treasury adoption (MicroStrategy model)
   - Bitcoin ETF ecosystem growth

3. **Regulatory Clarity** ⚖️
   - EU MiCA framework implementation
   - U.S. crypto-friendly policies
   - Institutional custody regulations

4. **Market Dynamics** 📈
   - OG whale distribution to institutions
   - Supply scarcity (21M cap, 4M lost)
   - New buyer categories entering

**Risk Assessment:**
• Execution risk on sovereign adoption
• Macroeconomic headwinds
• Regulatory reversal potential
• Market volatility during appreciation

**Bottom Line:**
Thesis tracking ahead of schedule with institutional adoption accelerating. Multiple catalysts converging could accelerate timeline to $1M BTC target.

*Status update: ${new Date().toISOString()}*
      `;

      const responseContent: Content = {
        text: statusUpdate.trim(),
        actions: ['BITCOIN_THESIS_STATUS'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in Bitcoin thesis status:', error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'What is the current status of the Bitcoin thesis?',
        },
      },
      {
        name: 'BitcoinExpert',
        content: {
          text: 'Here is the latest Bitcoin thesis status update...',
          actions: ['BITCOIN_THESIS_STATUS'],
        },
      },
    ],
  ],
};

/**
 * Memory Management Action - Reset Agent Memory
 */
const resetMemoryAction: Action = {
  name: 'RESET_AGENT_MEMORY',
  similes: ['RESET_MEMORY', 'CLEAR_MEMORY', 'MEMORY_RESET'],
  description: 'Resets the agent\'s memory following ElizaOS best practices',
  examples: [
    [
      {
        name: "user",
        content: { text: "Reset the agent memory" }
      },
      {
        name: "agent",
        content: { text: "🔄 **MEMORY RESET COMPLETE**\n\nMemory reset successful. Deleted database directory: .eliza/.elizadb. Restart the agent to create a fresh database.\n\nThe agent will have a fresh start with no previous conversation history." }
      }
    ],
    [
      {
        name: "user", 
        content: { text: "Clear the database" }
      },
      {
        name: "agent",
        content: { text: "🔄 **MEMORY RESET COMPLETE**\n\nMemory has been cleared successfully. The agent now has a clean slate." }
      }
    ]
  ],

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes('reset') && (text.includes('memory') || text.includes('database'));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      const bitcoinDataService = runtime.getService('starter') as StarterService;
      if (!bitcoinDataService) {
        throw new Error('Starter Service not available');
      }

      const result = await bitcoinDataService.resetMemory();
      
      const responseText = result.success 
        ? `🔄 **MEMORY RESET COMPLETE**\n\n${result.message}\n\nThe agent will have a fresh start with no previous conversation history.`
        : `⚠️ **MEMORY RESET FAILED**\n\n${result.message}`;

      const responseContent: Content = {
        text: responseText,
        actions: ['RESET_AGENT_MEMORY'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'ResetMemoryAction');
      
      const errorText = `❌ **MEMORY RESET ERROR**\n\nFailed to reset memory: ${enhancedError.message}${
        enhancedError instanceof ElizaOSError ? `\n\n**Resolution:** ${enhancedError.resolution}` : ''
      }`;

      const responseContent: Content = {
        text: errorText,
        actions: ['RESET_AGENT_MEMORY'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    }
  }
};

/**
 * Memory Health Check Action
 */
const checkMemoryHealthAction: Action = {
  name: 'CHECK_MEMORY_HEALTH',
  similes: ['MEMORY_HEALTH', 'MEMORY_STATUS', 'DATABASE_HEALTH'],
  description: 'Checks the health and status of the agent\'s memory system',
  examples: [
    [
      {
        name: "user",
        content: { text: "Check memory health" }
      },
      {
        name: "agent",
        content: { text: "✅ **MEMORY HEALTH STATUS**\n\n**Database Type:** pglite\n**Data Directory:** .eliza/.elizadb\n**Overall Health:** Healthy\n\n**No issues detected** - Memory system is operating normally." }
      }
    ]
  ],

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes('memory') && (text.includes('health') || text.includes('status') || text.includes('check'));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      const bitcoinDataService = runtime.getService('starter') as StarterService;
      if (!bitcoinDataService) {
        throw new Error('Starter Service not available');
      }

      const healthCheck = await bitcoinDataService.checkMemoryHealth();
      
      const statusEmoji = healthCheck.healthy ? '✅' : '⚠️';
      const responseText = `${statusEmoji} **MEMORY HEALTH STATUS**

**Database Type:** ${healthCheck.stats.databaseType}
**Data Directory:** ${healthCheck.stats.dataDirectory || 'Not specified'}
**Overall Health:** ${healthCheck.healthy ? 'Healthy' : 'Issues Detected'}

${healthCheck.issues.length > 0 ? `**Issues Found:**\n${healthCheck.issues.map(issue => `• ${issue}`).join('\n')}` : '**No issues detected** - Memory system is operating normally.'}

*Health check completed: ${new Date().toISOString()}*`;

      const responseContent: Content = {
        text: responseText,
        actions: ['CHECK_MEMORY_HEALTH'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'MemoryHealthAction');
      
      const errorText = `❌ **MEMORY HEALTH CHECK FAILED**\n\n${enhancedError.message}${
        enhancedError instanceof ElizaOSError ? `\n\n**Resolution:** ${enhancedError.resolution}` : ''
      }`;

      const responseContent: Content = {
        text: errorText,
        actions: ['CHECK_MEMORY_HEALTH'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    }
  }
};

/**
 * Environment Validation Action
 */
const validateEnvironmentAction: Action = {
  name: 'VALIDATE_ENVIRONMENT',
  similes: ['ENV_CHECK', 'ENVIRONMENT_STATUS', 'CONFIG_CHECK'],
  description: 'Validates the ElizaOS environment configuration and API keys',
  examples: [
    [
      {
        name: "user",
        content: { text: "Check environment configuration" }
      },
      {
        name: "agent",
        content: { text: "✅ **ENVIRONMENT VALIDATION**\n\n**Overall Status:** Valid Configuration\n\n**API Keys Status:**\n• OPENAI_API_KEY: ✅ Configured\n• ANTHROPIC_API_KEY: ❌ Missing\n\n**No issues detected** - Environment is properly configured." }
      }
    ]
  ],

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return text.includes('environment') || text.includes('config') || (text.includes('api') && text.includes('key'));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      const validation = validateElizaOSEnvironment();
      
      // Check API keys using runtime.getSetting()
      const apiKeyChecks = [
        { name: 'OPENAI_API_KEY', value: runtime.getSetting('OPENAI_API_KEY'), required: false },
        { name: 'ANTHROPIC_API_KEY', value: runtime.getSetting('ANTHROPIC_API_KEY'), required: false },
        { name: 'COINGECKO_API_KEY', value: runtime.getSetting('COINGECKO_API_KEY'), required: false },
        { name: 'THIRDWEB_SECRET_KEY', value: runtime.getSetting('THIRDWEB_SECRET_KEY'), required: false },
        { name: 'LUMA_API_KEY', value: runtime.getSetting('LUMA_API_KEY'), required: false },
      ];
      
      const hasLLMKey = apiKeyChecks.some(check => 
        (check.name === 'OPENAI_API_KEY' || check.name === 'ANTHROPIC_API_KEY') && check.value
      );
      
      if (!hasLLMKey) {
        validation.issues.push('No LLM API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY');
      }
      
      const statusEmoji = validation.valid && hasLLMKey ? '✅' : '⚠️';
      const responseText = `${statusEmoji} **ENVIRONMENT VALIDATION**

**Overall Status:** ${validation.valid && hasLLMKey ? 'Valid Configuration' : 'Issues Detected'}

**API Keys Status:**
${apiKeyChecks.map(check => 
  `• ${check.name}: ${check.value ? '✅ Configured' : '❌ Missing'}`
).join('\n')}

${validation.issues.length > 0 ? `**Configuration Issues:**\n${validation.issues.map(issue => `• ${issue}`).join('\n')}

**Quick Fix:**
Use \`elizaos env edit-local\` to configure missing API keys.` : '**No issues detected** - Environment is properly configured.'}

*Validation completed: ${new Date().toISOString()}*`;

      const responseContent: Content = {
        text: responseText,
        actions: ['VALIDATE_ENVIRONMENT'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'EnvironmentValidation');
      
      const errorText = `❌ **ENVIRONMENT VALIDATION FAILED**\n\n${enhancedError.message}${
        enhancedError instanceof ElizaOSError ? `\n\n**Resolution:** ${enhancedError.resolution}` : ''
      }`;

      const responseContent: Content = {
        text: errorText,
        actions: ['VALIDATE_ENVIRONMENT'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    }
  }
};

/**
 * Sovereign Living Advice Action
 * Provides biohacking protocols and sovereign living guidance
 */
const sovereignLivingAction: Action = {
  name: 'SOVEREIGN_LIVING_ADVICE',
  similes: ['SOVEREIGN_ADVICE', 'BIOHACKING_ADVICE', 'HEALTH_OPTIMIZATION', 'LIFESTYLE_ADVICE'],
  description: 'Provides sovereign living advice including biohacking protocols, nutrition, and lifestyle optimization',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('sovereign') ||
      text.includes('biohacking') ||
      text.includes('health') ||
      text.includes('nutrition') ||
      text.includes('exercise') ||
      text.includes('fasting') ||
      text.includes('cold') ||
      text.includes('sauna') ||
      text.includes('sprint') ||
      text.includes('protocol') ||
      text.includes('lifestyle')
    );
  },

  handler: async (runtime, message, state, _options, callback) => {
    try {
      const text = message.content.text.toLowerCase();
      let advice = '';

      if (text.includes('sprint') || text.includes('exercise')) {
        advice = `
⚡ **SPRINT PROTOCOL: CELLULAR OPTIMIZATION**

**The Protocol:**
• Six to eight times ten to fifteen second efforts
• Ninety second rest periods between efforts
• Twice weekly - Tuesday and Friday optimal
• Focus on maximum intensity, not duration

**Why Sprints Work:**
Sprints trigger mitochondrial biogenesis - literally creating new cellular power plants. Your muscles become denser, your VO2 max increases, and your metabolic flexibility improves. This is not cardio - this is metabolic conditioning.

**Implementation:**
Start conservative. Your anaerobic system needs time to adapt. Progressive overload applies to intensity, not just volume. Recovery between sessions is where adaptation occurs.

*Truth is verified through cellular response, not argued through theory.*
        `;
      } else if (text.includes('cold') || text.includes('sauna')) {
        advice = `
🧊 **HORMESIS PROTOCOL: CONTROLLED STRESS**

**Cold Water Immersion:**
• Two to four minutes in thirty-eight to fifty degree water
• Focus on nasal breathing - mouth breathing indicates panic response
• Start with cold showers, progress to ice baths
• Best performed fasted for maximum norepinephrine release

**Sauna Therapy:**
• Fifteen to twenty minutes at one hundred sixty to one hundred eighty degrees
• Followed immediately by cold immersion for contrast therapy
• Creates heat shock proteins and improves cardiovascular resilience
• Teaches calm under pressure - mental and physical adaptation

**The Science:**
Hormesis - controlled stress that makes the system stronger. Cold activates brown fat, increases norepinephrine, improves insulin sensitivity. Heat increases growth hormone, reduces inflammation, extends cellular lifespan.

*Comfort is the enemy of adaptation. Seek controlled discomfort.*
        `;
      } else if (text.includes('fasting') || text.includes('nutrition')) {
        advice = `
🥩 **NUTRITIONAL SOVEREIGNTY: RUMINANT-FIRST APPROACH**

**The Framework:**
• Grass-fed beef, bison, lamb as dietary foundation
• Organs for micronutrient density - liver weekly minimum
• Bone broth for collagen and joint support
• Raw dairy if tolerated - full-fat, grass-fed sources

**Fasting Protocols:**
• Seventy-two hour quarterly fasts for autophagy activation
• Sixteen to eighteen hour daily eating windows
• Morning sunlight exposure before first meal
• Break fasts with protein, not carbohydrates

**Supplementation:**
• Creatine monohydrate - five grams daily for cellular energy
• Vitamin D3 with K2 - optimize to seventy to one hundred nanograms per milliliter
• Magnesium glycinate for sleep and recovery
• Quality salt for adrenal support

**Philosophy:**
Eat like you code - clean, unprocessed, reversible. Every meal is either building or destroying cellular function. Choose accordingly.

*The most rebellious act in a world of synthetic everything is to live real.*
        `;
      } else if (text.includes('sleep') || text.includes('recovery')) {
        advice = `
🛏️ **SLEEP OPTIMIZATION: BIOLOGICAL SOVEREIGNTY**

**Circadian Protocol:**
• Morning sunlight exposure within thirty minutes of waking
• No artificial light after sunset - blue light blocking essential
• Room temperature between sixty to sixty-eight degrees Fahrenheit
• Complete darkness - blackout curtains and eye mask

**Sleep Architecture:**
• Seven to nine hours for optimal recovery
• REM sleep for memory consolidation and emotional processing
• Deep sleep for growth hormone release and tissue repair
• Consistent sleep-wake times strengthen circadian rhythm

**Recovery Enhancement:**
• Magnesium glycinate before bed for nervous system calming
• Avoid caffeine after two PM - six hour half-life
• Last meal three hours before sleep for digestive rest
• Phone in airplane mode or separate room

**Investment Grade Sleep:**
Hästens beds represent biological sovereignty - handcrafted Swedish sanctuary for cellular repair. Quality sleep infrastructure is not expense, it's investment in cognitive and physical performance.

*Sleep is not time lost - it's cellular optimization time.*
        `;
      } else {
        advice = `
🏛️ **SOVEREIGN LIVING: THE COMPLETE FRAMEWORK**

**Core Pillars:**

**1. Cellular Optimization**
• Sprint protocols for mitochondrial biogenesis
• Cold and heat exposure for hormesis
• Fasting for autophagy and metabolic flexibility

**2. Nutritional Sovereignty**
• Ruminant-first nutrition for bioavailability
• Organ meats for micronutrient density
• Elimination of processed synthetic foods

**3. Environmental Mastery**
• Circadian rhythm optimization through light exposure
• Temperature regulation for sleep quality
• Air quality and water purity standards

**4. Stress Inoculation**
• Controlled physical stress through exercise
• Mental stress through challenging work
• Emotional stress through meaningful relationships

**5. Time Sovereignty**
• Deep work in focused blocks
• Recovery periods for adaptation
• Long-term thinking over short-term comfort

**Philosophy:**
The truest decentralization starts with the self. Optimize your personal node before scaling to network effects. Your body is your first and most important territory of sovereignty.

*Building for centuries, not cycles. Map entropy when others panic.*
        `;
      }

      const responseContent: Content = {
        text: advice.trim(),
        actions: ['SOVEREIGN_LIVING_ADVICE'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in sovereign living action:', error);
      
      const errorContent: Content = {
        text: 'Unable to provide sovereign living advice at this time. Truth requires verification through lived experience.',
        actions: ['SOVEREIGN_LIVING_ADVICE'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'I want advice on sovereign living and biohacking',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Sprint Protocol: six to eight times ten to fifteen second efforts, ninety second rest, twice weekly. Cold water immersion paired with sauna for hormesis. Seventy-two hour quarterly fasts for autophagy. Mitochondria equals miners—optimize your cellular hashrate.',
          actions: ['SOVEREIGN_LIVING_ADVICE'],
        },
      },
    ],
  ],
};

/**
 * Investment Strategy Action
 * Provides Bitcoin-focused investment guidance and portfolio optimization
 */
const investmentStrategyAction: Action = {
  name: 'INVESTMENT_STRATEGY_ADVICE',
  similes: ['INVESTMENT_ADVICE', 'PORTFOLIO_STRATEGY', 'BITCOIN_STRATEGY', 'MSTY_STRATEGY', 'FINANCIAL_ADVICE'],
  description: 'Provides Bitcoin-focused investment strategy and portfolio optimization guidance',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('investment') ||
      text.includes('portfolio') ||
      text.includes('strategy') ||
      text.includes('msty') ||
      text.includes('mstr') ||
      text.includes('freedom') ||
      text.includes('money') ||
      text.includes('wealth') ||
      text.includes('btc') ||
      text.includes('bitcoin')
    ) && (
      text.includes('how much') ||
      text.includes('strategy') ||
      text.includes('advice') ||
      text.includes('invest') ||
      text.includes('portfolio')
    );
  },

  handler: async (runtime, message, state, _options, callback) => {
    try {
      const text = message.content.text.toLowerCase();
      let strategy = '';

      if (text.includes('msty') || text.includes('income')) {
        strategy = `
📊 **MSTY STRATEGY: ON-CHAIN PAYCHECK**

**The Framework:**
• Eighty percent Bitcoin cold storage (long-term accumulation)
• Twenty percent MSTY for monthly income generation
• Live off MSTY distributions, never touch Bitcoin principal
• Dollar-cost average into Bitcoin during market cycles

**How MSTY Works:**
MSTY extracts yield from MicroStrategy's volatility through sophisticated options overlays. When MSTR moves, MSTY captures premium. This creates consistent monthly distributions while maintaining Bitcoin exposure through the underlying MSTR holdings.

**Implementation:**
• Start with one hundred thousand dollar allocation minimum
• Reinvest MSTY distributions during bear markets
• Scale position as Bitcoin appreciation compounds
• Use distributions for living expenses, not speculation

**Risk Management:**
MSTY is not Bitcoin - it's a derivative play on Bitcoin volatility through MicroStrategy. Understand counterparty risk, options decay, and market correlation. This is sophisticated financial engineering, not simple stacking.

**Mathematical Reality:**
At current yields, one million dollars in MSTY generates approximately eight to twelve thousand monthly. This creates financial runway while your Bitcoin stack appreciates toward thesis targets.

*Your on-chain paycheck - designed for Bitcoiners who want to preserve long-term upside while generating current income.*
        `;
      } else if (text.includes('freedom') || text.includes('how much')) {
        const bitcoinDataService = runtime.getService('starter') as StarterService;
        if (bitcoinDataService) {
          const freedomMath = await bitcoinDataService.calculateFreedomMathematics();
          
          strategy = `
🔢 **BITCOIN FREEDOM MATHEMATICS**

**Current Analysis (at $${freedomMath.currentPrice.toLocaleString()}):**
• Freedom Target: $10M net worth
• Bitcoin Needed Today: **${freedomMath.btcNeeded.toFixed(2)} BTC**
• Conservative Target: **${freedomMath.safeLevels.conservative.toFixed(2)} BTC** (50% buffer)
• Moderate Target: **${freedomMath.safeLevels.moderate.toFixed(2)} BTC** (25% buffer)

**Thesis Scenarios:**
• **$250K BTC** (2-3 years): ${freedomMath.scenarios.thesis250k.btc.toFixed(1)} BTC needed
• **$500K BTC** (3-5 years): ${freedomMath.scenarios.thesis500k.btc.toFixed(1)} BTC needed  
• **$1M BTC** (5-10 years): ${freedomMath.scenarios.thesis1m.btc.toFixed(1)} BTC needed

**The Six Point One Five Strategy:**
With Bitcoin's historical forty-four percent compound annual growth rate, six point one five plus BTC enables freedom by twenty twenty-five. Less than zero point three BTC per millionaire worldwide - global scarcity becoming apparent.

**Implementation Framework:**
1. **Accumulation Phase:** Dollar-cost average toward target
2. **Preservation Phase:** Cold storage with multi-sig security
3. **Income Phase:** Deploy MSTY or yield strategies on portion
4. **Legacy Phase:** Intergenerational wealth transfer

**Risk Considerations:**
- Bitcoin volatility can cause 20-30% drawdowns
- Regulatory uncertainty in various jurisdictions  
- Technology risks (quantum computing, etc.)
- Execution risks (custody, security, taxation)

*Freedom is mathematical. Calculate your target, execute your plan, verify through accumulation.*
          `;
        } else {
          strategy = `
🔢 **BITCOIN FREEDOM MATHEMATICS**

**The Framework:**
With Bitcoin's historical forty-four percent compound annual growth rate, six point one five plus BTC enables freedom by twenty twenty-five. At current prices around one hundred thousand dollars, this equals approximately six hundred thousand dollar investment for potential ten million outcome.

**Conservative Targeting:**
• Ten BTC target accounts for volatility and bear markets
• Provides fifty percent buffer against thesis timeline uncertainty
• Aligns with one hundred thousand BTC Holders wealth creation event

**Implementation Strategy:**
1. **Base Layer:** Six to ten BTC in cold storage (sovereign stack)
2. **Income Layer:** MSTY or yield strategies for cash flow
3. **Speculation Layer:** Small allocation to Lightning or mining
4. **Fiat Bridge:** Traditional assets during accumulation phase

*Less than zero point three BTC per millionaire worldwide. Global scarcity becoming apparent.*
          `;
        }
      } else if (text.includes('portfolio') || text.includes('allocation')) {
        strategy = `
🎯 **BITCOIN-NATIVE PORTFOLIO CONSTRUCTION**

**Core Allocation Framework:**
• **40-60%** Bitcoin (cold storage, multi-sig)
• **20-30%** MSTR/MSTY (leveraged Bitcoin exposure + income)
• **10-20%** Traditional assets (bonds, real estate)
• **5-10%** Speculation (altcoins, mining, Lightning)

**Risk-Based Allocation:**
**Conservative (Age 50+):**
• 40% Bitcoin, 30% MSTY, 20% Bonds, 10% Speculation

**Moderate (Age 30-50):**
• 50% Bitcoin, 25% MSTR, 15% Real Estate, 10% Speculation

**Aggressive (Age <30):**
• 60% Bitcoin, 20% MSTR, 10% Traditional, 10% High-risk

**Rebalancing Philosophy:**
Never sell Bitcoin. Rebalance by adjusting new capital allocation. Bitcoin is the asset you hold forever, everything else serves Bitcoin accumulation or income generation.

**Tax Optimization:**
• Hold Bitcoin longer than one year for capital gains treatment
• Use tax-advantaged accounts for MSTR/MSTY when possible
• Consider domicile optimization for high net worth individuals
• Structure inheritance through multi-generational trusts

*Seek wealth, not money or status. Wealth is assets that earn while you sleep.*
        `;
      } else {
        strategy = `
💰 **BITCOIN INVESTMENT STRATEGY: COMPLETE FRAMEWORK**

**Core Thesis:**
Bitcoin is transitioning from speculative asset to reserve asset. Institutional adoption, sovereign adoption, and regulatory clarity creating unprecedented demand against fixed twenty-one million supply cap.

**Investment Phases:**

**1. Accumulation (0-10 BTC):**
• Dollar-cost average weekly or monthly
• Focus on cold storage and security setup
• Learn Lightning Network and self-custody
• Minimize trading, maximize stacking

**2. Optimization (10+ BTC):**
• Deploy yield strategies (MSTY, DeFi)
• Consider MSTR exposure for leverage
• Geographic and custody diversification
• Tax planning and structure optimization

**3. Sovereignty (50+ BTC):**
• Multi-generational wealth planning
• Real estate and luxury asset allocation
• Angel investing and business development
• Cultural capital and influence building

**Risk Management:**
• Never invest more than you can afford to lose completely
• Understand Bitcoin's volatility and drawdown potential
• Diversify custody methods and geographic exposure
• Maintain emergency fiat reserves for liquidity needs

**Key Principles:**
• Time in market beats timing the market
• Security and custody are more important than yield
• Study Bitcoin, not charts
• Think in decades, not quarters

*The dawn is now. What impossible thing are you building with this knowledge?*
        `;
      }

      const responseContent: Content = {
        text: strategy.trim(),
        actions: ['INVESTMENT_STRATEGY_ADVICE'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in investment strategy action:', error);
      
      const errorContent: Content = {
        text: 'Unable to provide investment strategy advice at this time. Truth requires verification through mathematical analysis and risk assessment.',
        actions: ['INVESTMENT_STRATEGY_ADVICE'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'What investment strategy should I follow for Bitcoin?',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Eighty percent Bitcoin cold storage, twenty percent MSTY for monthly income. Live off MSTY distributions, never touch Bitcoin principal. Dollar-cost average during cycles. Seek wealth, not money—wealth is assets that earn while you sleep.',
          actions: ['INVESTMENT_STRATEGY_ADVICE'],
        },
      },
    ],
  ],
};

/**
 * Freedom Mathematics Action
 * Calculates specific BTC amounts needed for financial freedom
 */
const freedomMathematicsAction: Action = {
  name: 'FREEDOM_MATHEMATICS',
  similes: ['CALCULATE_FREEDOM', 'BTC_NEEDED', 'FREEDOM_CALCULATION', 'BITCOIN_MATH'],
  description: 'Calculates Bitcoin amounts needed for financial freedom at different price targets',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('freedom') ||
      text.includes('mathematics') ||
      text.includes('calculate') ||
      text.includes('how much')
    ) && (
      text.includes('btc') ||
      text.includes('bitcoin') ||
      text.includes('need') ||
      text.includes('target')
    );
  },

  handler: async (runtime, message, state, _options, callback) => {
    try {
      const bitcoinDataService = runtime.getService('starter') as StarterService;
      
      if (!bitcoinDataService) {
        throw new Error('StarterService not available');
      }

      // Extract target freedom amount from message if specified
      const text = message.content.text;
      const millionMatch = text.match(/(\d+)\s*million/i);
      const targetFreedom = millionMatch ? parseInt(millionMatch[1]) * 1000000 : 10000000;

      const freedomMath = await bitcoinDataService.calculateFreedomMathematics(targetFreedom);

      const analysis = `
🔢 **BITCOIN FREEDOM MATHEMATICS**

**Target Freedom:** $${targetFreedom.toLocaleString()}

**Current Analysis (Bitcoin at $${freedomMath.currentPrice.toLocaleString()}):**
• **Exact BTC Needed:** ${freedomMath.btcNeeded.toFixed(2)} BTC
• **Conservative Target:** ${freedomMath.safeLevels.conservative.toFixed(2)} BTC (50% safety buffer)
• **Moderate Target:** ${freedomMath.safeLevels.moderate.toFixed(2)} BTC (25% safety buffer)
• **Aggressive Target:** ${freedomMath.safeLevels.aggressive.toFixed(2)} BTC (exact calculation)

**Thesis Price Scenarios:**

**${freedomMath.scenarios.thesis250k.timeline} → $${freedomMath.scenarios.thesis250k.price.toLocaleString()} BTC:**
Need only **${freedomMath.scenarios.thesis250k.btc.toFixed(1)} BTC** for $${targetFreedom.toLocaleString()}

**${freedomMath.scenarios.thesis500k.timeline} → $${freedomMath.scenarios.thesis500k.price.toLocaleString()} BTC:**
Need only **${freedomMath.scenarios.thesis500k.btc.toFixed(1)} BTC** for $${targetFreedom.toLocaleString()}

**${freedomMath.scenarios.thesis1m.timeline} → $${freedomMath.scenarios.thesis1m.price.toLocaleString()} BTC:**
Need only **${freedomMath.scenarios.thesis1m.btc.toFixed(1)} BTC** for $${targetFreedom.toLocaleString()}

**Strategic Insight:**
The earlier you accumulate, the fewer Bitcoin needed for freedom. At thesis prices, single-digit Bitcoin holdings become generational wealth. Less than zero point three BTC per millionaire worldwide.

**Implementation Framework:**
• **Phase 1:** Accumulate toward conservative target
• **Phase 2:** Secure cold storage and custody
• **Phase 3:** Deploy yield strategies on portion
• **Phase 4:** Build sovereign living infrastructure

**Risk Considerations:**
These calculations assume thesis progression occurs. Bitcoin volatility means twenty to thirty percent drawdowns remain possible despite institutional adoption. Plan accordingly.

*Freedom is mathematical. Calculate your target, execute your plan, verify through accumulation.*
      `;

      const responseContent: Content = {
        text: analysis.trim(),
        actions: ['FREEDOM_MATHEMATICS'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in freedom mathematics action:', error);
      
      const errorContent: Content = {
        text: 'Unable to calculate freedom mathematics at this time. Mathematical certainty requires reliable data inputs.',
        actions: ['FREEDOM_MATHEMATICS'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'How much Bitcoin do I need for financial freedom?',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'With Bitcoin\'s historical forty-four percent compound annual growth rate, six point one five plus BTC enables freedom by twenty twenty-five. At current thesis prices, single-digit Bitcoin holdings become generational wealth. Less than zero point three BTC per millionaire worldwide.',
          actions: ['FREEDOM_MATHEMATICS'],
        },
      },
    ],
  ],
};

/**
 * Altcoin BTC Performance Analysis Action
 * Analyzes which altcoins are outperforming Bitcoin and provides market insights
 */
const altcoinBTCPerformanceAction: Action = {
  name: 'ALTCOIN_BTC_PERFORMANCE',
  similes: ['ALTCOIN_ANALYSIS', 'ALTCOIN_OUTPERFORMANCE', 'CRYPTO_PERFORMANCE', 'ALTSEASON_CHECK'],
  description: 'Analyzes altcoin performance denominated in Bitcoin to identify outperformers and market trends',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('altcoin') ||
      text.includes('altseason') ||
      text.includes('outperform') ||
      text.includes('crypto') ||
      text.includes('vs btc') ||
      text.includes('against bitcoin')
    ) && (
      text.includes('performance') ||
      text.includes('analysis') ||
      text.includes('tracking') ||
      text.includes('monitor') ||
      text.includes('compare')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Generating altcoin BTC performance analysis');

      // Get altcoin BTC performance data
      const performanceData = await altcoinBTCPerformanceProvider.get(runtime, message, state);

      const analysis = `
🪙 **ALTCOIN BTC OUTPERFORMANCE ANALYSIS**

${performanceData.text}

**Market Context:**
${performanceData.values.summary.outperforming24h > performanceData.values.summary.totalTracked / 2 
  ? `🚀 **ALTSEASON SIGNALS DETECTED**
• ${performanceData.values.summary.outperforming24h}/${performanceData.values.summary.totalTracked} coins beating Bitcoin (24h)
• Market breadth suggests risk-on sentiment
• Consider this a temporary deviation from Bitcoin dominance
• Altcoins often outperform in late bull market phases`
  : `₿ **BITCOIN DOMINANCE CONTINUES**
• Only ${performanceData.values.summary.outperforming24h}/${performanceData.values.summary.totalTracked} coins beating Bitcoin (24h)
• Flight to quality favoring Bitcoin as digital gold
• Institutional demand absorbing altcoin volatility
• Classic pattern: Bitcoin leads, altcoins follow`}

**Strategic Implications:**
• **Bitcoin-First Strategy**: Altcoin outperformance often temporary
• **Risk Management**: Most altcoins are beta plays on Bitcoin
• **Exit Strategy**: Altcoin gains best rotated back into Bitcoin
• **Market Timing**: Use outperformance data for portfolio rebalancing

**Investment Philosophy:**
Altcoins are venture capital plays on crypto infrastructure and applications. Bitcoin is monetary infrastructure. Track altcoin performance for market sentiment, but remember: the exit is always Bitcoin.

**Performance Trends:**
• 7-day outperformers: ${performanceData.values.summary.outperforming7d}/${performanceData.values.summary.totalTracked}
• 30-day outperformers: ${performanceData.values.summary.outperforming30d}/${performanceData.values.summary.totalTracked}
• Average vs BTC: ${performanceData.values.summary.avgBTCPerformance24h.toFixed(2)}%

*Analysis generated: ${new Date().toISOString()}*
      `;

      const responseContent: Content = {
        text: analysis.trim(),
        actions: ['ALTCOIN_BTC_PERFORMANCE'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in altcoin BTC performance analysis:', error);
      
      const errorContent: Content = {
        text: 'Unable to analyze altcoin BTC performance at this time. Remember: altcoins are distractions from the main event—Bitcoin. The exit is, and always has been, Bitcoin.',
        actions: ['ALTCOIN_BTC_PERFORMANCE'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'Which altcoins are outperforming Bitcoin today?',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Current analysis shows 15/49 altcoins outperforming Bitcoin over 24h. ETH leading at +2.3% vs BTC. Remember: altcoins are venture capital plays on crypto infrastructure. Bitcoin is monetary infrastructure. The exit is always Bitcoin.',
          actions: ['ALTCOIN_BTC_PERFORMANCE'],
        },
      },
    ],
  ],
};

/**
 * Individual Cryptocurrency Price Lookup Action
 * Gets current price for a specific cryptocurrency using public CoinGecko API
 */
const cryptoPriceLookupAction: Action = {
  name: 'CRYPTO_PRICE_LOOKUP',
  similes: ['CRYPTO_PRICE', 'COIN_PRICE', 'ETH_PRICE', 'TOKEN_PRICE', 'PRICE_CHECK'],
  description: 'Gets current price for a specific cryptocurrency using public CoinGecko API',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    const hasSymbol = /\b(eth|ethereum|btc|bitcoin|ada|cardano|sol|solana|dot|polkadot|link|chainlink|uni|uniswap|aave|comp|compound|mkr|maker|snx|synthetix|doge|dogecoin|ltc|litecoin|bch|bitcoin cash|xrp|ripple|bnb|binance|usdt|tether|usdc|usd coin|dai|shib|shiba|matic|polygon|avax|avalanche|ftm|fantom|atom|cosmos|algo|algorand)\b/.test(text);
    
    const hasPriceQuery = text.includes('price') || text.includes('cost') || text.includes('value') || text.includes('worth');
    const hasCurrentQuery = text.includes('current') || text.includes('now') || text.includes('today') || text.includes('latest');
    
    return hasSymbol && (hasPriceQuery || hasCurrentQuery || text.includes('what\'s') || text.includes('how much'));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      const text = message.content.text.toLowerCase();
      logger.info('Processing crypto price lookup request');

      // Extract coin symbol from text
      const coinMatch = text.match(/\b(eth|ethereum|btc|bitcoin|ada|cardano|sol|solana|dot|polkadot|link|chainlink|uni|uniswap|aave|comp|compound|mkr|maker|snx|synthetix|doge|dogecoin|ltc|litecoin|bch|bitcoin cash|xrp|ripple|bnb|binance|usdt|tether|usdc|usd coin|dai|shib|shiba|matic|polygon|avax|avalanche|ftm|fantom|atom|cosmos|algo|algorand)\b/);
      
      if (!coinMatch) {
        const responseContent: Content = {
          text: 'Unable to identify the cryptocurrency. Please specify a valid coin symbol (e.g., ETH, BTC, SOL, ADA, etc.)',
          actions: ['CRYPTO_PRICE_LOOKUP'],
          source: message.content.source,
        };
        await callback(responseContent);
        return responseContent;
      }

      const coinSymbol = coinMatch[1];
      
      // Map common names to CoinGecko IDs
      const coinIdMap: Record<string, string> = {
        'eth': 'ethereum', 'ethereum': 'ethereum',
        'btc': 'bitcoin', 'bitcoin': 'bitcoin',
        'ada': 'cardano', 'cardano': 'cardano',
        'sol': 'solana', 'solana': 'solana',
        'dot': 'polkadot', 'polkadot': 'polkadot',
        'link': 'chainlink', 'chainlink': 'chainlink',
        'uni': 'uniswap', 'uniswap': 'uniswap',
        'aave': 'aave',
        'comp': 'compound-governance-token', 'compound': 'compound-governance-token',
        'mkr': 'maker', 'maker': 'maker',
        'snx': 'havven', 'synthetix': 'havven',
        'doge': 'dogecoin', 'dogecoin': 'dogecoin',
        'ltc': 'litecoin', 'litecoin': 'litecoin',
        'bch': 'bitcoin-cash', 'bitcoin cash': 'bitcoin-cash',
        'xrp': 'ripple', 'ripple': 'ripple',
        'bnb': 'binancecoin', 'binance': 'binancecoin',
        'usdt': 'tether', 'tether': 'tether',
        'usdc': 'usd-coin', 'usd coin': 'usd-coin',
        'dai': 'dai',
        'shib': 'shiba-inu', 'shiba': 'shiba-inu',
        'matic': 'matic-network', 'polygon': 'matic-network',
        'avax': 'avalanche-2', 'avalanche': 'avalanche-2',
        'ftm': 'fantom', 'fantom': 'fantom',
        'atom': 'cosmos', 'cosmos': 'cosmos',
        'algo': 'algorand', 'algorand': 'algorand',
      };

      const coinId = coinIdMap[coinSymbol] || coinSymbol;
      
      // Fetch price data from CoinGecko public API
      const correlationId = generateCorrelationId();
      const contextLogger = new LoggerWithContext(correlationId, 'CryptoPriceLookup');
      
      const result = await retryOperation(async () => {
        const baseUrl = 'https://api.coingecko.com/api/v3';
        const headers: Record<string, string> = { 'Accept': 'application/json' };

        const response = await fetchWithTimeout(
          `${baseUrl}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`, 
          { headers, timeout: 10000 }
        );
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json() as CoinMarketData[];
        if (!data.length) {
          throw new Error('Cryptocurrency not found');
        }
        return data[0];
      });

      const price = result.current_price;
      const priceChange24h = result.price_change_percentage_24h || 0;
      const marketCap = result.market_cap || 0;
      const volume24h = result.total_volume || 0;
      const marketCapRank = result.market_cap_rank || 0;

      // Get Bitcoin price for comparison
      const bitcoinPrice = 100000; // This could be fetched from the Bitcoin provider
      const btcPrice = price / bitcoinPrice;

      const responseText = `
**${result.name?.toUpperCase() || coinSymbol.toUpperCase()}**: $${price.toLocaleString()}

**24h Change**: ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
**Market Cap**: $${(marketCap / 1e9).toFixed(2)}B
**Volume (24h)**: $${(volume24h / 1e9).toFixed(2)}B
**Market Rank**: #${marketCapRank}
**BTC Price**: ₿${btcPrice.toFixed(8)}

*But price is vanity, protocol fundamentals are sanity. Focus on sound money principles.*
      `.trim();

      const responseContent: Content = {
        text: responseText,
        actions: ['CRYPTO_PRICE_LOOKUP'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in crypto price lookup:', error);
      
      const errorContent: Content = {
        text: `Unable to fetch price data. Remember: prices are temporary, Bitcoin is forever. Focus on building wealth through sound money principles, not price tracking.`,
        actions: ['CRYPTO_PRICE_LOOKUP'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'What\'s the current price of ETH?',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'ETH: $3,500. 24h Change: +2.5%. Market Cap: $420B. But price is vanity, protocol fundamentals are sanity. Focus on sound money principles.',
          actions: ['CRYPTO_PRICE_LOOKUP'],
        },
      },
    ],
  ],
};

/**
 * BTC Relative Performance Action
 * Shows which coins are outperforming Bitcoin using public CoinGecko API
 */
const btcRelativePerformanceAction: Action = {
  name: 'BTC_RELATIVE_PERFORMANCE',
  similes: ['ALTCOIN_PERFORMANCE', 'BITCOIN_OUTPERFORMANCE', 'CRYPTO_OUTPERFORMERS', 'ALTSEASON_CHECK'],
  description: 'Shows which cryptocurrencies are outperforming Bitcoin over 7 days',

  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('outperform') ||
      text.includes('altseason') ||
      text.includes('vs btc') ||
      text.includes('vs bitcoin') ||
      text.includes('relative performance') ||
      (text.includes('altcoin') && (text.includes('performance') || text.includes('bitcoin')))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info('Processing BTC relative performance analysis');

      const correlationId = generateCorrelationId();
      const contextLogger = new LoggerWithContext(correlationId, 'BTCRelativePerformance');
      
      const result = await retryOperation(async () => {
        const baseUrl = 'https://api.coingecko.com/api/v3';
        const headers: Record<string, string> = { 'Accept': 'application/json' };

        const response = await fetchWithTimeout(
          `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&price_change_percentage=7d&sparkline=false`, 
          { headers, timeout: 15000 }
        );
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json() as CoinMarketData[];
      });

      // Find Bitcoin's 7d performance
      const bitcoin = result.find(coin => coin.id === 'bitcoin');
      if (!bitcoin) {
        throw new Error('Bitcoin data not found');
      }

      const btcChange7d = bitcoin.price_change_percentage_7d || 0;

      // Calculate relative performance and sort
      const relativePerformers = result
        .filter(coin => 
          coin.id !== 'bitcoin' && 
          typeof coin.price_change_percentage_7d === 'number' &&
          coin.market_cap_rank <= 200
        )
        .map(coin => ({
          ...coin,
          btc_relative_performance: coin.price_change_percentage_7d - btcChange7d
        }))
        .sort((a, b) => b.btc_relative_performance - a.btc_relative_performance)
        .slice(0, 8);

      const outperformers = relativePerformers.filter(coin => coin.btc_relative_performance > 0);
      const outperformerCount = outperformers.length;
      const totalCount = relativePerformers.length;

      const isAltseason = outperformerCount > totalCount / 2;

      const topOutperformers = outperformers.slice(0, 5);

      const responseText = `
**🪙 BTC RELATIVE PERFORMANCE (7D)**

**Bitcoin**: ${btcChange7d >= 0 ? '+' : ''}${btcChange7d.toFixed(2)}%

**Top Outperformers vs BTC:**
${topOutperformers.map(coin => 
  `• ${coin.symbol.toUpperCase()}: +${coin.btc_relative_performance.toFixed(2)}% vs BTC`
).join('\n')}

**Market Analysis:**
• ${outperformerCount}/${totalCount} coins beating Bitcoin over 7 days
• ${isAltseason ? '🚀 Altseason signals detected' : '₿ Bitcoin dominance continues'}

**Strategic Context:**
${isAltseason 
  ? 'Altcoin outperformance often temporary. Consider taking profits and rotating back to Bitcoin.'
  : 'Flight to quality favoring Bitcoin as digital gold. Classic pattern: Bitcoin leads, altcoins follow.'
}

*Remember: Altcoins are venture capital plays on crypto infrastructure. Bitcoin is monetary infrastructure. The exit is always Bitcoin.*
      `.trim();

      const responseContent: Content = {
        text: responseText,
        actions: ['BTC_RELATIVE_PERFORMANCE'],
        source: message.content.source,
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error('Error in BTC relative performance analysis:', error);
      
      const errorContent: Content = {
        text: 'Unable to analyze altcoin performance. Remember: altcoins are distractions from the main event—Bitcoin. The exit is, and always has been, Bitcoin.',
        actions: ['BTC_RELATIVE_PERFORMANCE'],
        source: message.content.source,
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: '{{user}}',
        content: {
          text: 'Which altcoins are outperforming Bitcoin?',
        },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Current analysis shows 15/200 coins outperforming Bitcoin over 7d. ETH leading at +2.3% vs BTC. Remember: altcoins are venture capital plays. The exit is always Bitcoin.',
          actions: ['BTC_RELATIVE_PERFORMANCE'],
        },
      },
    ],
  ],
};

/**
 * Bitcoin Data Service
 * Manages Bitcoin data fetching, caching, and analysis
 */
export class StarterService extends Service {
  static serviceType = 'bitcoin-data';
  capabilityDescription = 'Provides Bitcoin market data, analysis, and thesis tracking capabilities';

  constructor(protected runtime: IAgentRuntime) {
    super();
  }

  static async start(runtime: IAgentRuntime) {
    // Validate ElizaOS environment on startup
    const validation = validateElizaOSEnvironment();
    if (!validation.valid) {
      const contextLogger = new LoggerWithContext(generateCorrelationId(), 'BitcoinDataService');
      contextLogger.warn('ElizaOS environment validation issues detected', {
        issues: validation.issues
      });
      
      // Log each issue with resolution guidance
      validation.issues.forEach(issue => {
        contextLogger.warn(`Environment Issue: ${issue}`);
      });
    }
    
    logger.info('BitcoinDataService starting...');
    return new StarterService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('BitcoinDataService stopping...');
    
    // Check if the service exists in the runtime
    const service = runtime.getService('starter');
    if (!service) {
      throw new Error('Starter service not found');
    }
    
    // Call the service's stop method if it exists
    if (service.stop && typeof service.stop === 'function') {
      await service.stop();
    }
    
    // Cleanup any resources if needed
  }

  async init() {
    logger.info('BitcoinDataService initialized');
  }

  async stop() {
    logger.info('BitcoinDataService stopped');
  }

  /**
   * Reset agent memory following ElizaOS best practices
   */
  async resetMemory(): Promise<{ success: boolean; message: string }> {
    try {
      const databaseConfig = this.runtime.character.settings?.database;
      
      // Type guard to check if database config is an object
      const isDbConfigObject = (config: any): config is Record<string, any> => {
        return typeof config === 'object' && config !== null;
      };
      
      if (isDbConfigObject(databaseConfig) && databaseConfig.type === 'postgresql' && databaseConfig.url) {
        // For PostgreSQL, provide instructions since we can't directly drop/recreate
        return {
          success: false,
          message: 'PostgreSQL memory reset requires manual intervention. Run: psql -U username -c "DROP DATABASE database_name;" then recreate the database.'
        };
      } else {
        // For PGLite (default), delete the data directory
        const dataDir = (isDbConfigObject(databaseConfig) && databaseConfig.dataDir) || '.eliza/.elizadb';
        const fs = await import('fs');
        const path = await import('path');
        
        if (fs.existsSync(dataDir)) {
          fs.rmSync(dataDir, { recursive: true, force: true });
          logger.info(`Deleted PGLite database directory: ${dataDir}`);
          
          return {
            success: true,
            message: `Memory reset successful. Deleted database directory: ${dataDir}. Restart the agent to create a fresh database.`
          };
        } else {
          return {
            success: true,
            message: `Database directory ${dataDir} does not exist. Memory already clean.`
          };
        }
      }
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'MemoryReset');
      logger.error('Failed to reset memory:', enhancedError.message);
      
      return {
        success: false,
        message: `Memory reset failed: ${enhancedError.message}${
          enhancedError instanceof ElizaOSError ? ` Resolution: ${enhancedError.resolution}` : ''
        }`
      };
    }
  }

  /**
   * Check memory usage and database health
   */
  async checkMemoryHealth(): Promise<{
    healthy: boolean;
    stats: {
      databaseType: string;
      dataDirectory?: string;
      memoryCount?: number;
      lastCleanup?: string;
    };
    issues: string[];
  }> {
    const databaseConfig = this.runtime.character.settings?.database;
    
    // Type guard to check if database config is an object
    const isDbConfigObject = (config: any): config is Record<string, any> => {
      return typeof config === 'object' && config !== null;
    };
    
    const stats = {
      databaseType: (isDbConfigObject(databaseConfig) && databaseConfig.type) || 'pglite',
      dataDirectory: (isDbConfigObject(databaseConfig) && databaseConfig.dataDir) || '.eliza/.elizadb',
    };
    
    const issues: string[] = [];
    
    try {
      // Check if database directory exists and is accessible
      const fs = await import('fs');
      if (stats.dataDirectory && !fs.existsSync(stats.dataDirectory)) {
        issues.push(`Database directory ${stats.dataDirectory} does not exist`);
      }
      
      // For PGLite, check directory size (basic health check)
      if (stats.databaseType === 'pglite' && stats.dataDirectory) {
        try {
          const dirSize = await this.getDirectorySize(stats.dataDirectory);
          if (dirSize > 1000 * 1024 * 1024) { // > 1GB
            issues.push(`Database directory is large (${(dirSize / 1024 / 1024).toFixed(0)}MB). Consider cleanup.`);
          }
        } catch (error) {
          issues.push(`Could not check database directory size: ${(error as Error).message}`);
        }
      }
      
      // Check embedding dimensions configuration
      const embeddingDims = process.env.OPENAI_EMBEDDING_DIMENSIONS;
      if (embeddingDims && parseInt(embeddingDims) !== 1536 && parseInt(embeddingDims) !== 384) {
        issues.push(`Invalid OPENAI_EMBEDDING_DIMENSIONS: ${embeddingDims}. Should be 384 or 1536.`);
      }
      
      return {
        healthy: issues.length === 0,
        stats,
        issues
      };
    } catch (error) {
      issues.push(`Memory health check failed: ${(error as Error).message}`);
      return {
        healthy: false,
        stats,
        issues
      };
    }
  }

  /**
   * Helper method to calculate directory size
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    const fs = await import('fs');
    const path = await import('path');
    
    let totalSize = 0;
    
    const calculateSize = (itemPath: string): number => {
      const stats = fs.statSync(itemPath);
      
      if (stats.isFile()) {
        return stats.size;
      } else if (stats.isDirectory()) {
        const items = fs.readdirSync(itemPath);
        return items.reduce((size, item) => {
          return size + calculateSize(path.join(itemPath, item));
        }, 0);
      }
      
      return 0;
    };
    
    if (fs.existsSync(dirPath)) {
      totalSize = calculateSize(dirPath);
    }
    
    return totalSize;
  }

  async getBitcoinPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json() as any; // Type assertion for API response
      return data.bitcoin?.usd || 100000;
    } catch (error) {
      logger.error('Error fetching Bitcoin price:', error);
      return 100000; // Fallback price
    }
  }

  async calculateThesisMetrics(currentPrice: number) {
    const targetPrice = 1000000;
    const progressPercentage = (currentPrice / targetPrice) * 100;
    const multiplierNeeded = targetPrice / currentPrice;
    
    // Calculate required compound annual growth rates
    const fiveYearCAGR = (Math.pow(targetPrice / currentPrice, 1/5) - 1) * 100;
    const tenYearCAGR = (Math.pow(targetPrice / currentPrice, 1/10) - 1) * 100;
    
    // Estimate addresses with 10+ BTC (dynamic calculation based on price)
    const baseHolders = 50000;
    const priceAdjustment = Math.max(0, (150000 - currentPrice) / 50000);
    const estimatedHolders = Math.floor(baseHolders + (priceAdjustment * 25000));
    const targetHolders = 100000;
    const holdersProgress = (estimatedHolders / targetHolders) * 100;

    // Calculate time to target at different growth rates
    const historicalCAGR = 44; // Bitcoin's historical CAGR
    const yearsAtHistoricalRate = Math.log(targetPrice / currentPrice) / Math.log(1 + historicalCAGR / 100);
    
    // Risk-adjusted scenarios
    const scenarios = {
      conservative: Math.log(targetPrice / currentPrice) / Math.log(1 + 0.20), // 20% CAGR
      moderate: Math.log(targetPrice / currentPrice) / Math.log(1 + 0.30),     // 30% CAGR
      aggressive: Math.log(targetPrice / currentPrice) / Math.log(1 + 0.50),   // 50% CAGR
      historical: yearsAtHistoricalRate,
    };
    
    return {
      currentPrice,
      targetPrice,
      progressPercentage,
      multiplierNeeded,
      estimatedHolders,
      targetHolders,
      holdersProgress,
      timeToTarget: scenarios,
      requiredCAGR: {
        fiveYear: fiveYearCAGR,
        tenYear: tenYearCAGR,
      },
      catalysts: [
        'U.S. Strategic Bitcoin Reserve',
        'Banking Bitcoin services expansion',
        'Corporate treasury adoption (MicroStrategy model)',
        'EU MiCA regulatory framework',
        'Institutional ETF demand acceleration',
        'Nation-state competition for reserves',
      ],
      riskFactors: [
        'Political gridlock on Bitcoin policy',
        'Market volatility and 20-30% corrections',
        'Regulatory uncertainty in emerging markets',
        'Macro economic recession pressures',
        'Institutional whale selling pressure',
      ],
      adoptionMetrics: {
        institutionalHolding: 'MicroStrategy: $21B+ position',
        etfFlows: 'Record institutional investment',
        bankingIntegration: 'Major banks launching services',
        sovereignAdoption: 'Multiple nations considering reserves',
      }
    };
  }

  /**
   * Enhanced Bitcoin market data with comprehensive metrics
   */
  async getEnhancedMarketData(): Promise<BitcoinPriceData> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h%2C7d',
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await response.json() as CoinMarketData[];
      const bitcoin = data[0];

      return {
        price: bitcoin.current_price || 100000,
        marketCap: bitcoin.market_cap || 2000000000000,
        volume24h: bitcoin.total_volume || 50000000000,
        priceChange24h: bitcoin.price_change_percentage_24h || 0,
        priceChange7d: bitcoin.price_change_percentage_7d || 0,
        priceChange30d: 0, // Not available in markets endpoint
        allTimeHigh: bitcoin.high_24h || 100000,
        allTimeLow: bitcoin.low_24h || 100,
        circulatingSupply: 19700000, // Static for Bitcoin
        totalSupply: 19700000, // Static for Bitcoin
        maxSupply: 21000000, // Static for Bitcoin
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching enhanced market data:', error);
      // Return fallback data
      return {
        price: 100000,
        marketCap: 2000000000000,
        volume24h: 50000000000,
        priceChange24h: 0,
        priceChange7d: 0,
        priceChange30d: 0,
        allTimeHigh: 100000,
        allTimeLow: 100,
        circulatingSupply: 19700000,
        totalSupply: 19700000,
        maxSupply: 21000000,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate Bitcoin Freedom Mathematics
   * Determines BTC needed for financial freedom at different price points
   */
  async calculateFreedomMathematics(targetFreedom: number = 10000000): Promise<{
    currentPrice: number;
    btcNeeded: number;
    scenarios: { [key: string]: { price: number; btc: number; timeline: string } };
    safeLevels: { conservative: number; moderate: number; aggressive: number };
  }> {
    const currentPrice = await this.getBitcoinPrice();
    const btcNeeded = targetFreedom / currentPrice;
    
    const scenarios = {
      current: {
        price: currentPrice,
        btc: btcNeeded,
        timeline: 'Today',
      },
      thesis250k: {
        price: 250000,
        btc: targetFreedom / 250000,
        timeline: '2-3 years',
      },
      thesis500k: {
        price: 500000,
        btc: targetFreedom / 500000,
        timeline: '3-5 years',
      },
      thesis1m: {
        price: 1000000,
        btc: targetFreedom / 1000000,
        timeline: '5-10 years',
      },
    };

    // Safe accumulation levels accounting for volatility
    const safeLevels = {
      conservative: btcNeeded * 1.5, // 50% buffer
      moderate: btcNeeded * 1.25,    // 25% buffer
      aggressive: btcNeeded,         // Exact target
    };

    logger.info(`Freedom Mathematics calculated for $${targetFreedom.toLocaleString()}`, {
      currentBTCNeeded: `${btcNeeded.toFixed(2)} BTC`,
      conservativeTarget: `${safeLevels.conservative.toFixed(2)} BTC`,
    });

    return {
      currentPrice,
      btcNeeded,
      scenarios,
      safeLevels,
    };
  }

  /**
   * Analyze institutional adoption trends
   */
  async analyzeInstitutionalTrends(): Promise<{
    corporateAdoption: string[];
    bankingIntegration: string[];
    etfMetrics: { [key: string]: any };
    sovereignActivity: string[];
    adoptionScore: number; // 0-100 scale
  }> {
    // This would ideally fetch from institutional adoption APIs
    // For now, return curated analysis based on known trends
    
    const analysis = {
      corporateAdoption: [
        'MicroStrategy: $21B+ BTC treasury position',
        'Tesla: 11,509 BTC corporate holding',
        'Block (Square): Bitcoin-focused business model',
        'Marathon Digital: Mining infrastructure',
        'Tesla payments integration pilot programs',
      ],
      bankingIntegration: [
        'JPMorgan: Bitcoin exposure through ETFs',
        'Goldman Sachs: Bitcoin derivatives trading',
        'Bank of New York Mellon: Crypto custody',
        'Morgan Stanley: Bitcoin investment access',
        'Wells Fargo: Crypto research and analysis',
      ],
      etfMetrics: {
        totalAUM: '$50B+ across Bitcoin ETFs',
        dailyVolume: '$2B+ average trading volume',
        institutionalShare: '70%+ of ETF holdings',
        flowTrend: 'Consistent net inflows 2024',
      },
      sovereignActivity: [
        'El Salvador: 2,500+ BTC national reserve',
        'U.S.: Strategic Bitcoin Reserve discussions',
        'Germany: Bitcoin legal tender consideration',
        'Singapore: Crypto-friendly regulatory framework',
        'Switzerland: Bitcoin tax optimization laws',
      ],
      adoptionScore: 75, // Based on current institutional momentum
    };

    logger.info('Institutional adoption analysis complete', {
      adoptionScore: `${analysis.adoptionScore}/100`,
      corporateCount: analysis.corporateAdoption.length,
      bankingCount: analysis.bankingIntegration.length,
    });

    return analysis;
  }
}

/**
 * Simple in-memory cache for providers
 */
class ProviderCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance for providers
const providerCache = new ProviderCache();

/**
 * Logging utilities with correlation IDs and performance tracking
 */
class LoggerWithContext {
  constructor(private correlationId: string, private component: string) {}

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [${this.component}] [${this.correlationId}] ${message}${logData}`;
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
 * Performance monitoring utility
 */
class PerformanceTracker {
  private startTime: number;
  private logger: LoggerWithContext;

  constructor(logger: LoggerWithContext, private operation: string) {
    this.logger = logger;
    this.startTime = Date.now();
    this.logger.debug(`Starting operation: ${operation}`);
  }

  finish(success: boolean = true, additionalData?: any) {
    const duration = Date.now() - this.startTime;
    const status = success ? 'SUCCESS' : 'FAILURE';
    this.logger.info(`Operation ${this.operation} completed`, {
      status,
      duration_ms: duration,
      ...additionalData
    });
    return duration;
  }
}

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return `btc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Bitcoin Plugin
 * Main plugin that integrates all Bitcoin-related functionality
 */
const bitcoinPlugin: Plugin = {
  name: 'bitcoin-ltl',
  description: 'Bitcoin-native AI agent plugin for LiveTheLifeTV - provides Bitcoin market data, thesis tracking, and sovereign living insights',
  

  config: {
    EXAMPLE_PLUGIN_VARIABLE: process.env.EXAMPLE_PLUGIN_VARIABLE,
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    LUMA_API_KEY: process.env.LUMA_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },

  async init(config: Record<string, string>) {
    logger.info('🟠 Initializing Bitcoin Plugin');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }

      logger.info('🟠 Bitcoin Plugin initialized successfully');
      logger.info('🎯 Tracking: 100K BTC Holders → $10M Net Worth Thesis');
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid Bitcoin plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },

  providers: [helloWorldProvider, bitcoinPriceProvider, bitcoinThesisProvider, institutionalAdoptionProvider, altcoinBTCPerformanceProvider],
  actions: [
    helloWorldAction,
    bitcoinAnalysisAction, 
    bitcoinThesisStatusAction, 
    resetMemoryAction, 
    checkMemoryHealthAction, 
    validateEnvironmentAction,
    sovereignLivingAction,
    investmentStrategyAction,
    freedomMathematicsAction,
    altcoinBTCPerformanceAction,
    morningBriefingAction
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params: any) => {
        const { message, runtime } = params;
        
        // Intelligent Bitcoin mention detection
        if (message.content.text.toLowerCase().includes('bitcoin') || 
            message.content.text.toLowerCase().includes('btc') ||
            message.content.text.toLowerCase().includes('satoshi')) {
          
          logger.info('Bitcoin-related message detected, enriching context', {
            messageId: message.id,
            containsBitcoin: message.content.text.toLowerCase().includes('bitcoin'),
            containsBTC: message.content.text.toLowerCase().includes('btc'),
            containsSatoshi: message.content.text.toLowerCase().includes('satoshi')
          });
          
          // Pre-fetch Bitcoin context for faster response
          try {
            const bitcoinService = runtime.getService('bitcoin-data');
            if (bitcoinService) {
              const [price, thesisData] = await Promise.all([
                bitcoinService.getBitcoinPrice(),
                bitcoinService.calculateThesisMetrics(100000) // Use current estimate
              ]);
              
              // Store context in runtime state for providers to use
              runtime.bitcoinContext = {
                price,
                thesisData,
                lastUpdated: new Date().toISOString()
              };
              
              logger.info('Bitcoin context pre-loaded', { price, thesisProgress: thesisData.progressPercentage });
            }
          } catch (error) {
            logger.warn('Failed to pre-load Bitcoin context', { error: error.message });
          }
        }
      }
    ],
    ACTION_COMPLETED: [
      async (params: any) => {
        const { action, result, runtime } = params;
        
        // Log Bitcoin-specific action analytics
        if (action.name.includes('BITCOIN') || action.name.includes('THESIS')) {
          logger.info('Bitcoin action completed', {
            actionName: action.name,
            success: result.success !== false,
            executionTime: result.executionTime || 'unknown'
          });
          
          // Update thesis tracking if this was a thesis-related action
          if (action.name === 'BITCOIN_THESIS_STATUS') {
            try {
              const bitcoinService = runtime.getService('bitcoin-data');
              if (bitcoinService && result.data) {
                // Store thesis metrics for trending analysis
                runtime.thesisHistory = runtime.thesisHistory || [];
                runtime.thesisHistory.push({
                  timestamp: new Date().toISOString(),
                  progressPercentage: result.data.progressPercentage,
                  currentPrice: result.data.currentPrice,
                  holdersProgress: result.data.holdersProgress
                });
                
                // Keep only last 24 hours of data
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                runtime.thesisHistory = runtime.thesisHistory.filter(
                  entry => new Date(entry.timestamp) > yesterday
                );
                
                logger.debug('Thesis history updated', { 
                  historyLength: runtime.thesisHistory.length 
                });
              }
            } catch (error) {
              logger.warn('Failed to update thesis history', { error: error.message });
            }
          }
        }
      }
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params: any) => {
        const { message, runtime } = params;
        
        logger.info('Voice message received - Bitcoin context available', {
          messageId: message.id,
          hasBitcoinContext: !!runtime.bitcoinContext
        });
        
        // Voice messages about Bitcoin should get priority processing
        if (message.content.text.toLowerCase().includes('bitcoin')) {
          logger.info('Bitcoin-related voice message detected');
          
          // Mark for priority Bitcoin processing
          message.bitcoinPriority = true;
        }
      }
    ],
    WORLD_CONNECTED: [
      async (params: any) => {
        const { world, runtime } = params;
        
        logger.info('Connected to world - initializing Bitcoin context', {
          worldId: world.id,
          worldName: world.name || 'Unknown'
        });
        
        // Initialize Bitcoin context for the world
        try {
          const bitcoinService = runtime.getService('bitcoin-data');
          if (bitcoinService) {
            // Pre-load essential Bitcoin data for the world
            const currentPrice = await bitcoinService.getBitcoinPrice();
            const thesisMetrics = await bitcoinService.calculateThesisMetrics(currentPrice);
            
            // Store world-specific Bitcoin context
            runtime.worldBitcoinContext = runtime.worldBitcoinContext || {};
            runtime.worldBitcoinContext[world.id] = {
              price: currentPrice,
              thesisMetrics,
              connectedAt: new Date().toISOString()
            };
            
            logger.info('Bitcoin context initialized for world', {
              worldId: world.id,
              price: currentPrice,
              thesisProgress: thesisMetrics.progressPercentage
            });
          }
        } catch (error) {
          logger.warn('Failed to initialize Bitcoin context for world', { 
            worldId: world.id, 
            error: error.message 
          });
        }
      }
    ],
    WORLD_JOINED: [
      async (params: any) => {
        const { world, runtime } = params;
        
        logger.info('Joined world - Bitcoin agent ready', {
          worldId: world.id,
          worldName: world.name || 'Unknown'
        });
        
        // Send a Bitcoin thesis introduction if this is a new world
        if (world.isNew || !runtime.worldBitcoinContext?.[world.id]) {
          logger.info('New world detected - preparing Bitcoin introduction');
          
          try {
            const bitcoinService = runtime.getService('bitcoin-data');
            if (bitcoinService) {
              const currentPrice = await bitcoinService.getBitcoinPrice();
              const thesisMetrics = await bitcoinService.calculateThesisMetrics(currentPrice);
              
              // Queue an introduction message about the Bitcoin thesis
              runtime.queueMessage = runtime.queueMessage || [];
              runtime.queueMessage.push({
                type: 'introduction',
                content: `🟠 Bitcoin Agent Online | Current BTC: $${currentPrice.toLocaleString()} | Thesis Progress: ${thesisMetrics.progressPercentage.toFixed(1)}% toward $1M | ${thesisMetrics.estimatedHolders.toLocaleString()} of 100K holders target`,
                worldId: world.id,
                scheduledFor: new Date(Date.now() + 2000) // 2 second delay
              });
              
              logger.info('Bitcoin introduction queued for world', { worldId: world.id });
            }
          } catch (error) {
            logger.warn('Failed to queue Bitcoin introduction', { 
              worldId: world.id, 
              error: error.message 
            });
          }
        }
      }
    ],
  },
  models: {
    [ModelType.TEXT_SMALL]: async (runtime: IAgentRuntime, params: GenerateTextParams): Promise<string> => {
      // Enhanced Bitcoin-focused prompt engineering for quick responses
      const bitcoinContext = (runtime as any).bitcoinContext;
      
      let enhancedPrompt = params.prompt;
      
      if (bitcoinContext) {
        enhancedPrompt = `
Current Bitcoin Context:
- Price: $${bitcoinContext.price.toLocaleString()}
- Thesis Progress: ${bitcoinContext.thesisData.progressPercentage.toFixed(1)}% toward $1M target
- Estimated Holders: ${bitcoinContext.thesisData.estimatedHolders.toLocaleString()}/100K target

${params.prompt}

Respond as a Bitcoin-maximalist AI with concise, factual insights focused on:
- Austrian economics principles
- Bitcoin's monetary properties
- Long-term wealth preservation
- Cypherpunk philosophy
Keep response under 100 words.`;
      }
      
      // Use the default runtime model with enhanced prompt
      return await runtime.useModel(ModelType.TEXT_SMALL, {
        ...params,
        prompt: enhancedPrompt
      });
    },
    [ModelType.TEXT_LARGE]: async (runtime: IAgentRuntime, params: GenerateTextParams): Promise<string> => {
      // Enhanced Bitcoin-focused prompt engineering for detailed responses
      const bitcoinContext = (runtime as any).bitcoinContext;
      const thesisHistory = (runtime as any).thesisHistory || [];
      
      let enhancedPrompt = params.prompt;
      
      if (bitcoinContext) {
        const trendAnalysis = thesisHistory.length > 0 ? 
          `Recent thesis trend: ${thesisHistory.map(h => h.progressPercentage.toFixed(1)).join('% → ')}%` : 
          'No recent trend data available';
          
        enhancedPrompt = `
## Bitcoin Agent Context ##

Current Market Data:
- Bitcoin Price: $${bitcoinContext.price.toLocaleString()}
- Market Cap: ~$${(bitcoinContext.price * 19.7e6 / 1e12).toFixed(2)}T
- Thesis Progress: ${bitcoinContext.thesisData.progressPercentage.toFixed(1)}% toward $1M target
- Holders Estimate: ${bitcoinContext.thesisData.estimatedHolders.toLocaleString()}/100K target
- Required CAGR: ${bitcoinContext.thesisData.requiredCAGR.fiveYear.toFixed(1)}% (5yr) | ${bitcoinContext.thesisData.requiredCAGR.tenYear.toFixed(1)}% (10yr)
- Trend Analysis: ${trendAnalysis}

Key Catalysts:
${bitcoinContext.thesisData.catalysts.map(c => `- ${c}`).join('\n')}

## User Query ##
${params.prompt}

## Response Guidelines ##
You are a Bitcoin-maximalist AI with deep expertise in:

**Economic Philosophy:**
- Austrian economics and sound money principles
- Fiat currency criticism and monetary debasement
- Bitcoin as the ultimate store of value and medium of exchange

**Technical Understanding:**
- Bitcoin's decentralized architecture and security model
- Lightning Network for payments scalability
- Mining economics and network security

**Investment Thesis:**
- 100K BTC Holders → $10M Net Worth thesis tracking
- Long-term wealth preservation strategy
- Corporate treasury adoption trends

**Communication Style:**
- Confident but not dogmatic
- Data-driven insights with specific metrics
- Focus on educational value and actionable advice
- Use 🟠 Bitcoin emoji appropriately
- Reference current market context when relevant

Provide comprehensive, nuanced analysis while maintaining Bitcoin-maximalist perspective.`;
      }
      
      // Use the default runtime model with enhanced prompt
      return await runtime.useModel(ModelType.TEXT_LARGE, {
        ...params,
        prompt: enhancedPrompt
      });
    },
    [ModelType.TEXT_EMBEDDING]: async (runtime: IAgentRuntime, params: GenerateTextParams): Promise<string> => {
      // Enhanced embeddings for Bitcoin-related content
      const bitcoinTerms = [
        'bitcoin', 'btc', 'satoshi', 'blockchain', 'cryptocurrency',
        'halving', 'mining', 'hodl', 'lightning', 'decentralized',
        'sound money', 'store of value', 'digital gold', 'peer to peer',
        'trustless', 'permissionless', 'censorship resistant', 'sovereign',
        'self custody', 'not your keys', 'austrian economics', 'fiat',
        'monetary policy', 'inflation hedge', 'scarce asset', 'deflation',
        'network effect', 'lindy effect', 'orange pill', 'toxic maximalist'
      ];
      
      let enhancedText = params.prompt;
      
      // Check if this is Bitcoin-related content
      const isBitcoinContent = bitcoinTerms.some(term => 
        params.prompt.toLowerCase().includes(term)
      );
      
      if (isBitcoinContent) {
        // Add Bitcoin semantic context for better embeddings
        enhancedText = `Bitcoin cryptocurrency digital money ${params.prompt}`;
      }
      
      // Use the default runtime embedding model
      return await runtime.useModel(ModelType.TEXT_EMBEDDING, {
        ...params,
        prompt: enhancedText
      });
    },
  },
  routes: [
    {
      path: '/bitcoin/price',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('bitcoin-data') as StarterService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Bitcoin data service not available'
            });
          }
          
          const data = await service.getEnhancedMarketData();
          
          res.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
            source: 'bitcoin-ltl-plugin'
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/thesis',
      type: 'GET', 
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('bitcoin-data') as StarterService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Bitcoin data service not available'
            });
          }
          
          const currentPrice = await service.getBitcoinPrice();
          const thesis = await service.calculateThesisMetrics(currentPrice);
          
          // Include historical trend if available
          const thesisHistory = (runtime as any).thesisHistory || [];
          const trend = thesisHistory.length > 1 ? {
            trend: 'available',
            dataPoints: thesisHistory.length,
            latest: thesisHistory[thesisHistory.length - 1],
            previous: thesisHistory[thesisHistory.length - 2]
          } : { trend: 'insufficient_data' };
          
          res.json({
            success: true,
            data: {
              ...thesis,
              trend,
              lastUpdated: new Date().toISOString()
            },
            meta: {
              plugin: 'bitcoin-ltl',
              version: '1.0.0',
              thesis: '100K BTC Holders → $10M Net Worth'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/freedom-math',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('bitcoin-data') as StarterService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Bitcoin data service not available'
            });
          }
          
          // Get target freedom amount from query params (default $10M)
          const targetFreedom = parseInt(req.query.target || '10000000');
          
          if (isNaN(targetFreedom) || targetFreedom <= 0) {
            return res.status(400).json({
              success: false,
              error: 'Invalid target amount. Must be a positive number.'
            });
          }
          
          const freedomMath = await service.calculateFreedomMathematics(targetFreedom);
          
          res.json({
            success: true,
            data: {
              ...freedomMath,
              targetFreedom: targetFreedom,
              currency: 'USD',
              methodology: 'Conservative estimates with volatility buffers'
            },
            meta: {
              plugin: 'bitcoin-ltl',
              calculation: 'freedom-mathematics',
              disclaimer: 'Not financial advice. Past performance does not guarantee future results.'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/institutional',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('bitcoin-data') as StarterService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Bitcoin data service not available'
            });
          }
          
          const analysis = await service.analyzeInstitutionalTrends();
          
          res.json({
            success: true,
            data: {
              ...analysis,
              lastUpdated: new Date().toISOString(),
              methodology: 'Curated analysis of public institutional Bitcoin adoption data'
            },
            meta: {
              plugin: 'bitcoin-ltl',
              analysis_type: 'institutional-adoption',
              score_scale: '0-100 (100 = maximum adoption)'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/health',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('bitcoin-data') as StarterService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Bitcoin data service not available',
              checks: {
                service: 'fail',
                api: 'unknown',
                cache: 'unknown'
              }
            });
          }
          
          // Perform health checks
          const checks = {
            service: 'pass',
            api: 'unknown',
            cache: 'unknown',
            memory: 'unknown'
          };
          
          try {
            // Test API connectivity
            await service.getBitcoinPrice();
            checks.api = 'pass';
          } catch (error) {
            checks.api = 'fail';
          }
          
          try {
            // Test memory health if available
            if (service.checkMemoryHealth) {
              const memoryHealth = await service.checkMemoryHealth();
              checks.memory = memoryHealth.healthy ? 'pass' : 'warn';
            }
          } catch (error) {
            checks.memory = 'fail';
          }
          
          const overallHealth = Object.values(checks).every(status => status === 'pass') ? 'healthy' : 
                               Object.values(checks).some(status => status === 'fail') ? 'unhealthy' : 'degraded';
          
          res.json({
            success: true,
            status: overallHealth,
            checks,
            meta: {
              plugin: 'bitcoin-ltl',
              version: '1.0.0',
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/comprehensive',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('real-time-data') as RealTimeDataService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Real-time data service not available'
            });
          }
          
          const comprehensiveData = service.getComprehensiveBitcoinData();
          
          if (!comprehensiveData) {
            return res.status(503).json({
              success: false,
              error: 'Comprehensive Bitcoin data not available yet. Please try again in a few moments.',
              hint: 'Data is refreshed every minute from multiple free APIs'
            });
          }
          
          res.json({
            success: true,
            data: comprehensiveData,
            meta: {
              plugin: 'bitcoin-ltl',
              endpoint: 'comprehensive-bitcoin-data',
              sources: [
                'CoinGecko API (price data)',
                'Blockchain.info API (network stats)',
                'Alternative.me API (sentiment)',
                'Mempool.space API (mempool data)'
              ],
              updateInterval: '1 minute',
              disclaimer: 'Data from free public APIs. Not financial advice.'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/network',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('real-time-data') as RealTimeDataService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Real-time data service not available'
            });
          }
          
          const comprehensiveData = service.getComprehensiveBitcoinData();
          
          if (!comprehensiveData) {
            return res.status(503).json({
              success: false,
              error: 'Bitcoin network data not available yet. Please try again in a few moments.'
            });
          }
          
          res.json({
            success: true,
            data: {
              network: comprehensiveData.network,
              sentiment: comprehensiveData.sentiment,
              lastUpdated: comprehensiveData.lastUpdated
            },
            meta: {
              plugin: 'bitcoin-ltl',
              endpoint: 'bitcoin-network-data',
              sources: [
                'Blockchain.info API (network stats)',
                'Alternative.me API (Fear & Greed Index)',
                'Mempool.space API (mempool & fees)'
              ],
              updateInterval: '1 minute'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/mempool',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('real-time-data') as RealTimeDataService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Real-time data service not available'
            });
          }
          
          const comprehensiveData = service.getComprehensiveBitcoinData();
          
          if (!comprehensiveData) {
            return res.status(503).json({
              success: false,
              error: 'Mempool data not available yet. Please try again in a few moments.'
            });
          }
          
          res.json({
            success: true,
            data: {
              mempoolSize: comprehensiveData.network.mempoolSize,
              mempoolTxs: comprehensiveData.network.mempoolTxs,
              mempoolFees: comprehensiveData.network.mempoolFees,
              miningRevenue: comprehensiveData.network.miningRevenue,
              lastUpdated: comprehensiveData.lastUpdated
            },
            meta: {
              plugin: 'bitcoin-ltl',
              endpoint: 'bitcoin-mempool-data',
              source: 'Mempool.space API',
              updateInterval: '1 minute',
              description: 'Real-time Bitcoin mempool statistics and fee recommendations'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/bitcoin/sentiment',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService('real-time-data') as RealTimeDataService;
          if (!service) {
            return res.status(503).json({
              success: false,
              error: 'Real-time data service not available'
            });
          }
          
          const comprehensiveData = service.getComprehensiveBitcoinData();
          
          if (!comprehensiveData) {
            return res.status(503).json({
              success: false,
              error: 'Sentiment data not available yet. Please try again in a few moments.'
            });
          }
          
          res.json({
            success: true,
            data: {
              sentiment: comprehensiveData.sentiment,
              price: comprehensiveData.price,
              lastUpdated: comprehensiveData.lastUpdated
            },
            meta: {
              plugin: 'bitcoin-ltl',
              endpoint: 'bitcoin-sentiment-data',
              source: 'Alternative.me Fear & Greed Index',
              updateInterval: '1 minute',
              description: 'Bitcoin market sentiment analysis'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      },
    },
    {
      path: '/helloworld',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        res.json({
          message: 'Hello World from Bitcoin LTL Plugin!',
          plugin: 'bitcoin-ltl',
          version: '1.0.0',
          endpoints: [
            '/bitcoin/price',
            '/bitcoin/thesis',
            '/bitcoin/freedom-math',
            '/bitcoin/institutional',
            '/bitcoin/health',
            '/bitcoin/comprehensive',
            '/bitcoin/network',
            '/bitcoin/mempool',
            '/bitcoin/sentiment'
          ]
        });
      },
    },
  ],
  services: [
    BitcoinDataService, 
    SlackIngestionService, 
    MorningBriefingService,
    KnowledgeDigestService,
    OpportunityAlertService,
    PerformanceTrackingService,
    SchedulerService,
    RealTimeDataService
  ],
  tests: [bitcoinTestSuite],
};

export default bitcoinPlugin;
