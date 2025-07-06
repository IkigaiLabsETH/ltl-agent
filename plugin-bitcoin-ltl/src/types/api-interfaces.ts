/**
 * Comprehensive API Response Interfaces
 * Replaces all 'any' types with proper TypeScript interfaces
 */

// CoinGecko API Interfaces
export interface CoinGeckoSimplePriceResponse {
  bitcoin?: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
  ethereum?: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
  [coinId: string]: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  } | undefined;
}

export interface CoinGeckoMarketDataResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    currency: string;
    percentage: number;
    times: number;
  } | null;
  last_updated: string;
}

export interface CoinGeckoTrendingResponse {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      score: number;
      price_btc: number;
      data?: {
        price_change_percentage_24h?: {
          usd: number;
        };
        market_cap: number;
      };
    };
  }>;
  exchanges: Array<{
    item: {
      id: string;
      name: string;
      market_type: string;
      thumb: string;
      score: number;
    };
  }>;
}

// Blockchain.info API Interfaces
export interface BlockchainInfoResponse {
  hash_rate: number;
  difficulty: number;
  latest_height: number;
  unconfirmed_count: number;
  last_fork_height: number;
  last_fork_hash: string;
}

// Alternative.me API Interfaces
export interface FearGreedIndexResponse {
  name: string;
  data: Array<{
    value: string;
    classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
  metadata: {
    error: string | null;
  };
}

// Mempool.space API Interfaces
export interface MempoolSpaceResponse {
  count: number;
  vsize: number;
  total_fee: number;
  fee_histogram: Array<[number, number]>;
}

export interface MempoolFeesResponse {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface MempoolStatsResponse {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

// DEXScreener API Interfaces
export interface DexScreenerResponse {
  pairs: Array<{
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
      h1: { buys: number; sells: number };
      h24: { buys: number; sells: number };
      h7: { buys: number; sells: number };
    };
    volume: {
      h24: number;
      h6: number;
      h1: number;
    };
    priceChange: {
      h1: number;
      h24: number;
      h7: number;
    };
    liquidity: {
      usd: number;
      base: number;
      quote: number;
    };
    fdv: number;
    pairCreatedAt: number;
  }>;
}

// OpenSea API Interfaces
export interface OpenSeaCollectionResponse {
  collection: {
    banner_image_url: string;
    chat_url: string | null;
    created_date: string;
    default_to_fiat: boolean;
    description: string;
    dev_buyer_fee_basis_points: string;
    dev_seller_fee_basis_points: string;
    discord_url: string | null;
    external_url: string | null;
    featured: boolean;
    featured_image_url: string | null;
    hidden: boolean;
    safelist_request_status: string;
    image_url: string;
    is_subject_to_whitelist: boolean;
    large_image_url: string | null;
    medium_username: string | null;
    name: string;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: string;
    opensea_seller_fee_basis_points: string;
    payout_address: string | null;
    require_email: boolean;
    short_description: string | null;
    slug: string;
    telegram_url: string | null;
    twitter_username: string | null;
    instagram_username: string | null;
    wiki_url: string | null;
    is_nsfw: boolean;
    fees: {
      seller_fees: Record<string, number>;
      opensea_fees: Record<string, number>;
    };
    is_rarity_enabled: boolean;
    is_creator_fees_enforced: boolean;
  };
  address: string;
  config: string;
  stats: {
    one_day_volume: number;
    one_day_change: number;
    one_day_sales: number;
    one_day_average_price: number;
    seven_day_volume: number;
    seven_day_change: number;
    seven_day_sales: number;
    seven_day_average_price: number;
    thirty_day_volume: number;
    thirty_day_change: number;
    thirty_day_sales: number;
    thirty_day_average_price: number;
    total_volume: number;
    total_sales: number;
    total_supply: number;
    count: number;
    num_owners: number;
    average_price: number;
    num_reports: number;
    market_cap: number;
    floor_price: number;
  };
  display_data: {
    card_display_style: string;
  };
  payment_tokens: Array<{
    id: number;
    symbol: string;
    address: string;
    image_url: string;
    name: string;
    decimals: number;
    eth_price: number;
    usd_price: number;
  }>;
  primary_asset_contracts: Array<{
    address: string;
    asset_contract_type: string;
    created_date: string;
    name: string;
    nft_version: string;
    opensea_version: string | null;
    owner: number;
    schema_name: string;
    symbol: string;
    description: string;
    external_link: string | null;
    image_url: string | null;
    default_to_fiat: boolean;
    dev_buyer_fee_basis_points: number;
    dev_seller_fee_basis_points: number;
    only_proxied_transfers: boolean;
    opensea_buyer_fee_basis_points: number;
    opensea_seller_fee_basis_points: number;
    buyer_fee_basis_points: number;
    seller_fee_basis_points: number;
    payout_address: string | null;
  }>;
  traits: Record<string, Array<{
    trait_type: string;
    value: string;
    display_type: string | null;
    max_value: string | null;
    trait_count: number;
    order: string | null;
  }>>;
  sales_stats: {
    one_day_sales: number;
    one_day_average_price: number;
    one_day_change: number;
    one_day_volume: number;
    one_day_difference: number;
    seven_day_sales: number;
    seven_day_average_price: number;
    seven_day_change: number;
    seven_day_volume: number;
    seven_day_difference: number;
    thirty_day_sales: number;
    thirty_day_average_price: number;
    thirty_day_change: number;
    thirty_day_volume: number;
    thirty_day_difference: number;
    total_sales: number;
    total_volume: number;
    total_average_price: number;
    total_change: number;
    total_difference: number;
  };
}

// Weather API Interfaces
export interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      date_epoch: number;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        maxwind_mph: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        totalprecip_in: number;
        totalsnow_cm: number;
        avgvis_km: number;
        avgvis_miles: number;
        avghumidity: number;
        daily_will_it_rain: number;
        daily_chance_of_rain: number;
        daily_will_it_snow: number;
        daily_chance_of_snow: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        uv: number;
      };
      astro: {
        sunrise: string;
        sunset: string;
        moonrise: string;
        moonset: string;
        moon_phase: string;
        moon_illumination: string;
        is_moon_up: number;
        is_sun_up: number;
      };
      hour: Array<{
        time_epoch: number;
        time: string;
        temp_c: number;
        temp_f: number;
        is_day: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        wind_mph: number;
        wind_kph: number;
        wind_degree: number;
        wind_dir: string;
        pressure_mb: number;
        pressure_in: number;
        precip_mm: number;
        precip_in: number;
        humidity: number;
        cloud: number;
        feelslike_c: number;
        feelslike_f: number;
        windchill_c: number;
        windchill_f: number;
        heatindex_c: number;
        heatindex_f: number;
        dewpoint_c: number;
        dewpoint_f: number;
        will_it_rain: number;
        chance_of_rain: number;
        will_it_snow: number;
        chance_of_snow: number;
        vis_km: number;
        vis_miles: number;
        gust_mph: number;
        gust_kph: number;
        uv: number;
      }>;
    }>;
  };
}

