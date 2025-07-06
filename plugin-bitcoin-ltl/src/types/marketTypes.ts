// CoinGecko Public API interfaces
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

// Bitcoin price data interface
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

// Bitcoin thesis tracking data interface
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

// Altcoin Bitcoin performance data interface
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

// Altcoin outperformance tracking data
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