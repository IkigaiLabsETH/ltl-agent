/**
 * Comprehensive Bitcoin Intelligence Types
 * Unified type system for Bitcoin-native intelligence with market awareness
 */

// ============================================================================
// CORE BITCOIN NETWORK INTELLIGENCE
// ============================================================================

export interface BitcoinNetworkData {
  // Core Bitcoin Metrics
  price: number;
  marketCap: number;
  dominance: number;
  hashRate: number;
  difficulty: number;
  blockHeight: number;
  avgBlockTime: number;
  avgBlockSize: number;
  totalBTC: number;
  
  // Mempool & Fees
  mempoolSize: number;
  mempoolTxs: number;
  feeRate: {
    fastest: number;
    halfHour: number;
    economy: number;
  };
  
  // Lightning Network
  lightningCapacity: number;
  lightningChannels: number;
  lightningLiquidity: number;
  
  // Network Health Indicators
  networkSecurity: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  mempoolStatus: 'OPTIMAL' | 'NORMAL' | 'CONGESTED' | 'OVERFLOW';
  feeStatus: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
  
  // On-Chain Analytics
  activeAddresses: number;
  longTermHolders: number;
  exchangeFlows: number;
  realizedCap: number;
  mvrvRatio: number;
  
  // Mining Data
  miningRevenue: number;
  miningRevenue24h: number;
  nextHalving: {
    blocks: number;
    estimatedDate: string;
    daysRemaining: number;
  };
  
  // Nodes & Distribution
  totalNodes: number;
  nodeCountries: number;
  
  // Timestamp
  lastUpdated: Date;
}

// ============================================================================
// MARKET INTELLIGENCE
// ============================================================================

export interface MarketIntelligence {
  // Altcoin Performance vs Bitcoin
  altcoinSeasonIndex: number; // 0-100 (Bitcoin vs Altcoin dominance)
  bitcoinRelativePerformance: number;
  topPerformers: AltcoinBTCPerformance[];
  underperformers: AltcoinBTCPerformance[];
  
  // Stock Market Correlation
  teslaVsBitcoin: number;
  mag7VsBitcoin: number;
  microstrategyPerformance: number;
  sp500VsBitcoin: number;
  goldVsBitcoin: number;
  
  // Macro Economic Indicators
  dollarIndex: number;
  treasuryYields: number;
  inflationRate: number;
  fedPolicy: 'HAWKISH' | 'NEUTRAL' | 'DOVISH';
  moneySupply: number;
  
  // ETF Intelligence
  spotBitcoinETFs: ETFData;
  
  // Market Sentiment
  fearGreedIndex: number;
  fearGreedValue: string;
  
  // Timestamp
  lastUpdated: Date;
}

export interface AltcoinBTCPerformance {
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
  narrative: string;
  lastUpdated: Date;
}

export interface ETFData {
  totalAUM: number;
  dailyFlows: number;
  weeklyFlows: number;
  monthlyFlows: number;
  topHolders: string[];
  institutionalAdoption: number;
  averageExpenseRatio: number;
  totalBitcoinHeld: number;
  percentOfSupply: number;
  marketLeader: string;
  strongestInflow: string;
  largestOutflow: string;
  lastUpdated: Date;
}

// ============================================================================
// INSTITUTIONAL ADOPTION INTELLIGENCE
// ============================================================================

export interface BitcoinInstitutionalData {
  // Corporate Treasuries
  corporateTreasuries: CorporateTreasury[];
  totalCorporateHoldings: number;
  corporateAdoptionScore: number; // 0-100 scale
  
  // Sovereign Adoption
  sovereignAdoption: SovereignAdoption[];
  totalSovereignHoldings: number;
  sovereignAdoptionScore: number; // 0-100 scale
  
  // ETF Metrics
  etfMetrics: ETFMetrics;
  
  // Banking Integration
  bankingIntegration: BankingIntegration[];
  bankingAdoptionScore: number; // 0-100 scale
  
  // Overall Adoption Score
  adoptionScore: number; // 0-100 scale
  
  // Timestamp
  lastUpdated: Date;
}

export interface CorporateTreasury {
  company: string;
  ticker: string;
  bitcoinHoldings: number;
  bitcoinValue: number;
  acquisitionDate: string;
  averagePrice: number;
  currentValue: number;
  percentageOfTreasury: number;
  lastUpdated: Date;
}

export interface SovereignAdoption {
  country: string;
  bitcoinHoldings: number;
  bitcoinValue: number;
  legalStatus: 'LEGAL_TENDER' | 'RESERVE_ASSET' | 'LEGAL' | 'RESTRICTED' | 'BANNED';
  adoptionDate: string;
  lastUpdated: Date;
}

export interface ETFMetrics {
  totalAUM: number;
  totalBitcoinHeld: number;
  percentOfSupply: number;
  dailyFlows: number;
  institutionalShare: number;
  topETFs: ETFHolding[];
  lastUpdated: Date;
}

export interface ETFHolding {
  ticker: string;
  name: string;
  issuer: string;
  aum: number;
  bitcoinHoldings: number;
  dailyFlows: number;
  expenseRatio: number;
  lastUpdated: Date;
}

export interface BankingIntegration {
  institution: string;
  services: string[];
  integrationLevel: 'CUSTODY' | 'TRADING' | 'LENDING' | 'PAYMENTS' | 'FULL_SERVICE';
  bitcoinExposure: number;
  lastUpdated: Date;
}