// Stock Market API Interfaces
export interface StockApiResponse {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
}

// ETF Flow API Interfaces
export interface EtfFlowResponse {
  symbol: string;
  name: string;
  aum: number;
  flow24h: number;
  flow7d: number;
  flow30d: number;
  flowYtd: number;
  lastUpdated: string;
}

// Travel API Interfaces
export interface HotelSearchResponse {
  hotels: Array<{
    id: string;
    name: string;
    rating: number;
    price: number;
    currency: string;
    location: {
      address: string;
      city: string;
      country: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
    amenities: string[];
    images: string[];
    description: string;
  }>;
  totalResults: number;
  searchParams: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
}

// Generic API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
  source: string;
}

// Batch API Response
export interface BatchApiResponse {
  results: Array<{
    endpoint: string;
    success: boolean;
    data: unknown;
    error?: string;
    duration: number;
  }>;
  totalDuration: number;
  timestamp: string;
}

// Additional CoinGecko interfaces
export interface CoinGeckoGlobalDataResponse {
  data: {
    total_market_cap?: {
      usd: number;
    };
    total_volume?: {
      usd: number;
    };
    market_cap_change_percentage_24h_usd?: number;
    active_cryptocurrencies?: number;
    market_cap_percentage?: {
      btc: number;
    };
  };
}

export interface CoinGeckoExchangeRatesResponse {
  rates: Record<string, {
    name: string;
    unit: string;
    value: number;
    type: string;
  }>;
} 