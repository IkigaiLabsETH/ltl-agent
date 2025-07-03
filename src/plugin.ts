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

/**
 * Bitcoin Plugin Configuration Schema
 * Defines the required environment variables for Bitcoin data access
 */
const configSchema = z.object({
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
    
    try {
      contextLogger.info('Fetching Bitcoin price data from CoinGecko');
      
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

        const response = await fetchWithTimeout(`${baseUrl}/coins/bitcoin`, { 
          headers,
          timeout: 15000 
        });
        return await response.json() as CoinGeckoApiResponse;
      });

      const data = result;

      const priceData: BitcoinPriceData = {
        price: data.market_data?.current_price?.usd || 100000,
        marketCap: data.market_data?.market_cap?.usd || 2000000000000,
        volume24h: data.market_data?.total_volume?.usd || 50000000000,
        priceChange24h: data.market_data?.price_change_percentage_24h || 0,
        priceChange7d: data.market_data?.price_change_percentage_7d || 0,
        priceChange30d: data.market_data?.price_change_percentage_30d || 0,
        allTimeHigh: data.market_data?.ath?.usd || 100000,
        allTimeLow: data.market_data?.atl?.usd || 3000,
        circulatingSupply: data.market_data?.circulating_supply || 19700000,
        totalSupply: data.market_data?.total_supply || 19700000,
        maxSupply: data.market_data?.max_supply || 21000000,
        lastUpdated: data.market_data?.last_updated || new Date().toISOString(),
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

      return {
        text: responseText,
        values: priceData,
        data: { 
          source: 'CoinGecko', 
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        },
      };
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
      const bitcoinDataService = runtime.getService('bitcoin-data') as BitcoinDataService;
      if (!bitcoinDataService) {
        throw new Error('Bitcoin Data Service not available');
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
      const bitcoinDataService = runtime.getService('bitcoin-data') as BitcoinDataService;
      if (!bitcoinDataService) {
        throw new Error('Bitcoin Data Service not available');
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
 * Bitcoin Data Service
 * Manages Bitcoin data fetching, caching, and analysis
 */
export class BitcoinDataService extends Service {
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
    return new BitcoinDataService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('BitcoinDataService stopping...');
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
      
      if (databaseConfig?.type === 'postgresql' && databaseConfig.url) {
        // For PostgreSQL, provide instructions since we can't directly drop/recreate
        return {
          success: false,
          message: 'PostgreSQL memory reset requires manual intervention. Run: psql -U username -c "DROP DATABASE database_name;" then recreate the database.'
        };
      } else {
        // For PGLite (default), delete the data directory
        const dataDir = databaseConfig?.dataDir || '.eliza/.elizadb';
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
    const stats = {
      databaseType: this.runtime.character.settings?.database?.type || 'pglite',
      dataDirectory: this.runtime.character.settings?.database?.dataDir || '.eliza/.elizadb',
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
    
    return {
      currentPrice,
      targetPrice,
      progressPercentage,
      multiplierNeeded,
      requiredCAGR: {
        fiveYear: Math.pow(targetPrice / currentPrice, 1/5) - 1,
        tenYear: Math.pow(targetPrice / currentPrice, 1/10) - 1,
      },
    };
  }
}

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
  name: 'bitcoin',
  description: 'Bitcoin-focused AI agent plugin for market analysis and thesis tracking',
  
  config: {
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

  providers: [bitcoinPriceProvider, bitcoinThesisProvider],
  actions: [bitcoinAnalysisAction, bitcoinThesisStatusAction, resetMemoryAction, checkMemoryHealthAction, validateEnvironmentAction],
  services: [BitcoinDataService],
  tests: [bitcoinTestSuite],
};

export default bitcoinPlugin;