// ============================================================================
// ON-CHAIN ANALYTICS
// ============================================================================

export interface BitcoinOnChainData {
  // Address Analysis
  activeAddresses: number;
  newAddresses: number;
  longTermHolders: number;
  shortTermHolders: number;
  
  // Flow Analysis
  exchangeFlows: number;
  exchangeInflows: number;
  exchangeOutflows: number;
  netFlowDirection: 'INFLOW' | 'OUTFLOW' | 'NEUTRAL';
  
  // HODL Waves
  hodlWaves: HODLWave[];
  averageHODLTime: number;
  
  // Realized Metrics
  realizedCap: number;
  mvrvRatio: number;
  sopr: number; // Spent Output Profit Ratio
  
  // Whale Activity
  whaleTransactions: number;
  whaleHoldings: number;
  whaleMovements: WhaleMovement[];
  
  // Timestamp
  lastUpdated: Date;
}

export interface HODLWave {
  age: string; // e.g., "1d-1w", "1w-1m", "1m-3m", etc.
  percentage: number;
  value: number;
  lastUpdated: Date;
}

export interface WhaleMovement {
  type: 'INFLOW' | 'OUTFLOW' | 'INTERNAL';
  amount: number;
  timestamp: Date;
  source?: string;
  destination?: string;
}

// ============================================================================
// SENTIMENT & PHILOSOPHY
// ============================================================================

export interface BitcoinSentimentData {
  // Market Sentiment
  fearGreedIndex: number;
  fearGreedValue: string;
  
  // Social Sentiment
  socialSentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  socialVolume: number;
  trendingTopics: string[];
  
  // News Sentiment
  newsSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  newsVolume: number;
  topHeadlines: NewsHeadline[];
  
  // Technical Sentiment
  technicalSentiment: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  technicalIndicators: TechnicalIndicator[];
  
  // Timestamp
  lastUpdated: Date;
}

export interface NewsHeadline {
  title: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  source: string;
  timestamp: Date;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  strength: number; // 0-100
}

// ============================================================================
// UNIFIED BITCOIN INTELLIGENCE
// ============================================================================

export interface BitcoinIntelligenceData {
  network: BitcoinNetworkData;
  market: MarketIntelligence;
  onChain: BitcoinOnChainData;
  sentiment: BitcoinSentimentData;
  institutional: BitcoinInstitutionalData;
  lastUpdated: Date;
}

// ============================================================================
// OPPORTUNITY DETECTION
// ============================================================================

export interface BitcoinOpportunity {
  type: 'NETWORK_HEALTH' | 'MARKET_ROTATION' | 'MACRO_CATALYST' | 'INSTITUTIONAL_FLOW' | 'TECHNICAL_SIGNAL';
  signal: string;
  action: string;
  confidence: number; // 0-100
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
  data?: any;
}

export interface BitcoinCycleAnalysis {
  currentPhase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
  cycleProgress: number; // 0-100
  expectedPeak: Date;
  expectedBottom: Date;
  priceTargets: {
    conservative: number;
    moderate: number;
    optimistic: number;
    extreme: number;
  };
  exitStrategy: {
    startTrimming: number;
    aggressiveSelling: number;
    finalExit: number;
  };
  reentryStrategy: {
    targetZone: { min: number; max: number };
    timing: string;
    method: string;
  };
  lastUpdated: Date;
}

// ============================================================================
// MORNING BRIEFING
// ============================================================================

export interface BitcoinMorningBriefing {
  timestamp: Date;
  bitcoinStatus: {
    price: number;
    change24h: number;
    marketCap: number;
    dominance: number;
  };
  networkHealth: {
    status: string;
    hashRate: number;
    mempoolStatus: string;
    feeStatus: string;
  };
  marketContext: {
    altcoinSeasonIndex: number;
    bitcoinRelativePerformance: number;
    macroEnvironment: string;
  };
  institutionalAdoption: {
    score: number;
    recentFlows: number;
    topMovers: string[];
  };
  opportunities: BitcoinOpportunity[];
  actionableInsights: string[];
  philosophy: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface BitcoinIntelligenceResponse {
  success: boolean;
  data: BitcoinIntelligenceData | null;
  error?: string;
  timestamp: Date;
  cacheStatus: 'FRESH' | 'CACHED' | 'STALE';
}

export interface BitcoinBriefingResponse {
  success: boolean;
  data: BitcoinMorningBriefing | null;
  error?: string;
  timestamp: Date;
}

export interface BitcoinOpportunityResponse {
  success: boolean;
  data: BitcoinOpportunity[] | null;
  error?: string;
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface BitcoinIntelligenceConfig {
  // API Configuration
  apis: {
    coingecko: string;
    blockchain: string;
    mempool: string;
    alternative: string;
  };
  
  // Update Intervals (in seconds)
  intervals: {
    networkData: number;
    marketData: number;
    institutionalData: number;
    sentimentData: number;
  };
  
  // Thresholds
  thresholds: {
    highFeeRate: number;
    congestedMempool: number;
    extremeMVRV: number;
    significantFlow: number;
  };
  
  // Feature Flags
  features: {
    enableRealTimeUpdates: boolean;
    enableOpportunityDetection: boolean;
    enableCycleAnalysis: boolean;
    enableInstitutionalTracking: boolean;
  };
} 