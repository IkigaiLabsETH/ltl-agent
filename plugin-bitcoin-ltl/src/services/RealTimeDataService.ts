import { IAgentRuntime, Service, logger } from '@elizaos/core';
import axios from 'axios';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdate: Date;
  source: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  keywords: string[];
}

export interface SocialSentiment {
  platform: string;
  symbol: string;
  sentiment: number; // -1 to 1
  mentions: number;
  timestamp: Date;
  trendingKeywords: string[];
}

export interface EconomicIndicator {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  unit: string;
  releaseDate: Date;
  nextRelease: Date;
}

export interface MarketAlert {
  id: string;
  type: 'price_threshold' | 'volume_spike' | 'news_sentiment' | 'technical_indicator';
  symbol: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data: any;
}

export interface BitcoinNetworkData {
  hashRate: number | null;
  difficulty: number | null;
  blockHeight: number | null;
  avgBlockTime: number | null;
  avgBlockSize: number | null;
  totalBTC: number | null;
  marketCap: number | null;
  nextHalving: {
    blocks: number | null;
    estimatedDate: string | null;
  };
  mempoolSize: number | null;
  mempoolFees: {
    fastestFee: number | null;
    halfHourFee: number | null;
    economyFee: number | null;
  };
  mempoolTxs: number | null;
  miningRevenue: number | null;
  miningRevenue24h: number | null;
  lightningCapacity: number | null;
  lightningChannels: number | null;
  liquidity: number | null;
}

export interface BitcoinSentimentData {
  fearGreedIndex: number | null;
  fearGreedValue: string | null;
}

export interface BitcoinNodesData {
  total: number | null;
  countries: number | null;
}

export interface ComprehensiveBitcoinData {
  price: {
    usd: number | null;
    change24h: number | null;
  };
  network: BitcoinNetworkData;
  sentiment: BitcoinSentimentData;
  nodes: BitcoinNodesData;
  lastUpdated: Date;
}

export interface CuratedCoinData {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export interface CuratedAltcoinsData {
  [coinId: string]: CuratedCoinData;
}

export interface CuratedAltcoinsCache {
  data: CuratedAltcoinsData;
  timestamp: number;
}

export interface Top100VsBtcCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
}

export interface Top100VsBtcData {
  outperforming: Top100VsBtcCoin[];
  underperforming: Top100VsBtcCoin[];
  totalCoins: number;
  outperformingCount: number;
  underperformingCount: number;
  averagePerformance: number;
  topPerformers: Top100VsBtcCoin[];
  worstPerformers: Top100VsBtcCoin[];
  lastUpdated: Date;
}

export interface Top100VsBtcCache {
  data: Top100VsBtcData;
  timestamp: number;
}

export interface BoostedToken {
  tokenAddress: string;
  chainId: string;
  icon?: string;
  label?: string;
  symbol?: string;
}

export interface DexScreenerPool {
  liquidity?: { usd?: string | number };
  volume?: { h24?: string | number };
  priceUsd?: string;
  marketCap?: string | number;
  info?: { imageUrl?: string };
}

export interface TrendingToken {
  address: string;
  chainId: string;
  image: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  marketCap: number | null;
  totalLiquidity: number;
  totalVolume: number;
  poolsCount: number;
  liquidityRatio: number | null;
}

export interface DexScreenerData {
  topTokens: BoostedToken[];
  trendingTokens: TrendingToken[];
  lastUpdated: Date;
}

export interface DexScreenerCache {
  data: DexScreenerData;
  timestamp: number;
}

export interface TopMoverCoin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

export interface TopMoversData {
  topGainers: TopMoverCoin[];
  topLosers: TopMoverCoin[];
  lastUpdated: Date;
}

export interface TopMoversCache {
  data: TopMoversData;
  timestamp: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  score: number;
}

export interface CoinGeckoTrendingItem {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    score: number;
  };
}

export interface TrendingCoinsData {
  coins: TrendingCoin[];
  lastUpdated: Date;
}

export interface TrendingCoinsCache {
  data: TrendingCoinsData;
  timestamp: number;
}

export interface NFTCollectionStats {
  total_supply: number;
  num_owners: number;
  average_price: number;
  floor_price: number;
  market_cap: number;
  one_day_volume: number;
  one_day_change: number;
  one_day_sales: number;
  seven_day_volume: number;
  seven_day_change: number;
  seven_day_sales: number;
  thirty_day_volume: number;
  thirty_day_change: number;
  thirty_day_sales: number;
}

export interface NFTCollection {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url: string;
  owner: string;
  category: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  trait_offers_enabled: boolean;
  collection_offers_enabled: boolean;
  opensea_url: string;
  project_url: string;
  wiki_url: string;
  discord_url: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: string;
  contracts: Array<{
    address: string;
    chain: string;
  }>;
  editors: string[];
  fees: Array<{
    fee: number;
    recipient: string;
    required: boolean;
  }>;
  rarity: {
    strategy_id: string;
    strategy_version: string;
    rank_at: string;
    max_rank: number;
    tokens_scored: number;
  };
  total_supply: number;
  created_date: string;
}

export interface NFTCollectionData {
  slug: string;
  collection: NFTCollection;
  stats: NFTCollectionStats;
  lastUpdated: Date;
  category: 'blue-chip' | 'generative-art' | 'digital-art' | 'pfp' | 'utility';
  floorItems?: NFTFloorItem[];
  recentSales?: NFTSaleEvent[];
  contractAddress?: string;
  blockchain?: string;
}

export interface NFTFloorItem {
  token_id: string;
  name: string;
  image_url: string;
  price_eth: number;
  price_usd: number;
  rarity_rank?: number;
  listing_time: string;
  opensea_url: string;
}

export interface NFTSaleEvent {
  token_id: string;
  name: string;
  image_url: string;
  price_eth: number;
  price_usd: number;
  buyer: string;
  seller: string;
  transaction_hash: string;
  timestamp: string;
  event_type: 'sale' | 'transfer' | 'mint';
}

export interface NFTTraitFloor {
  trait_type: string;
  trait_value: string;
  floor_price: number;
  count: number;
}

export interface CuratedNFTsData {
  collections: NFTCollectionData[];
  summary: {
    totalVolume24h: number;
    totalMarketCap: number;
    avgFloorPrice: number;
    topPerformers: NFTCollectionData[];
    worstPerformers: NFTCollectionData[];
    totalCollections: number;
  };
  lastUpdated: Date;
}

export interface CuratedNFTsCache {
  data: CuratedNFTsData;
  timestamp: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    wind_speed_10m?: string;
    wind_direction_10m?: string;
  };
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    wind_speed_10m?: (number | null)[];
    wind_direction_10m?: (number | null)[];
  };
  current?: {
    time: string;
    interval: number;
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
}

export interface MarineData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  current_units: {
    time: string;
    wave_height: string;
    wave_direction: string;
    wave_period: string;
    sea_surface_temperature: string;
  };
  current: {
    time: string;
    wave_height: number;
    wave_direction: number;
    wave_period: number;
    sea_surface_temperature: number;
  };
}

export interface AirQualityData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    pm10: string;
    pm2_5: string;
    uv_index: string;
    uv_index_clear_sky: string;
  };
  current: {
    time: string;
    pm10: number;
    pm2_5: number;
    uv_index: number;
    uv_index_clear_sky: number;
  };
}

export interface CityWeatherData {
  city: string;
  displayName: string;
  weather: WeatherData;
  marine?: MarineData;
  airQuality?: AirQualityData;
  lastUpdated: Date;
}

export interface ComprehensiveWeatherData {
  cities: CityWeatherData[];
  summary: {
    bestWeatherCity: string;
    bestSurfConditions: string | null;
    averageTemp: number;
    windConditions: 'calm' | 'breezy' | 'windy' | 'stormy';
    uvRisk: 'low' | 'moderate' | 'high' | 'very-high';
    airQuality: 'excellent' | 'good' | 'moderate' | 'poor';
  };
  lastUpdated: Date;
}

export interface WeatherCache {
  data: ComprehensiveWeatherData;
  timestamp: number;
}

