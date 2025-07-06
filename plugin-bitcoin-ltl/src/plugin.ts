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
import bitcoinTestSuite from './tests';
import { 
  BitcoinDataService, 
  SlackIngestionService, 
  MorningBriefingService,
  KnowledgeDigestService,
  OpportunityAlertService,
  PerformanceTrackingService,
  SchedulerService,
  RealTimeDataService,
  StockDataService,
  LifestyleDataService,
  ETFDataService,
  TravelDataService,
  NFTDataService,
  AltcoinDataService,
  BitcoinNetworkDataService,
  StarterService
} from './services';
import { KnowledgePerformanceMonitor } from './services/knowledge-performance-monitor';
import { morningBriefingAction, curatedAltcoinsAction, top100VsBtcAction, btcRelativePerformanceAction, dexScreenerAction, topMoversAction, trendingCoinsAction, curatedNFTsAction, weatherAction, stockMarketAction, hotelSearchAction, hotelDealAlertAction, bookingOptimizationAction, travelInsightsAction, etfFlowAction, bitcoinPriceAction, altcoinPriceAction } from './actions';
import { allProviders } from './providers';

// Import extracted utilities and types
import { configSchema } from './config/pluginConfig';
import { 
  retryOperation, 
  fetchWithTimeout 
} from './utils/networkUtils';
import { validateElizaOSEnvironment } from './utils/environmentUtils';
import { 
  LoggerWithContext, 
  PerformanceTracker, 
  generateCorrelationId 
} from './utils/loggingUtils';
import { providerCache } from './utils/cacheUtils';
import { 
  BitcoinDataError, 
  ElizaOSErrorHandler 
} from './types/errorTypes';
import { 
  CoinMarketData, 
  BitcoinPriceData, 
  BitcoinThesisData, 
  AltcoinBTCPerformance, 
  AltcoinOutperformanceData 
} from './types/marketTypes';

// Note: Providers and actions are imported from the original plugin file
// These will be extracted to separate files in the next phase

// Export error handling utilities for testing
export { ElizaOSErrorHandler, validateElizaOSEnvironment };

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

  async init(config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info('🟠 Initializing Bitcoin Plugin');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }

      logger.info('🟠 Bitcoin Plugin configuration validated successfully');
      
      // Initialize all services using the ServiceFactory
      if (runtime) {
        logger.info('🔧 Initializing Bitcoin Plugin services...');
        const { ServiceFactory } = await import('./services/ServiceFactory');
        await ServiceFactory.initializeServices(runtime, validatedConfig);
        logger.info('✅ Bitcoin Plugin services initialized successfully');
      } else {
        logger.warn('⚠️ Runtime not provided to init - services will be initialized later');
      }

      logger.info('🟠 Bitcoin Plugin initialized successfully');
      logger.info('🎯 Tracking: 100K BTC Holders → $10M Net Worth Thesis');
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new Error(
          `Invalid Bitcoin plugin configuration: ${error.message}`
        );
      }
      logger.error('❌ Failed to initialize Bitcoin Plugin:', error);
      throw error;
    }
  },

  providers: [
    helloWorldProvider,
    bitcoinPriceProvider,
    bitcoinThesisProvider,
    institutionalAdoptionProvider,
    altcoinBTCPerformanceProvider,
    ...allProviders
  ],
  
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
    cryptoPriceLookupAction,
    morningBriefingAction,
    curatedAltcoinsAction,
    top100VsBtcAction,
    btcRelativePerformanceAction,
    dexScreenerAction,
    topMoversAction,
    trendingCoinsAction,
    curatedNFTsAction,
    weatherAction,
    stockMarketAction,
    etfFlowAction,
    // Travel & Booking Actions
    hotelSearchAction,
    hotelDealAlertAction,
    bookingOptimizationAction,
    travelInsightsAction,
    bitcoinPriceAction,
    altcoinPriceAction
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
            const bitcoinService = runtime.getService('bitcoin-data') as StarterService;
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
              const bitcoinService = runtime.getService('bitcoin-data') as StarterService;
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
          const bitcoinService = runtime.getService('bitcoin-data') as StarterService;
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
            const bitcoinService = runtime.getService('bitcoin-data') as StarterService;
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
          `Recent thesis trend: ${thesisHistory.map((h: any) => h.progressPercentage.toFixed(1)).join('% → ')}%` : 
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
${bitcoinContext.thesisData.catalysts.map((c: string) => `- ${c}`).join('\n')}

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
            error: error instanceof Error ? error.message : 'Unknown error',
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
            error: error instanceof Error ? error.message : 'Unknown error',
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
            error: error instanceof Error ? error.message : 'Unknown error',
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
            error: error instanceof Error ? error.message : 'Unknown error',
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
            error: error instanceof Error ? error.message : 'Unknown error',
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
            '/services/health'
          ]
        });
      },
    },
    {
      path: '/services/health',
      type: 'GET',
      handler: async (req: any, res: any, runtime: IAgentRuntime) => {
        try {
          const { ServiceFactory } = await import('./services/ServiceFactory');
          const healthCheck = await ServiceFactory.healthCheck();
          
          res.json({
            success: true,
            plugin: 'bitcoin-ltl',
            timestamp: new Date().toISOString(),
            services: {
              healthy: healthCheck.healthy,
              total: Object.keys(healthCheck.services).length,
              details: healthCheck.services
            },
            meta: {
              description: 'Health status of all Bitcoin LTL plugin services',
              endpoint: 'services-health'
            }
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            plugin: 'bitcoin-ltl',
            timestamp: new Date().toISOString()
          });
        }
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
    RealTimeDataService,
    StockDataService,
    LifestyleDataService,
    ETFDataService,
    TravelDataService,
    NFTDataService,
    AltcoinDataService,
    BitcoinNetworkDataService,
    KnowledgePerformanceMonitor,
    StarterService
  ],
  
  tests: [bitcoinTestSuite],
};

export default bitcoinPlugin; 