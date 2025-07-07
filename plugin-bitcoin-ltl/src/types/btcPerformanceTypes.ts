/**
 * BTC-Centric Performance Types
 * All asset performance measured against Bitcoin as the benchmark
 */

// ============================================================================
// CORE BTC PERFORMANCE METRICS
// ============================================================================

export interface BTCPerformanceMetrics {
  // Time-based performance vs BTC
  performance24h: number;    // 24-hour performance vs BTC
  performance7d: number;     // 7-day performance vs BTC
  performance30d: number;    // 30-day performance vs BTC
  performanceYTD: number;    // Year-to-date performance vs BTC
  performanceInception: number; // Since BTC inception (2009) vs BTC
  
  // Relative performance indicators
  outperformingBTC: boolean;
  rank: number; // Rank among tracked assets (1 = best performer vs BTC)
  
  // Volatility and risk metrics
  volatilityVsBTC: number;
  correlationWithBTC: number;
  
  // Narrative and context
  narrative: string;
  keyDrivers: string[];
  
  lastUpdated: Date;
}

export interface AssetPerformance {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  
  // BTC-relative performance
  vsBTC: BTCPerformanceMetrics;
  
  // Asset-specific metadata
  category: AssetCategory;
  sector?: string;
  narrative: string;
  
  lastUpdated: Date;
}

export type AssetCategory = 
  | 'BITCOIN_RELATED_STOCK' 
  | 'MAG7_STOCK' 
  | 'TECH_STOCK' 
  | 'INDEX' 
  | 'COMMODITY' 
  | 'TOP_ALTCOIN' 
  | 'MID_ALTCOIN' 
  | 'SMALL_ALTCOIN';

// ============================================================================
// ASSET CLASS PERFORMANCE
// ============================================================================

export interface AssetClassPerformance {
  category: AssetCategory;
  name: string;
  description: string;
  
  // Aggregate performance vs BTC
  aggregatePerformance: BTCPerformanceMetrics;
  
  // Individual assets in this class
  assets: AssetPerformance[];
  
  // Class-specific metrics
  topPerformers: AssetPerformance[];
  underperformers: AssetPerformance[];
  averagePerformance: number;
  
  // Market context
  marketShare: number; // % of total tracked market cap
  narrative: string;
  
  // Additional metrics
  altcoinSeasonIndex?: number;
  
  lastUpdated: Date;
}

// ============================================================================
// KEY ASSETS (SPECIAL FOCUS)
// ============================================================================

export interface KeyAssetPerformance {
  // MicroStrategy (MSTR) - Special focus
  mstr: AssetPerformance & {
    btcHoldings: number;
    btcHoldingsValue: number;
    btcHoldingsVsBtcPerformance: number;
    corporateStrategy: string;
  };
  // Metaplanet (MTPLF) - Add this for compatibility
  mtplf?: AssetPerformance & {
    btcHoldings: number;
    btcHoldingsValue: number;
    narrative: string;
  };
  
  // Magnificent 7
  mag7: AssetClassPerformance;
  
  // Major Indices
  sp500: AssetPerformance;
  nasdaq: AssetPerformance;
  dowJones: AssetPerformance;
  
  // Commodities
  gold: AssetPerformance;
  
  // Top Altcoins
  ethereum: AssetPerformance;
  top100Altcoins: AssetClassPerformance;
  
  // Bitcoin itself (baseline)
  bitcoin: AssetPerformance;
}

// ============================================================================
// HISTORICAL PERFORMANCE
// ============================================================================

export interface HistoricalPerformance {
  // Since BTC inception (2009)
  inceptionToDate: {
    btcReturn: number;
    assetReturn: number;
    btcOutperformance: number;
    rank: number;
    narrative: string;
  };
  
  // Key BTC milestones
  milestones: {
    halvingCycles: MilestonePerformance[];
    bullRuns: MilestonePerformance[];
    bearMarkets: MilestonePerformance[];
  };
  
  // Recent performance trends
  trends: {
    last24Hours: PerformanceTrend;
    last7Days: PerformanceTrend;
    last30Days: PerformanceTrend;
    last90Days: PerformanceTrend;
    lastYear: PerformanceTrend;
  };
}

export interface MilestonePerformance {
  name: string;
  startDate: Date;
  endDate: Date;
  btcPerformance: number;
  assetPerformance: number;
  btcOutperformance: number;
  narrative: string;
}

export interface PerformanceTrend {
  direction: 'IMPROVING' | 'DECLINING' | 'STABLE';
  magnitude: number; // How much improving/declining
  confidence: number; // 0-100
  keyFactors: string[];
}

// ============================================================================
// UNIFIED BTC BENCHMARK DATA
// ============================================================================

export interface BTCPerformanceBenchmark {
  // Core BTC metrics
  btcPrice: number;
  btcMarketCap: number;
  btcDominance: number;
  btcChange24h: number;
  
  // Asset class performance vs BTC
  assetClasses: {
    stocks: AssetClassPerformance;
    altcoins: AssetClassPerformance;
    commodities: AssetClassPerformance;
    indices: AssetClassPerformance;
  };
  
  // Key individual assets vs BTC
  keyAssets: KeyAssetPerformance;
  
  // Historical performance context
  historical: HistoricalPerformance;
  
  // Market intelligence
  marketIntelligence: {
    altcoinSeasonIndex: number; // 0-100 (BTC vs Altcoin dominance)
    overallMarketSentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    btcOutperformanceTrend: PerformanceTrend;
    keyNarratives: string[];
  };
  
  // Timestamp
  lastUpdated: Date;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface BTCBenchmarkResponse {
  success: boolean;
  data: BTCPerformanceBenchmark | null;
  error?: string;
  timestamp: Date;
  cacheStatus: 'FRESH' | 'CACHED' | 'STALE';
}

export interface AssetPerformanceResponse {
  success: boolean;
  data: AssetPerformance | null;
  error?: string;
  timestamp: Date;
}

export interface AssetClassResponse {
  success: boolean;
  data: AssetClassPerformance | null;
  error?: string;
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface BTCBenchmarkConfig {
  // Update intervals (in seconds)
  intervals: {
    realTime: number;      // 30 seconds for real-time data
    marketData: number;    // 5 minutes for market data
    historical: number;    // 1 hour for historical data
  };
  
  // Tracked assets
  trackedAssets: {
    stocks: string[];      // Stock symbols
    altcoins: string[];    // CoinGecko IDs
    indices: string[];     // Index symbols
    commodities: string[]; // Commodity symbols
  };
  
  // Performance thresholds
  thresholds: {
    significantOutperformance: number; // % threshold for "significant"
    highVolatility: number;           // Volatility threshold
    strongCorrelation: number;        // Correlation threshold
  };
  
  // Feature flags
  features: {
    enableHistoricalTracking: boolean;
    enableMilestoneAnalysis: boolean;
    enableTrendAnalysis: boolean;
    enableNarrativeGeneration: boolean;
  };
} 