export class RealTimeDataService extends Service {
  static serviceType = 'real-time-data';
  capabilityDescription = 'Provides real-time market data, news feeds, and social sentiment analysis';
  
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 300000; // 5 minutes (increased from 1 minute)
  private readonly symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'ADA', '4337', '8958']; // Include MetaPlanet (4337) and Hyperliquid (8958)
  
  // Rate limiting properties
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private backoffUntil = 0;
  
  // API endpoints
  private readonly BLOCKCHAIN_API = 'https://api.blockchain.info';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly ALTERNATIVE_API = 'https://api.alternative.me';
  private readonly MEMPOOL_API = 'https://mempool.space/api';
  private readonly DEXSCREENER_API = 'https://api.dexscreener.com';
  
  // Curated altcoins list (matching LiveTheLifeTV website)
  private readonly curatedCoinIds = [
    'ethereum',
    'chainlink',
    'uniswap',
    'aave',
    'ondo-finance', 
    'ethena', 
    'solana',
    'sui',
    'hyperliquid', 
    'berachain-bera', 
    'infrafred-bgt', 
    'avalanche-2',
    'blockstack',
    'dogecoin',
    'pepe',
    'mog-coin',
    'bittensor',
    'render-token',
    'fartcoin',
    'railgun'
  ];
  
  // Data storage
  private marketData: MarketData[] = [];
  private newsItems: NewsItem[] = [];
  private socialSentiment: SocialSentiment[] = [];
  private economicIndicators: EconomicIndicator[] = [];
  private alerts: MarketAlert[] = [];
  private comprehensiveBitcoinData: ComprehensiveBitcoinData | null = null;
  private curatedAltcoinsCache: CuratedAltcoinsCache | null = null;
  private readonly CURATED_CACHE_DURATION = 60 * 1000; // 1 minute
  private top100VsBtcCache: Top100VsBtcCache | null = null;
  private readonly TOP100_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (matches website revalidation)
  private dexScreenerCache: DexScreenerCache | null = null;
  private readonly DEXSCREENER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for trending data
  private topMoversCache: TopMoversCache | null = null;
  private readonly TOP_MOVERS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website)
  private trendingCoinsCache: TrendingCoinsCache | null = null;
  private readonly TRENDING_COINS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website)
  private curatedNFTsCache: CuratedNFTsCache | null = null;
  private readonly CURATED_NFTS_CACHE_DURATION = 60 * 1000; // 1 minute (matches website caching)
  private weatherCache: WeatherCache | null = null;
  private readonly WEATHER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (matches website)

  // Curated European lifestyle cities
  private readonly weatherCities = {
    biarritz: { 
      lat: 43.4833, 
      lon: -1.5586, 
      displayName: 'Biarritz',
      description: 'French Basque coast, surfing paradise'
    },
    bordeaux: { 
      lat: 44.8378, 
      lon: -0.5792, 
      displayName: 'Bordeaux',
      description: 'Wine capital, luxury living'
    },
    monaco: { 
      lat: 43.7384, 
      lon: 7.4246, 
      displayName: 'Monaco',
      description: 'Tax haven, Mediterranean luxury'
    }
  };

  // Curated NFT collections (high-end digital art and OG collections)
  private readonly curatedNFTCollections = [
    { slug: 'fidenza-by-tyler-hobbs', category: 'generative-art' as const },
    { slug: 'cryptopunks', category: 'blue-chip' as const },
    { slug: '0xdgb-thecameras', category: 'digital-art' as const },
    { slug: 'the-harvest-by-per-kristian-stoveland', category: 'generative-art' as const },
    { slug: 'terraforms', category: 'generative-art' as const },
    { slug: 'xcopy-knownorigin', category: 'digital-art' as const },
    { slug: 'winds-of-yawanawa', category: 'digital-art' as const },
    { slug: 'meridian-by-matt-deslauriers', category: 'generative-art' as const },
    { slug: 'ackcolorstudy', category: 'generative-art' as const },
    { slug: 'vera-molnar-themes-and-variations', category: 'generative-art' as const },
    { slug: 'sightseers-by-norman-harman', category: 'generative-art' as const },
    { slug: 'progression-by-jeff-davis', category: 'generative-art' as const },
    { slug: 'risk-reward-by-kjetil-golid', category: 'generative-art' as const },
    { slug: 'brokenkeys', category: 'digital-art' as const },
    { slug: 'aligndraw', category: 'generative-art' as const },
    { slug: 'archetype-by-kjetil-golid', category: 'generative-art' as const },
    { slug: 'ripcache', category: 'digital-art' as const },
    { slug: 'qql', category: 'generative-art' as const },
    { slug: 'human-unreadable-by-operator', category: 'digital-art' as const },
    { slug: 'jaknfthoodies', category: 'pfp' as const },
    { slug: 'non-either-by-rafael-rozendaal', category: 'digital-art' as const },
    { slug: 'orbifold-by-kjetil-golid', category: 'generative-art' as const },
    { slug: 'pop-wonder-editions', category: 'digital-art' as const },
    { slug: 'monstersoup', category: 'pfp' as const },
    { slug: 'machine-hallucinations-coral-generative-ai-data-pa', category: 'digital-art' as const },
    { slug: 'getijde-by-bart-simons', category: 'generative-art' as const },
    { slug: '24-hours-of-art', category: 'digital-art' as const },
    { slug: 'pursuit-by-per-kristian-stoveland', category: 'generative-art' as const },
    { slug: '100-sunsets-by-zach-lieberman', category: 'digital-art' as const },
    { slug: 'strands-of-solitude', category: 'generative-art' as const },
    { slug: 'justinaversano-gabbagallery', category: 'digital-art' as const },
    { slug: 'neural-sediments-by-eko33', category: 'generative-art' as const },
    { slug: 'wavyscape-by-holger-lippmann', category: 'generative-art' as const },
    { slug: 'opepen-edition', category: 'pfp' as const },
    { slug: 'mind-the-gap-by-mountvitruvius', category: 'generative-art' as const },
    { slug: 'urban-transportation-red-trucks', category: 'digital-art' as const },
    { slug: 'trichro-matic-by-mountvitruvius', category: 'generative-art' as const },
    { slug: 'sam-spratt-masks-of-luci', category: 'digital-art' as const },
    { slug: 'pink-such-a-useless-color-by-simon-raion', category: 'digital-art' as const },
    { slug: 'sketchbook-a-by-william-mapan-1', category: 'generative-art' as const },
    { slug: 'life-and-love-and-nothing-by-nat-sarkissian', category: 'digital-art' as const },
    { slug: 'highrises', category: 'digital-art' as const },
    { slug: 'lifeguard-towers-miami', category: 'digital-art' as const },
    { slug: 'stranger-together-by-brooke-didonato-ben-zank', category: 'digital-art' as const },
    { slug: 'the-vault-of-wonders-chapter-1-the-abyssal-unseen', category: 'digital-art' as const },
    { slug: 'skulptuur-by-piter-pasma', category: 'generative-art' as const },
    { slug: 'dataland-biomelumina', category: 'generative-art' as const },
    { slug: 'pop-wonder-superrare', category: 'digital-art' as const },
    { slug: 'cryptodickbutts', category: 'pfp' as const },
    { slug: 'day-gardens', category: 'generative-art' as const },
    { slug: 'cryptoadz-by-gremplin', category: 'pfp' as const },
    { slug: 'izanami-islands-by-richard-nadler', category: 'digital-art' as const },
    { slug: 'yamabushi-s-horizons-by-richard-nadler', category: 'digital-art' as const },
    { slug: 'kinoko-dreams-by-richard-nadler', category: 'digital-art' as const }
  ];

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('RealTimeDataService starting...');
    const service = new RealTimeDataService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('RealTimeDataService stopping...');
    const service = runtime.getService('real-time-data');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    logger.info('RealTimeDataService initialized');
    
    // Start real-time updates
    await this.startRealTimeUpdates();
  }

  async stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('RealTimeDataService stopped');
  }

  private async startRealTimeUpdates(): Promise<void> {
    // Initial data load
    await this.updateAllData();

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllData();
      } catch (error) {
        console.error('Error updating real-time data:', error);
      }
    }, this.UPDATE_INTERVAL);
  }

  private async updateAllData(): Promise<void> {
    try {
      console.log('[RealTimeDataService] Starting data update cycle...');
      
      // Stagger the updates to avoid overwhelming APIs
      const updateTasks = [
        () => this.updateMarketData(),
        () => this.updateBitcoinData(),
        () => this.updateNews(),
        () => this.updateSocialSentiment(),
        () => this.updateEconomicIndicators(),
        () => this.updateCuratedAltcoinsData(),
        () => this.updateTop100VsBtcData(),
        () => this.updateDexScreenerData(),
        () => this.updateTopMoversData(),
        () => this.updateTrendingCoinsData(),
        () => this.updateCuratedNFTsData(),
        () => this.updateWeatherData()
      ];

      // Execute updates with delays between them
      for (let i = 0; i < updateTasks.length; i++) {
        try {
          await updateTasks[i]();
          // Add delay between different types of updates
          if (i < updateTasks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay between update types
          }
        } catch (error) {
          console.error(`Update task ${i} failed:`, error);
        }
      }

      console.log('[RealTimeDataService] Data update cycle completed');
    } catch (error) {
      console.error('[RealTimeDataService] Error updating data:', error);
    }
  }

  private async updateMarketData(): Promise<void> {
    try {
      this.marketData = await this.fetchMarketData();
    } catch (error) {
      console.error('Error updating market data:', error);
    }
  }

  private async updateBitcoinData(): Promise<void> {
    try {
      this.comprehensiveBitcoinData = await this.fetchComprehensiveBitcoinData();
    } catch (error) {
      console.error('Error updating Bitcoin data:', error);
    }
  }

  private async updateNews(): Promise<void> {
    try {
      this.newsItems = await this.fetchNewsData();
    } catch (error) {
      console.error('Error updating news data:', error);
    }
  }

  private async updateSocialSentiment(): Promise<void> {
    try {
      this.socialSentiment = await this.fetchSocialSentiment();
    } catch (error) {
      console.error('Error updating social sentiment:', error);
    }
  }

  private async updateEconomicIndicators(): Promise<void> {
    try {
      this.economicIndicators = await this.fetchEconomicIndicators();
    } catch (error) {
      console.error('Error updating economic indicators:', error);
    }
  }

  private async fetchMarketData(): Promise<MarketData[]> {
    try {
      const coingeckoApiKey = this.runtime.getSetting('COINGECKO_API_KEY');
      const baseUrl = coingeckoApiKey 
        ? 'https://pro-api.coingecko.com/api/v3' 
        : 'https://api.coingecko.com/api/v3';

      const headers = coingeckoApiKey 
        ? { 'x-cg-pro-api-key': coingeckoApiKey }
        : {};

      // Fetch crypto data using queued request
      const cryptoIds = 'bitcoin,ethereum,solana,polygon,cardano';
      const cryptoData = await this.makeQueuedRequest(async () => {
        const params = new URLSearchParams({
          ids: cryptoIds,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
          include_24hr_vol: 'true',
          include_market_cap: 'true',
          include_last_updated_at: 'true'
        });
        const url = `${baseUrl}/simple/price?${params.toString()}`;
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers
        });
        return response;
      });

      const marketData: MarketData[] = Object.entries(cryptoData).map(([id, data]: [string, any]) => ({
        symbol: this.getSymbolFromId(id),
        price: data.usd || 0,
        change24h: data.usd_24h_change || 0,
        changePercent24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        lastUpdate: new Date(data.last_updated_at ? data.last_updated_at * 1000 : Date.now()),
        source: 'CoinGecko'
      }));

      // Fetch stock data with delay
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      const stockData = await this.fetchStockData();
      
      return [...marketData, ...stockData];
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getFallbackMarketData();
    }
  }

  private async fetchStockData(): Promise<MarketData[]> {
    try {
      // Using Alpha Vantage for stock data (free tier available)
      const alphaVantageKey = this.runtime.getSetting('ALPHA_VANTAGE_API_KEY');
      if (!alphaVantageKey) {
        return this.getFallbackStockData();
      }

      // Fetch data for major tech stocks as proxies
      const symbols = ['MSFT', 'GOOGL', 'TSLA']; // High-performing tech stocks
      const stockPromises = symbols.map(async symbol => {
        try {
          const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
              function: 'GLOBAL_QUOTE',
              symbol: symbol,
              apikey: alphaVantageKey
            },
            timeout: 10000
          });

          const quote = response.data['Global Quote'];
          return {
            symbol: symbol,
            price: parseFloat(quote['05. price']) || 0,
            change24h: parseFloat(quote['09. change']) || 0,
            changePercent24h: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
            volume24h: parseInt(quote['06. volume']) || 0,
            marketCap: 0, // Not available in basic quote
            lastUpdate: new Date(),
            source: 'Alpha Vantage'
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(stockPromises);
      return results.filter(Boolean) as MarketData[];
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.getFallbackStockData();
    }
  }

  private async fetchNewsData(): Promise<NewsItem[]> {
    try {
      const newsApiKey = this.runtime.getSetting('NEWS_API_KEY');
      if (!newsApiKey) {
        return this.getFallbackNewsData();
      }

      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'bitcoin OR cryptocurrency OR "strategic bitcoin reserve" OR "bitcoin ETF" OR blockchain',
          sortBy: 'publishedAt',
          pageSize: 20,
          language: 'en',
          apiKey: newsApiKey
        },
        timeout: 10000
      });

      return response.data.articles.map((article: any, index: number) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) + '...',
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        relevanceScore: this.calculateRelevanceScore(article.title, article.description),
        keywords: this.extractKeywords(article.title + ' ' + article.description)
      }));
    } catch (error) {
      console.error('Error fetching news data:', error);
      return this.getFallbackNewsData();
    }
  }

  private async fetchSocialSentiment(): Promise<SocialSentiment[]> {
    try {
      // This would integrate with Twitter API, Reddit API, etc.
      // For now, returning simulated sentiment data based on market movements
      const marketData = this.marketData || [];
      const btcData = marketData.find(m => m.symbol === 'BTC');
      
      if (!btcData) {
        return this.getFallbackSocialSentiment();
      }

      const sentiment = btcData.changePercent24h > 0 ? 
        Math.min(0.8, btcData.changePercent24h / 10) : 
        Math.max(-0.8, btcData.changePercent24h / 10);

      return [
        {
          platform: 'Twitter',
          symbol: 'BTC',
          sentiment: sentiment,
          mentions: Math.floor(Math.random() * 5000) + 1000,
          timestamp: new Date(),
          trendingKeywords: sentiment > 0.2 ? ['moon', 'hodl', 'btc', 'bullish'] : ['dip', 'buy', 'hodl', 'diamond hands']
        },
        {
          platform: 'Reddit',
          symbol: 'BTC',
          sentiment: sentiment * 0.8, // Reddit tends to be slightly less extreme
          mentions: Math.floor(Math.random() * 1000) + 200,
          timestamp: new Date(),
          trendingKeywords: ['bitcoin', 'cryptocurrency', 'investment', 'future']
        }
      ];
    } catch (error) {
      console.error('Error fetching social sentiment:', error);
      return this.getFallbackSocialSentiment();
    }
  }

  private async fetchEconomicIndicators(): Promise<EconomicIndicator[]> {
    try {
      // This would integrate with FRED API, Bloomberg API, etc.
      // For now, returning key indicators that affect Bitcoin
      return [
        {
          name: 'US Dollar Index (DXY)',
          value: 103.5,
          previousValue: 104.2,
          change: -0.7,
          unit: 'index',
          releaseDate: new Date(),
          nextRelease: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        },
        {
          name: 'Federal Funds Rate',
          value: 5.25,
          previousValue: 5.25,
          change: 0,
          unit: 'percent',
          releaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
          nextRelease: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // Next FOMC meeting
        }
      ];
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      return [];
    }
  }

  private generateAlerts(marketData: MarketData[], newsItems: NewsItem[], socialSentiment: SocialSentiment[]): MarketAlert[] {
    const alerts: MarketAlert[] = [];
    const now = new Date();

    // Price threshold alerts
    marketData.forEach(market => {
      if (Math.abs(market.changePercent24h) > 10) {
        alerts.push({
          id: `price_${market.symbol}_${now.getTime()}`,
          type: 'price_threshold',
          symbol: market.symbol,
          message: `${market.symbol} ${market.changePercent24h > 0 ? 'surged' : 'dropped'} ${Math.abs(market.changePercent24h).toFixed(1)}% in 24h`,
          severity: Math.abs(market.changePercent24h) > 20 ? 'critical' : 'high',
          timestamp: now,
          data: { price: market.price, change: market.changePercent24h }
        });
      }
    });

    // Volume spike alerts
    marketData.forEach(market => {
      if (market.volume24h > 0) {
        // Simplified volume spike detection
        const avgVolume = market.volume24h * 0.7; // Assume current volume is 30% above average
        if (market.volume24h > avgVolume * 2) {
          alerts.push({
            id: `volume_${market.symbol}_${now.getTime()}`,
            type: 'volume_spike',
            symbol: market.symbol,
            message: `${market.symbol} volume spike detected - ${(market.volume24h / 1000000).toFixed(1)}M`,
            severity: 'medium',
            timestamp: now,
            data: { volume: market.volume24h }
          });
        }
      }
    });

    // News sentiment alerts
    const highImpactNews = newsItems.filter(news => 
      news.relevanceScore > 0.8 && 
      (news.sentiment === 'positive' || news.sentiment === 'negative')
    );

    highImpactNews.forEach(news => {
      alerts.push({
        id: `news_${news.id}`,
        type: 'news_sentiment',
        symbol: 'BTC', // Assume Bitcoin-related
        message: `High-impact ${news.sentiment} news: ${news.title}`,
        severity: 'medium',
        timestamp: now,
        data: { newsUrl: news.url, sentiment: news.sentiment }
      });
    });

    return alerts;
  }

  // Utility methods
  private getSymbolFromId(id: string): string {
    const mapping: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      'polygon': 'MATIC',
      'cardano': 'ADA'
    };
    return mapping[id] || id.toUpperCase();
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['surge', 'pump', 'moon', 'bullish', 'adoption', 'breakthrough', 'rally'];
    const negativeWords = ['crash', 'dump', 'bearish', 'decline', 'sell-off', 'collapse', 'drop'];
    
    const lowercaseText = text.toLowerCase();
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (lowercaseText.includes(word) ? 1 : 0), 0);
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (lowercaseText.includes(word) ? 1 : 0), 0);
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private calculateRelevanceScore(title: string, description: string): number {
    const relevantTerms = ['bitcoin', 'btc', 'cryptocurrency', 'blockchain', 'strategic reserve', 'etf', 'institutional'];
    const text = (title + ' ' + description).toLowerCase();
    
    let score = 0;
    relevantTerms.forEach(term => {
      if (text.includes(term)) {
        score += 0.2;
      }
    });
    
    return Math.min(1, score);
  }

  private extractKeywords(text: string): string[] {
    const keywords = ['bitcoin', 'cryptocurrency', 'blockchain', 'etf', 'institutional', 'adoption', 'regulation', 'defi'];
    return keywords.filter(keyword => text.toLowerCase().includes(keyword));
  }

  // Fallback data methods
  private getFallbackMarketData(): MarketData[] {
    return [
      {
        symbol: 'BTC',
        price: 45000,
        change24h: 2000,
        changePercent24h: 4.7,
        volume24h: 25000000000,
        marketCap: 880000000000,
        lastUpdate: new Date(),
        source: 'Fallback'
      },
      {
        symbol: 'ETH',
        price: 2800,
        change24h: 150,
        changePercent24h: 5.7,
        volume24h: 12000000000,
        marketCap: 340000000000,
        lastUpdate: new Date(),
        source: 'Fallback'
      }
    ];
  }

  private getFallbackStockData(): MarketData[] {
    return [
      {
        symbol: 'MSFT',
        price: 380,
        change24h: 5.2,
        changePercent24h: 1.4,
        volume24h: 25000000,
        marketCap: 2800000000000,
        lastUpdate: new Date(),
        source: 'Fallback'
      }
    ];
  }

  private getFallbackNewsData(): NewsItem[] {
    return [
      {
        id: 'fallback_news_1',
        title: 'Bitcoin Adoption Accelerates Among Institutional Investors',
        summary: 'Major institutions continue to add Bitcoin to their balance sheets...',
        url: 'https://example.com/bitcoin-adoption',
        source: 'Fallback News',
        publishedAt: new Date(),
        sentiment: 'positive',
        relevanceScore: 0.9,
        keywords: ['bitcoin', 'institutional', 'adoption']
      }
    ];
  }

  private getFallbackSocialSentiment(): SocialSentiment[] {
    return [
      {
        platform: 'Twitter',
        symbol: 'BTC',
        sentiment: 0.6,
        mentions: 2500,
        timestamp: new Date(),
        trendingKeywords: ['bitcoin', 'hodl', 'moon']
      }
    ];
  }

  // Public API methods
  public getMarketData(): MarketData[] {
    return this.marketData || [];
  }

  public getNewsItems(): NewsItem[] {
    return this.newsItems || [];
  }

  public getSocialSentiment(): SocialSentiment[] {
    return this.socialSentiment || [];
  }

  public getEconomicIndicators(): EconomicIndicator[] {
    return this.economicIndicators || [];
  }

  public getAlerts(): MarketAlert[] {
    return this.alerts || [];
  }

  public getMarketDataBySymbol(symbol: string): MarketData | undefined {
    const marketData = this.getMarketData();
    return marketData.find(market => market.symbol === symbol);
  }

  public getComprehensiveBitcoinData(): ComprehensiveBitcoinData | null {
    return this.comprehensiveBitcoinData;
  }

  public getCuratedAltcoinsData(): CuratedAltcoinsData | null {
    if (!this.curatedAltcoinsCache || !this.isCuratedCacheValid()) {
      return null;
    }
    return this.curatedAltcoinsCache.data;
  }

  public getTop100VsBtcData(): Top100VsBtcData | null {
    if (!this.top100VsBtcCache || !this.isTop100CacheValid()) {
      return null;
    }
    return this.top100VsBtcCache.data;
  }

  public getDexScreenerData(): DexScreenerData | null {
    if (!this.dexScreenerCache || !this.isDexScreenerCacheValid()) {
      return null;
    }
    return this.dexScreenerCache.data;
  }

  public getTopMoversData(): TopMoversData | null {
    if (!this.topMoversCache || !this.isTopMoversCacheValid()) {
      return null;
    }
    return this.topMoversCache.data;
  }

  public getTrendingCoinsData(): TrendingCoinsData | null {
    if (!this.trendingCoinsCache || !this.isTrendingCoinsCacheValid()) {
      return null;
    }
    return this.trendingCoinsCache.data;
  }

  public getCuratedNFTsData(): CuratedNFTsData | null {
    if (!this.curatedNFTsCache || !this.isCuratedNFTsCacheValid()) {
      return null;
    }
    return this.curatedNFTsCache.data;
  }

  public getWeatherData(): ComprehensiveWeatherData | null {
    if (!this.weatherCache || !this.isWeatherCacheValid()) {
      return null;
    }
    return this.weatherCache.data;
  }

  public async forceUpdate(): Promise<void> {
    await this.updateAllData();
  }

  public async forceCuratedAltcoinsUpdate(): Promise<CuratedAltcoinsData | null> {
    return await this.fetchCuratedAltcoinsData();
  }

  public async forceTop100VsBtcUpdate(): Promise<Top100VsBtcData | null> {
    return await this.fetchTop100VsBtcData();
  }

  public async forceDexScreenerUpdate(): Promise<DexScreenerData | null> {
    return await this.fetchDexScreenerData();
  }

  public async forceTopMoversUpdate(): Promise<TopMoversData | null> {
    return await this.fetchTopMoversData();
  }

  public async forceTrendingCoinsUpdate(): Promise<TrendingCoinsData | null> {
    return await this.fetchTrendingCoinsData();
  }

  public async forceCuratedNFTsUpdate(): Promise<CuratedNFTsData | null> {
    return await this.fetchCuratedNFTsData();
  }

  public async forceWeatherUpdate(): Promise<ComprehensiveWeatherData | null> {
    return await this.fetchWeatherData();
  }

  // Comprehensive Bitcoin data fetcher
  private async fetchComprehensiveBitcoinData(): Promise<ComprehensiveBitcoinData | null> {
    try {
      // Fetch all data in parallel
      const [priceData, networkData, sentimentData, mempoolData] = await Promise.all([
        this.fetchBitcoinPriceData(),
        this.fetchBitcoinNetworkData(),
        this.fetchBitcoinSentimentData(),
        this.fetchBitcoinMempoolData()
      ]);

      // Combine all data
      const response: ComprehensiveBitcoinData = {
        price: {
          usd: priceData?.usd || null,
          change24h: priceData?.change24h || null
        },
        network: {
          hashRate: networkData?.hashRate || null,
          difficulty: networkData?.difficulty || null,
          blockHeight: networkData?.blockHeight || null,
          avgBlockTime: networkData?.avgBlockTime || null,
          avgBlockSize: networkData?.avgBlockSize || null,
          totalBTC: networkData?.totalBTC || null,
          marketCap: networkData?.marketCap || null,
          nextHalving: networkData?.nextHalving || { blocks: null, estimatedDate: null },
          mempoolSize: mempoolData?.mempoolSize || null,
          mempoolFees: mempoolData?.mempoolFees || { fastestFee: null, halfHourFee: null, economyFee: null },
          mempoolTxs: mempoolData?.mempoolTxs || null,
          miningRevenue: mempoolData?.miningRevenue || null,
          miningRevenue24h: mempoolData?.miningRevenue24h || null,
          lightningCapacity: null,
          lightningChannels: null,
          liquidity: null
        },
        sentiment: {
          fearGreedIndex: sentimentData?.fearGreedIndex || null,
          fearGreedValue: sentimentData?.fearGreedValue || null
        },
        nodes: {
          total: null,
          countries: null
        },
        lastUpdated: new Date()
      };

      return response;
    } catch (error) {
      console.error('Error fetching comprehensive Bitcoin data:', error);
      return null;
    }
  }

  private async fetchBitcoinPriceData(): Promise<{ usd: number; change24h: number } | null> {
    try {
      const data = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: { 'Accept': 'application/json' }
          }
        );
      });
      
      return {
        usd: Number(data.bitcoin?.usd) || null,
        change24h: Number(data.bitcoin?.usd_24h_change) || null
      };
    } catch (error) {
      console.error('Error fetching Bitcoin price data:', error);
      return null;
    }
  }

  private async fetchBitcoinNetworkData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      const response = await fetch(`${this.BLOCKCHAIN_API}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Calculate next halving
        const currentBlock = Number(data.n_blocks_total);
        const currentHalvingEpoch = Math.floor(currentBlock / 210000);
        const nextHalvingBlock = (currentHalvingEpoch + 1) * 210000;
        const blocksUntilHalving = nextHalvingBlock - currentBlock;
        
        // Estimate halving date based on average block time
        const avgBlockTime = Number(data.minutes_between_blocks);
        const minutesUntilHalving = blocksUntilHalving * avgBlockTime;
        const halvingDate = new Date(Date.now() + minutesUntilHalving * 60 * 1000);

        return {
          hashRate: Number(data.hash_rate),
          difficulty: Number(data.difficulty),
          blockHeight: Number(data.n_blocks_total),
          avgBlockTime: Number(data.minutes_between_blocks),
          avgBlockSize: Number(data.blocks_size),
          totalBTC: Number(data.totalbc) / 1e8,
          marketCap: Number(data.market_price_usd) * (Number(data.totalbc) / 1e8),
          nextHalving: {
            blocks: blocksUntilHalving,
            estimatedDate: halvingDate.toISOString()
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin network data:', error);
      return null;
    }
  }

  private async fetchBitcoinSentimentData(): Promise<BitcoinSentimentData | null> {
    try {
      const response = await fetch(`${this.ALTERNATIVE_API}/fng/`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          fearGreedIndex: Number(data.data[0].value),
          fearGreedValue: data.data[0].value_classification
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Bitcoin sentiment data:', error);
      return null;
    }
  }

  private async fetchBitcoinMempoolData(): Promise<Partial<BitcoinNetworkData> | null> {
    try {
      // Fetch mempool data in parallel
      const [mempoolResponse, feesResponse] = await Promise.all([
        fetch(`${this.MEMPOOL_API}/mempool`),
        fetch(`${this.MEMPOOL_API}/v1/fees/recommended`)
      ]);

      if (!mempoolResponse.ok || !feesResponse.ok) {
        throw new Error('Failed to fetch mempool data');
      }

      const [mempoolData, feesData] = await Promise.all([
        mempoolResponse.json(),
        feesResponse.json()
      ]);

      return {
        mempoolSize: mempoolData.vsize || null,  // Virtual size in bytes
        mempoolTxs: mempoolData.count || null,   // Number of transactions
        mempoolFees: {
          fastestFee: feesData.fastestFee || null,
          halfHourFee: feesData.halfHourFee || null,
          economyFee: feesData.economyFee || null
        },
        miningRevenue: mempoolData.total_fee || null,  // Total fees in satoshis
        miningRevenue24h: null  // We'll need another endpoint for this
      };
    } catch (error) {
      console.error('Error fetching Bitcoin mempool data:', error);
      return null;
    }
  }

  // Curated altcoins data management
  private isCuratedCacheValid(): boolean {
    if (!this.curatedAltcoinsCache) return false;
    return Date.now() - this.curatedAltcoinsCache.timestamp < this.CURATED_CACHE_DURATION;
  }

  private async updateCuratedAltcoinsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isCuratedCacheValid()) {
      const data = await this.fetchCuratedAltcoinsData();
      if (data) {
        this.curatedAltcoinsCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchCuratedAltcoinsData(): Promise<CuratedAltcoinsData | null> {
    try {
      const idsParam = this.curatedCoinIds.join(',');
      const data = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
      });
      
      // Ensure all requested IDs are present in the response (with zeroed data if missing)
      const result: CuratedAltcoinsData = {};
      this.curatedCoinIds.forEach((id) => {
        result[id] = data[id]
          ? {
              price: data[id].usd || 0,
              change24h: data[id].usd_24h_change || 0,
              marketCap: data[id].usd_market_cap || 0,
              volume24h: data[id].usd_24h_vol || 0,
            }
          : { price: 0, change24h: 0, marketCap: 0, volume24h: 0 };
      });

      console.log(`[RealTimeDataService] Fetched curated altcoins data for ${this.curatedCoinIds.length} coins`);
      return result;
    } catch (error) {
      console.error('Error fetching curated altcoins data:', error);
      return null;
    }
  }

  // Top 100 vs BTC data management
  private isTop100CacheValid(): boolean {
    if (!this.top100VsBtcCache) return false;
    return Date.now() - this.top100VsBtcCache.timestamp < this.TOP100_CACHE_DURATION;
  }

  private async updateTop100VsBtcData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isTop100CacheValid()) {
      const data = await this.fetchTop100VsBtcData();
      if (data) {
        this.top100VsBtcCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchTop100VsBtcData(): Promise<Top100VsBtcData | null> {
    try {
      // Step 1: Fetch top 100 coins against BTC to find outperformers and their performance vs BTC
      const btcMarketData = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/coins/markets?vs_currency=btc&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d`,
          {
            headers: { 'Accept': 'application/json' }
          }
        );
      });

      // Step 2: Separate outperformers and underperformers
      const outperformingVsBtc = btcMarketData.filter(
        (coin: any) => coin.price_change_percentage_24h > 0
      );
      
      const underperformingVsBtc = btcMarketData.filter(
        (coin: any) => coin.price_change_percentage_24h <= 0
      );

      if (outperformingVsBtc.length === 0) {
        // Return empty data structure if no outperformers
        return {
          outperforming: [],
          underperforming: underperformingVsBtc.slice(0, 10), // Show top 10 underperformers
          totalCoins: btcMarketData.length,
          outperformingCount: 0,
          underperformingCount: underperformingVsBtc.length,
          averagePerformance: 0,
          topPerformers: [],
          worstPerformers: underperformingVsBtc.slice(0, 5),
          lastUpdated: new Date()
        };
      }

      // Step 3: Get USD prices for outperforming coins
      const outperformingIds = outperformingVsBtc.map((coin: any) => coin.id).join(',');
      const usdPrices = await this.makeQueuedRequest(async () => {
        return await this.fetchWithRetry(
          `${this.COINGECKO_API}/simple/price?ids=${outperformingIds}&vs_currencies=usd`,
          {
            headers: { 'Accept': 'application/json' }
          }
        );
      });

      // Step 4: Combine BTC-denominated performance data with USD prices
      const outperformingWithUsd = outperformingVsBtc.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: usdPrices[coin.id]?.usd ?? 0,
        market_cap_rank: coin.market_cap_rank,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency,
        price_change_percentage_30d_in_currency: coin.price_change_percentage_30d_in_currency,
      }));

      // Step 5: Calculate analytics
      const totalCoins = btcMarketData.length;
      const outperformingCount = outperformingWithUsd.length;
      const underperformingCount = underperformingVsBtc.length;
      
      const averagePerformance = btcMarketData.reduce((sum: number, coin: any) => 
        sum + coin.price_change_percentage_24h, 0) / totalCoins;

      // Sort for top/worst performers
      const sortedOutperformers = [...outperformingWithUsd].sort((a, b) => 
        b.price_change_percentage_24h - a.price_change_percentage_24h);
      
      const sortedUnderperformers = [...underperformingVsBtc].sort((a, b) => 
        a.price_change_percentage_24h - b.price_change_percentage_24h);

      const result: Top100VsBtcData = {
        outperforming: outperformingWithUsd,
        underperforming: underperformingVsBtc.slice(0, 10), // Limit to top 10 for readability
        totalCoins,
        outperformingCount,
        underperformingCount,
        averagePerformance,
        topPerformers: sortedOutperformers.slice(0, 10), // Top 10 performers
        worstPerformers: sortedUnderperformers.slice(0, 5), // Worst 5 performers
        lastUpdated: new Date()
      };

      console.log(`[RealTimeDataService] Fetched top 100 vs BTC data: ${outperformingCount}/${totalCoins} outperforming`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchTop100VsBtcData:', error);
      return null;
    }
  }

  // DEXScreener data management
  private isDexScreenerCacheValid(): boolean {
    if (!this.dexScreenerCache) return false;
    return Date.now() - this.dexScreenerCache.timestamp < this.DEXSCREENER_CACHE_DURATION;
  }

  private async updateDexScreenerData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isDexScreenerCacheValid()) {
      const data = await this.fetchDexScreenerData();
      if (data) {
        this.dexScreenerCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchDexScreenerData(): Promise<DexScreenerData | null> {
    try {
      console.log('[RealTimeDataService] Fetching DEXScreener data...');
      
      // Step 1: Fetch trending/boosted tokens
      const topTokensResponse = await fetch(`${this.DEXSCREENER_API}/token-boosts/top/v1`);
      
      if (!topTokensResponse.ok) {
        throw new Error(`DEXScreener API error: ${topTokensResponse.status}`);
      }
      
      const topTokens: BoostedToken[] = await topTokensResponse.json();
      
      // Step 2: For each token, fetch pool data and aggregate metrics
      const enriched = await Promise.all(
        topTokens.slice(0, 50).map(async (token): Promise<TrendingToken | null> => {
          try {
            const poolResponse = await fetch(
              `${this.DEXSCREENER_API}/token-pairs/v1/${token.chainId}/${token.tokenAddress}`
            );
            
            if (!poolResponse.ok) return null;
            const pools: DexScreenerPool[] = await poolResponse.json();
            
            if (!pools.length) return null; // skip tokens with no pools
            
            const totalLiquidity = pools.reduce(
              (sum, pool) => sum + (Number(pool.liquidity?.usd) || 0),
              0
            );
            const totalVolume = pools.reduce(
              (sum, pool) => sum + (Number(pool.volume?.h24) || 0),
              0
            );
            const largestPool = pools.reduce(
              (max, pool) =>
                (Number(pool.liquidity?.usd) || 0) > (Number(max.liquidity?.usd) || 0)
                  ? pool
                  : max,
              pools[0] || {}
            );
            
            const priceUsd = largestPool.priceUsd ? Number(largestPool.priceUsd) : null;
            const marketCap = largestPool.marketCap ? Number(largestPool.marketCap) : null;
            const liquidityRatio = marketCap && marketCap > 0 ? totalLiquidity / marketCap : null;
            const icon = token.icon || (largestPool.info && largestPool.info.imageUrl) || '';
            
            // Only return tokens with at least one valid metric
            if (!priceUsd && !marketCap && !totalLiquidity && !totalVolume) return null;
            
            return {
              address: token.tokenAddress,
              chainId: token.chainId,
              image: icon,
              name: token.label || token.symbol || '',
              symbol: token.symbol || '',
              priceUsd,
              marketCap,
              totalLiquidity,
              totalVolume,
              poolsCount: pools.length,
              liquidityRatio,
            };
          } catch (error) {
            console.warn(`Failed to fetch pool data for token ${token.tokenAddress}:`, error);
            return null;
          }
        })
      );
      
      // Step 3: Filter and rank tokens (matching website logic)
      const trendingTokens = enriched
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .filter((t) => t.chainId === 'solana') // Focus on Solana tokens
        .filter(
          (t) =>
            t.totalLiquidity > 100_000 && // min $100k liquidity
            t.totalVolume > 20_000 && // min $20k 24h volume
            t.poolsCount && t.poolsCount > 0 // at least 1 pool
        )
        .sort((a, b) => (b.liquidityRatio ?? 0) - (a.liquidityRatio ?? 0)) // Sort by liquidity ratio
        .slice(0, 9); // Limit to top 9
      
      const result: DexScreenerData = {
        topTokens,
        trendingTokens,
        lastUpdated: new Date()
      };
      
      console.log(`[RealTimeDataService] Fetched DEXScreener data: ${topTokens.length} top tokens, ${trendingTokens.length} trending`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchDexScreenerData:', error);
      return null;
    }
  }

  // Top Movers (Gainers/Losers) data management
  private isTopMoversCacheValid(): boolean {
    if (!this.topMoversCache) return false;
    return Date.now() - this.topMoversCache.timestamp < this.TOP_MOVERS_CACHE_DURATION;
  }

  private async updateTopMoversData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isTopMoversCacheValid()) {
      const data = await this.fetchTopMoversData();
      if (data) {
        this.topMoversCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchTopMoversData(): Promise<TopMoversData | null> {
    try {
      console.log('[RealTimeDataService] Fetching top movers data...');
      
      const data: TopMoverCoin[] = await this.fetchWithRetry(
        `${this.COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      
      // Filter out coins without valid 24h price change percentage
      const validCoins = data.filter((coin) => typeof coin.price_change_percentage_24h === 'number');
      
      // Sort by 24h price change percentage descending for gainers
      const topGainers = [...validCoins]
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 4)
        .map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          market_cap_rank: coin.market_cap_rank,
          price_change_percentage_24h: coin.price_change_percentage_24h,
        }));
      
      // Sort by 24h price change percentage ascending for losers
      const topLosers = [...validCoins]
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, 4)
        .map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          market_cap_rank: coin.market_cap_rank,
          price_change_percentage_24h: coin.price_change_percentage_24h,
        }));
      
      const result: TopMoversData = {
        topGainers,
        topLosers,
        lastUpdated: new Date()
      };
      
      console.log(`[RealTimeDataService] Fetched top movers: ${topGainers.length} gainers, ${topLosers.length} losers`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchTopMoversData:', error);
      return null;
    }
  }

  // Trending Coins data management
  private isTrendingCoinsCacheValid(): boolean {
    if (!this.trendingCoinsCache) return false;
    return Date.now() - this.trendingCoinsCache.timestamp < this.TRENDING_COINS_CACHE_DURATION;
  }

  private async updateTrendingCoinsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isTrendingCoinsCacheValid()) {
      const data = await this.fetchTrendingCoinsData();
      if (data) {
        this.trendingCoinsCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchTrendingCoinsData(): Promise<TrendingCoinsData | null> {
    try {
      console.log('[RealTimeDataService] Fetching trending coins data...');
      
      const data = await this.fetchWithRetry('https://api.coingecko.com/api/v3/search/trending', {
        headers: { 'Accept': 'application/json' },
      });
      
      // Map and validate trending coins (matches website exactly)
      const trending: TrendingCoin[] = Array.isArray(data.coins)
        ? data.coins.map((c: CoinGeckoTrendingItem) => ({
            id: c.item.id,
            name: c.item.name,
            symbol: c.item.symbol,
            market_cap_rank: c.item.market_cap_rank,
            thumb: c.item.thumb,
            score: c.item.score,
          }))
        : [];
      
      const result: TrendingCoinsData = {
        coins: trending,
        lastUpdated: new Date()
      };
      
      console.log(`[RealTimeDataService] Fetched trending coins: ${trending.length} coins`);
      return result;
      
    } catch (error) {
      console.error('Error in fetchTrendingCoinsData:', error);
      return null;
    }
  }

  // Curated NFTs data management
  private isCuratedNFTsCacheValid(): boolean {
    if (!this.curatedNFTsCache) return false;
    return Date.now() - this.curatedNFTsCache.timestamp < this.CURATED_NFTS_CACHE_DURATION;
  }

  private async updateCuratedNFTsData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isCuratedNFTsCacheValid()) {
      const data = await this.fetchCuratedNFTsData();
      if (data) {
        this.curatedNFTsCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchCuratedNFTsData(): Promise<CuratedNFTsData | null> {
    try {
      console.log('[RealTimeDataService] Fetching enhanced curated NFTs data...');
      
      const openSeaApiKey = this.runtime.getSetting('OPENSEA_API_KEY');
      if (!openSeaApiKey) {
        console.warn('OPENSEA_API_KEY not configured, using fallback data');
        return this.getFallbackNFTsData();
      }

      const headers = {
        'Accept': 'application/json',
        'X-API-KEY': openSeaApiKey,
        'User-Agent': 'LiveTheLifeTV/1.0'
      };

      // Process collections in smaller batches to avoid rate limits
      const collections: NFTCollectionData[] = [];
      const batchSize = 3;
      
      for (let i = 0; i < Math.min(this.curatedNFTCollections.length, 15); i += batchSize) {
        const batch = this.curatedNFTCollections.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (collectionInfo) => {
          return await this.fetchEnhancedCollectionData(collectionInfo, headers);
        });

        try {
          const batchResults = await Promise.all(batchPromises);
          collections.push(...batchResults.filter(Boolean) as NFTCollectionData[]);
        } catch (error) {
          console.error(`Error processing batch ${i}:`, error);
        }

        // Rate limiting between batches
        if (i + batchSize < this.curatedNFTCollections.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate enhanced summary statistics
      const summary = this.calculateNFTSummary(collections);

      const result: CuratedNFTsData = {
        collections,
        summary,
        lastUpdated: new Date()
      };

      console.log(`[RealTimeDataService] Enhanced NFTs data: ${collections.length} collections, total 24h volume: ${summary.totalVolume24h.toFixed(2)} ETH`);
      return result;

    } catch (error) {
      console.error('Error in fetchCuratedNFTsData:', error);
      return this.getFallbackNFTsData();
    }
  }

  private async fetchEnhancedCollectionData(
    collectionInfo: any, 
    headers: any
  ): Promise<NFTCollectionData | null> {
    try {
      // Fetch basic collection data with retry logic
      const collectionData = await this.fetchWithRetry(
        `https://api.opensea.io/api/v2/collections/${collectionInfo.slug}`,
        { headers },
        3
      );

      // Fetch collection stats
      const statsData = await this.fetchWithRetry(
        `https://api.opensea.io/api/v2/collections/${collectionInfo.slug}/stats`,
        { headers },
        3
      );

      // Parse enhanced stats
      const stats = this.parseCollectionStats(statsData);

      // Get contract address for this collection
      const contractAddress = collectionData?.contracts?.[0]?.address || '';

      // Fetch floor items (3 cheapest listings) - pass contract address
      const floorItems = await this.fetchFloorItems(collectionInfo.slug, headers, contractAddress);

      // Fetch recent sales (3 most recent)
      const recentSales = await this.fetchRecentSales(collectionInfo.slug, headers);

      return {
        slug: collectionInfo.slug,
        collection: this.parseCollectionData(collectionData, collectionInfo),
        stats,
        lastUpdated: new Date(),
        category: collectionInfo.category,
        floorItems,
        recentSales,
        contractAddress,
        blockchain: 'ethereum'
      };

    } catch (error) {
      console.error(`Enhanced fetch failed for ${collectionInfo.slug}:`, error);
      return this.getFallbackCollectionData(collectionInfo);
    }
  }

  private async fetchWithRetry(
    url: string, 
    options: any, 
    maxRetries = 3
  ): Promise<any> {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000) // Increased timeout to 15 seconds
        });
        
        if (response.status === 429) {
          // Rate limited - more aggressive exponential backoff
          const waitTime = Math.min(Math.pow(2, i) * 5000, 60000); // 5s, 10s, 20s, up to 60s
          console.warn(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const waitTime = Math.min(Math.pow(2, i) * 3000, 30000); // 3s, 6s, 12s, up to 30s
          console.warn(`Request failed, waiting ${waitTime}ms before retry ${i + 1}:`, error);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }

  private parseCollectionStats(statsData: any): NFTCollectionStats {
    const stats = statsData?.total || {};
    const intervals = statsData?.intervals || [];
    
    // Find interval data
    const oneDayInterval = intervals.find(i => i.interval === 'one_day');
    const sevenDayInterval = intervals.find(i => i.interval === 'seven_day');
    const thirtyDayInterval = intervals.find(i => i.interval === 'thirty_day');
    
    return {
      total_supply: stats.total_supply || 0,
      num_owners: stats.num_owners || 0,
      average_price: stats.average_price || 0,
      floor_price: stats.floor_price || 0,
      market_cap: stats.market_cap || 0,
      one_day_volume: oneDayInterval?.volume || 0,
      one_day_change: oneDayInterval?.volume_change || 0,
      one_day_sales: oneDayInterval?.sales || 0,
      seven_day_volume: sevenDayInterval?.volume || 0,
      seven_day_change: sevenDayInterval?.volume_change || 0,
      seven_day_sales: sevenDayInterval?.sales || 0,
      thirty_day_volume: thirtyDayInterval?.volume || 0,
      thirty_day_change: thirtyDayInterval?.volume_change || 0,
      thirty_day_sales: thirtyDayInterval?.sales || 0
    };
  }

  private parseCollectionData(collectionData: any, collectionInfo: any): NFTCollection {
    const collection = collectionData?.collection || {};
    
    return {
      collection: collection.slug || collectionInfo.slug,
      name: collection.name || collectionInfo.name,
      description: collection.description || collectionInfo.description || '',
      image_url: collection.image_url || '',
      banner_image_url: collection.banner_image_url || '',
      owner: collection.owner || '',
      category: collectionInfo.category || 'art',
      is_disabled: collection.is_disabled || false,
      is_nsfw: collection.is_nsfw || false,
      trait_offers_enabled: collection.trait_offers_enabled || false,
      collection_offers_enabled: collection.collection_offers_enabled || false,
      opensea_url: `https://opensea.io/collection/${collectionInfo.slug}`,
      project_url: collection.project_url || '',
      wiki_url: collection.wiki_url || '',
      discord_url: collection.discord_url || '',
      telegram_url: collection.telegram_url || '',
      twitter_username: collection.twitter_username || '',
      instagram_username: collection.instagram_username || '',
      contracts: collection.contracts || [],
      editors: collection.editors || [],
      fees: collection.fees || [],
      rarity: collection.rarity || {
        strategy_id: '',
        strategy_version: '',
        rank_at: '',
        max_rank: 0,
        tokens_scored: 0
      },
      total_supply: collection.total_supply || 0,
      created_date: collection.created_date || ''
    };
  }

  private async fetchFloorItems(slug: string, headers: any, contractAddress?: string): Promise<NFTFloorItem[]> {
    try {
      // If no contract address provided, return empty array
      if (!contractAddress) {
        console.warn(`No contract address available for ${slug}, skipping floor items`);
        return [];
      }

      // Use contract-based endpoint which works for the new API
      const response = await fetch(
        `https://api.opensea.io/api/v2/chain/ethereum/contract/${contractAddress}/nfts?limit=10`,
        { headers, signal: AbortSignal.timeout(5000) }
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch floor items for ${slug} (${response.status})`);
        return [];
      }
      
      const data = await response.json();
      const nfts = data.nfts || [];
      
      // Filter for NFTs with listings/prices and sort by price
      const nftsWithPrices = nfts
        .filter((nft: any) => nft.listings && nft.listings.length > 0)
        .sort((a: any, b: any) => {
          const priceA = this.extractPriceFromNFT(a);
          const priceB = this.extractPriceFromNFT(b);
          return priceA - priceB;
        })
        .slice(0, 3);

      return nftsWithPrices.map((nft: any) => ({
        token_id: nft.identifier || '',
        name: nft.name || `#${nft.identifier}`,
        image_url: nft.image_url || '',
        price_eth: this.extractPriceFromNFT(nft),
        price_usd: this.extractPriceFromNFT(nft) * 3500, // Approximate ETH to USD
        rarity_rank: nft.rarity?.rank || null,
        listing_time: nft.updated_at || new Date().toISOString(),
        opensea_url: `https://opensea.io/assets/ethereum/${contractAddress}/${nft.identifier}`
      }));
    } catch (error) {
      console.warn(`Failed to fetch floor items for ${slug}:`, error);
      return [];
    }
  }

  private async fetchRecentSales(slug: string, headers: any): Promise<NFTSaleEvent[]> {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v2/events/collection/${slug}?event_type=sale&limit=5`,
        { headers, signal: AbortSignal.timeout(5000) }
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.events || []).slice(0, 3).map((event: any) => ({
        token_id: event.nft?.identifier || '',
        name: event.nft?.name || `#${event.nft?.identifier}`,
        image_url: event.nft?.image_url || '',
        price_eth: this.extractPriceFromEvent(event),
        price_usd: parseFloat(event.payment?.price_usd || '0'),
        buyer: event.winner?.address || '',
        seller: event.seller?.address || '',
        transaction_hash: event.transaction?.hash || '',
        timestamp: event.event_timestamp || new Date().toISOString(),
        event_type: 'sale' as const
      }));
    } catch (error) {
      console.warn(`Failed to fetch recent sales for ${slug}:`, error);
      return [];
    }
  }

  private extractPriceFromNFT(nft: any): number {
    if (nft.listings && nft.listings.length > 0) {
      const listing = nft.listings[0];
      return parseFloat(listing.price?.current?.value || '0') / Math.pow(10, 18);
    }
    return 0;
  }

  private extractPriceFromEvent(event: any): number {
    if (event.payment?.quantity) {
      return parseFloat(event.payment.quantity) / Math.pow(10, 18);
    }
    return 0;
  }

  private calculateNFTSummary(collections: NFTCollectionData[]): CuratedNFTsData['summary'] {
    const totalVolume24h = collections.reduce((sum, c) => sum + c.stats.one_day_volume, 0);
    const totalMarketCap = collections.reduce((sum, c) => sum + c.stats.market_cap, 0);
    const avgFloorPrice = collections.length > 0 
      ? collections.reduce((sum, c) => sum + c.stats.floor_price, 0) / collections.length 
      : 0;

    // Top and worst performers (by 24h volume change)
    const sortedByChange = [...collections]
      .filter(c => c.stats.one_day_change !== 0)
      .sort((a, b) => b.stats.one_day_change - a.stats.one_day_change);

    const topPerformers = sortedByChange.slice(0, 5);
    const worstPerformers = sortedByChange.slice(-5).reverse();

    return {
      totalVolume24h,
      totalMarketCap,
      avgFloorPrice,
      topPerformers,
      worstPerformers,
      totalCollections: collections.length
    };
  }

  private getFallbackCollectionData(collectionInfo: any): NFTCollectionData {
    return {
      slug: collectionInfo.slug,
      collection: {
        collection: collectionInfo.slug,
        name: collectionInfo.name,
        description: collectionInfo.description || '',
        image_url: '',
        banner_image_url: '',
        owner: '',
        category: collectionInfo.category || 'art',
        is_disabled: false,
        is_nsfw: false,
        trait_offers_enabled: false,
        collection_offers_enabled: false,
        opensea_url: `https://opensea.io/collection/${collectionInfo.slug}`,
        project_url: '',
        wiki_url: '',
        discord_url: '',
        telegram_url: '',
        twitter_username: '',
        instagram_username: '',
        contracts: [],
        editors: [],
        fees: [],
        rarity: {
          strategy_id: '',
          strategy_version: '',
          rank_at: '',
          max_rank: 0,
          tokens_scored: 0
        },
        total_supply: 0,
        created_date: ''
      },
      stats: {
        total_supply: 0,
        num_owners: 0,
        average_price: 0,
        floor_price: 0,
        market_cap: 0,
        one_day_volume: 0,
        one_day_change: 0,
        one_day_sales: 0,
        seven_day_volume: 0,
        seven_day_change: 0,
        seven_day_sales: 0,
        thirty_day_volume: 0,
        thirty_day_change: 0,
        thirty_day_sales: 0
      },
      lastUpdated: new Date(),
      category: collectionInfo.category,
      floorItems: [],
      recentSales: [],
      contractAddress: '',
      blockchain: 'ethereum'
    };
  }

  private getFallbackNFTsData(): CuratedNFTsData {
    return {
      collections: [],
      summary: {
        totalVolume24h: 0,
        totalMarketCap: 0,
        avgFloorPrice: 0,
        topPerformers: [],
        worstPerformers: [],
        totalCollections: 0
      },
      lastUpdated: new Date()
    };
  }

  // Weather data management
  private isWeatherCacheValid(): boolean {
    if (!this.weatherCache) return false;
    return Date.now() - this.weatherCache.timestamp < this.WEATHER_CACHE_DURATION;
  }

  private async updateWeatherData(): Promise<void> {
    // Only fetch if cache is invalid
    if (!this.isWeatherCacheValid()) {
      const data = await this.fetchWeatherData();
      if (data) {
        this.weatherCache = {
          data,
          timestamp: Date.now()
        };
      }
    }
  }

  private async fetchWeatherData(): Promise<ComprehensiveWeatherData | null> {
    try {
      console.log('[RealTimeDataService] Fetching weather data for European lifestyle cities...');
      
      const cities = Object.entries(this.weatherCities);
      const cityWeatherPromises = cities.map(async ([cityKey, cityConfig]) => {
        try {
                     // Fetch weather data
           const weatherResponse = await fetch(
             `https://api.open-meteo.com/v1/forecast?latitude=${cityConfig.lat}&longitude=${cityConfig.lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,wind_speed_10m,wind_direction_10m`,
             { signal: AbortSignal.timeout(5000) }
           );

          if (!weatherResponse.ok) {
            console.warn(`Failed to fetch weather for ${cityKey}: ${weatherResponse.status}`);
            return null;
          }

                     const weatherData = await weatherResponse.json();

           // If no current data, use latest hourly data as fallback
           if (!weatherData.current && weatherData.hourly) {
             const latestIndex = weatherData.hourly.time.length - 1;
             if (latestIndex >= 0) {
               weatherData.current = {
                 time: weatherData.hourly.time[latestIndex],
                 interval: 3600, // 1 hour in seconds
                 temperature_2m: weatherData.hourly.temperature_2m[latestIndex],
                 wind_speed_10m: weatherData.hourly.wind_speed_10m?.[latestIndex],
                 wind_direction_10m: weatherData.hourly.wind_direction_10m?.[latestIndex]
               };
             }
           }

           // Fetch marine data (for coastal cities)
          let marineData = null;
          if (cityKey === 'biarritz' || cityKey === 'monaco') {
            try {
              const marineResponse = await fetch(
                `https://marine-api.open-meteo.com/v1/marine?latitude=${cityConfig.lat}&longitude=${cityConfig.lon}&current=wave_height,wave_direction,wave_period,sea_surface_temperature`,
                { signal: AbortSignal.timeout(5000) }
              );
              if (marineResponse.ok) {
                marineData = await marineResponse.json();
              }
            } catch (error) {
              console.warn(`Failed to fetch marine data for ${cityKey}:`, error);
            }
          }

          // Fetch air quality data
          let airQualityData = null;
          try {
            const airQualityResponse = await fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cityConfig.lat}&longitude=${cityConfig.lon}&current=pm10,pm2_5,uv_index,uv_index_clear_sky`,
              { signal: AbortSignal.timeout(5000) }
            );
            if (airQualityResponse.ok) {
              airQualityData = await airQualityResponse.json();
            }
          } catch (error) {
            console.warn(`Failed to fetch air quality data for ${cityKey}:`, error);
          }

          return {
            city: cityKey,
            displayName: cityConfig.displayName,
            weather: weatherData,
            marine: marineData,
            airQuality: airQualityData,
            lastUpdated: new Date()
          } as CityWeatherData;

        } catch (error) {
          console.error(`Error fetching weather for ${cityKey}:`, error);
          return null;
        }
      });

      // Add delays between requests to avoid rate limits
      const cityWeatherData: CityWeatherData[] = [];
      for (let i = 0; i < cityWeatherPromises.length; i++) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
        }
        try {
          const result = await cityWeatherPromises[i];
          if (result) {
            cityWeatherData.push(result);
          }
        } catch (error) {
          console.error(`Error processing weather for city ${i}:`, error);
        }
      }

      // Calculate summary statistics
      if (cityWeatherData.length === 0) {
        console.warn('No weather data retrieved for any city');
        return null;
      }

      // Get valid temperatures (handle optional/null values)
      const temperatures = cityWeatherData
        .map(city => city.weather.current?.temperature_2m)
        .filter((temp): temp is number => temp !== undefined && temp !== null);
      
      if (temperatures.length === 0) {
        console.warn('No valid temperature data available');
        return null;
      }

      const averageTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

      // Find best weather city (highest temp, lowest wind) - handle optional values
      const bestWeatherCity = cityWeatherData.reduce((best, current) => {
        const bestTemp = best.weather.current?.temperature_2m || 0;
        const bestWind = best.weather.current?.wind_speed_10m || 0;
        const currentTemp = current.weather.current?.temperature_2m || 0;
        const currentWind = current.weather.current?.wind_speed_10m || 0;
        
        const bestScore = bestTemp - (bestWind * 0.5);
        const currentScore = currentTemp - (currentWind * 0.5);
        return currentScore > bestScore ? current : best;
      }).displayName;

      // Find best surf conditions (coastal cities only)
      const coastalCities = cityWeatherData.filter(city => city.marine);
      let bestSurfConditions = null;
      if (coastalCities.length > 0) {
        const bestSurf = coastalCities.reduce((best, current) => {
          if (!best.marine || !current.marine) return best;
          const bestWaves = best.marine.current.wave_height * best.marine.current.wave_period;
          const currentWaves = current.marine.current.wave_height * current.marine.current.wave_period;
          return currentWaves > bestWaves ? current : best;
        });
        bestSurfConditions = bestSurf.displayName;
      }

      // Wind conditions assessment - handle optional values
      const windSpeeds = cityWeatherData
        .map(city => city.weather.current?.wind_speed_10m)
        .filter((speed): speed is number => speed !== undefined && speed !== null);
      
      const maxWindSpeed = windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0;
      let windConditions: 'calm' | 'breezy' | 'windy' | 'stormy';
      if (maxWindSpeed < 10) windConditions = 'calm';
      else if (maxWindSpeed < 20) windConditions = 'breezy';
      else if (maxWindSpeed < 35) windConditions = 'windy';
      else windConditions = 'stormy';

      // UV risk assessment
      const uvIndices = cityWeatherData
        .filter(city => city.airQuality?.current.uv_index !== undefined)
        .map(city => city.airQuality!.current.uv_index);
      
      let uvRisk: 'low' | 'moderate' | 'high' | 'very-high' = 'low';
      if (uvIndices.length > 0) {
        const maxUV = Math.max(...uvIndices);
        if (maxUV >= 8) uvRisk = 'very-high';
        else if (maxUV >= 6) uvRisk = 'high';
        else if (maxUV >= 3) uvRisk = 'moderate';
      }

      // Air quality assessment
      const pm25Values = cityWeatherData
        .filter(city => city.airQuality?.current.pm2_5 !== undefined)
        .map(city => city.airQuality!.current.pm2_5);
      
      let airQuality: 'excellent' | 'good' | 'moderate' | 'poor' = 'excellent';
      if (pm25Values.length > 0) {
        const maxPM25 = Math.max(...pm25Values);
        if (maxPM25 > 35) airQuality = 'poor';
        else if (maxPM25 > 15) airQuality = 'moderate';
        else if (maxPM25 > 5) airQuality = 'good';
      }

      const result: ComprehensiveWeatherData = {
        cities: cityWeatherData,
        summary: {
          bestWeatherCity,
          bestSurfConditions,
          averageTemp,
          windConditions,
          uvRisk,
          airQuality
        },
        lastUpdated: new Date()
      };

      console.log(`[RealTimeDataService] Fetched weather data: ${cityWeatherData.length} cities, avg temp: ${averageTemp.toFixed(1)}°C, best weather: ${bestWeatherCity}`);
      return result;

    } catch (error) {
      console.error('Error in fetchWeatherData:', error);
      return null;
    }
  }

  private async makeQueuedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.isProcessingQueue) {
        this.processRequestQueue();
      }
    });
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      // Check if we're in backoff period
      if (this.backoffUntil > Date.now()) {
        const backoffTime = this.backoffUntil - Date.now();
        console.log(`In backoff period, waiting ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        this.backoffUntil = 0;
      }
      
      // Ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      
      const request = this.requestQueue.shift();
      if (request) {
        try {
          this.lastRequestTime = Date.now();
          await request();
          this.consecutiveFailures = 0; // Reset failures on success
        } catch (error) {
          this.consecutiveFailures++;
          console.error(`Request failed (${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES}):`, error);
          
          if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
            // Implement exponential backoff
            const backoffTime = Math.min(Math.pow(2, this.consecutiveFailures - this.MAX_CONSECUTIVE_FAILURES) * 30000, 300000); // Max 5 minutes
            this.backoffUntil = Date.now() + backoffTime;
            console.log(`Too many consecutive failures, backing off for ${backoffTime}ms`);
          }
        }
      }
    }
    
    this.isProcessingQueue = false;
  }
} 