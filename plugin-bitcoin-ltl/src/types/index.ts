/**
 * CoinGecko Public API interfaces
 */
export interface CoinMarketData {
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

export interface CoinSimplePrice {
  [coinId: string]: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
}

export interface TrendingCoin {
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
export interface BitcoinPriceData {
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
export interface BitcoinThesisData {
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
  lastUpdated: string;
}

/**
 * Altcoin outperformance tracking data
 */
export interface AltcoinOutperformanceData {
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
 * Bitcoin ETF data interfaces
 */
export interface BitcoinETF {
  ticker: string;
  name: string;
  issuer: string;
  launchDate: string;
  expenseRatio: number;
  aum: number; // Assets Under Management in USD
  shares: number;
  nav: number; // Net Asset Value per share
  premium: number; // Premium/discount to NAV
  volume: number;
  bitcoinHoldings: number; // Total Bitcoin held
  bitcoinValue: number; // USD value of Bitcoin holdings
  lastUpdated: string;
}

export interface ETFFlowData {
  ticker: string;
  name: string;
  date: string;
  inflow: number; // Positive for inflows, negative for outflows
  volume: number;
  shares: number;
  nav: number;
  premium: number;
  bitcoinHoldings: number;
  bitcoinValue: number;
  price: number;
  priceChange: number;
  lastUpdated: string;
}

export interface ETFFlowSummary {
  totalNetFlow: number;
  totalInflow: number;
  totalOutflow: number;
  totalVolume: number;
  totalBitcoinHoldings: number;
  totalBitcoinValue: number;
  totalAUM: number;
  averagePremium: number;
  topInflows: ETFFlowData[];
  topOutflows: ETFFlowData[];
  date: string;
  lastUpdated: string;
}

export interface ETFHistoricalData {
  ticker: string;
  name: string;
  data: {
    date: string;
    flow: number;
    volume: number;
    nav: number;
    premium: number;
    bitcoinHoldings: number;
    bitcoinValue: number;
  }[];
  totalFlow: number;
  averageFlow: number;
  lastUpdated: string;
}

export interface ETFMarketData {
  etfs: BitcoinETF[];
  flowSummary: ETFFlowSummary;
  historicalData: ETFHistoricalData[];
  marketMetrics: {
    totalMarketAUM: number;
    totalBitcoinHeld: number;
    totalBitcoinValue: number;
    percentOfSupply: number;
    averageExpenseRatio: number;
    marketLeader: string;
    strongestInflow: string;
    largestOutflow: string;
  };
  lastUpdated: string;
}

// Market data types
export * from "./marketTypes";

// Error types and handling
export * from "./errorTypes";

/**
 * Hotel price data interface for Google Hotels scraping
 */
export interface PriceData {
  currentPrice: number;
  currency: string;
  lastUpdated: string;
  source: string;
  confidence: number;
}

/**
 * Rate opportunity interface for perfect day detection
 */
export interface RateOpportunity {
  hotelId: string;
  hotelName: string;
  date: string;
  currentPrice: number;
  averagePrice: number;
  savingsPercentage: number;
  confidence: number;
}

/**
 * Perfect day opportunity interface for hotel rate intelligence
 */
export interface PerfectDayOpportunity {
  hotelId: string;
  hotelName: string;
  perfectDate: string;
  currentRate: number;
  averageRate: number;
  savingsPercentage: number;
  confidenceScore: number;
  reasons: string[];
  urgency: 'high' | 'medium' | 'low';
}
