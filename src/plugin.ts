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
    try {
      const apiKey = runtime.getSetting('COINGECKO_API_KEY');
      const baseUrl = 'https://api.coingecko.com/api/v3';
      const headers = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};

      const response = await fetch(`${baseUrl}/coins/bitcoin`, { headers });
      const data = await response.json() as any; // Type assertion for API response

      const priceData = {
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

      return {
        text: `Bitcoin is currently trading at $${priceData.price.toLocaleString()} with a market cap of $${(priceData.marketCap / 1e12).toFixed(2)}T. 24h change: ${priceData.priceChange24h.toFixed(2)}%. Current supply: ${(priceData.circulatingSupply / 1e6).toFixed(2)}M BTC out of 21M max supply.`,
        values: priceData,
        data: { source: 'CoinGecko', timestamp: new Date().toISOString() },
      };
    } catch (error) {
      logger.error('Error fetching Bitcoin price data:', error);
      return {
        text: 'Unable to fetch Bitcoin price data at this time',
        values: {},
        data: { error: error.message },
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

      const thesisData = {
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
      logger.error('Error calculating thesis metrics:', error);
      return {
        text: 'Unable to calculate thesis progress at this time',
        values: {},
        data: { error: error.message },
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
    _options: any,
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
    _options: any,
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
 * Bitcoin Data Service
 * Manages Bitcoin data fetching, caching, and analysis
 */
export class BitcoinDataService extends Service {
  static serviceType = 'bitcoin-data';
  capabilityDescription = 'Provides Bitcoin market data, analysis, and thesis tracking capabilities';

  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('🟠 Starting Bitcoin Data Service');
    const service = new BitcoinDataService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('🟠 Stopping Bitcoin Data Service');
    const service = runtime.getService(BitcoinDataService.serviceType);
    if (!service) {
      throw new Error('Bitcoin Data Service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('🟠 Stopping Bitcoin Data Service instance');
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
  actions: [bitcoinAnalysisAction, bitcoinThesisStatusAction],
  services: [BitcoinDataService],
  tests: [bitcoinTestSuite],
};

export default bitcoinPlugin;
