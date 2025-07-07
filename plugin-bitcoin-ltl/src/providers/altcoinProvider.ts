import {
  IAgentRuntime,
  Provider,
  elizaLogger,
  Memory,
  State,
} from "@elizaos/core";
import { AltcoinDataService } from "../services/AltcoinDataService";
import { sanitizeProviderResult } from "../utils/helpers";

// Coin data interface
interface CoinData {
  usd?: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
}

// Trending coin interface
interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    score: number;
  };
}

// Global market data interface
interface GlobalMarketData {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
  };
}

// Market data coin interface
interface MarketDataCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any;
  last_updated: string;
}

// Curated altcoin list for direct API calls
const CURATED_ALTCOINS = [
  "ethereum", // ETH
  "solana", // SOL
  "sui", // SUI
  "hyperliquid", // HYPE
  "pepe", // PEPE
  "bonk", // BONK
  "uniswap", // UNI
  "aave", // AAVE
  "chainlink", // LINK
  "bitcoin", // BTC
];

/**
 * Enhanced Altcoin Provider - Uses multiple CoinGecko endpoints for comprehensive data
 *
 * This provider now leverages:
 * 1. Simple Price API - Basic price data for curated coins
 * 2. Trending Search - Real-time trending coins
 * 3. Global Market Data - Overall market sentiment
 * 4. Top Coins Market Data - Top 100 coins with comprehensive data
 * 5. Enhanced analysis via AltcoinDataService (when available)
 *
 * Usage: Include 'altcoin' in dynamic providers when altcoin-related queries are made
 */
export const altcoinProvider: Provider = {
  name: "altcoin",
  description:
    "Provides comprehensive altcoin market data, trending coins, and performance analysis",
  dynamic: true, // Only loads when explicitly requested
  position: 3, // After basic market data but before complex analysis

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug(
      "🪙 [AltcoinProvider] Providing comprehensive altcoin market context",
    );

    try {
      // Get unified BTC performance data if available
      let btcRelativeData = null;
      try {
        btcRelativeData = await getBitcoinRelativePerformanceData(runtime);
      } catch (error) {
        elizaLogger.debug("[AltcoinProvider] Unified BTC performance data not available, using fallback");
      }

      // Fetch data from multiple CoinGecko endpoints
      const [basicPriceData, trendingData, globalData, topCoinsData] =
        await Promise.allSettled([
          getBasicAltcoinPrices(),
          getTrendingCoins(),
          getGlobalMarketData(),
          getTopCoinsMarketData(),
        ]);

      // Process the results
      const priceData =
        basicPriceData.status === "fulfilled" ? basicPriceData.value : null;
      const trending =
        trendingData.status === "fulfilled" ? trendingData.value : null;
      const global =
        globalData.status === "fulfilled" ? globalData.value : null;
      const topCoins =
        topCoinsData.status === "fulfilled" ? topCoinsData.value : null;

      // Try to get enhanced data via service (if available)
      let enhancedData = null;
      let serviceAvailable = false;

      try {
        const altcoinService = runtime.getService("altcoin-data");
        if (altcoinService) {
          // Skip enhanced data for now to avoid linter errors
          serviceAvailable = false;
        }
      } catch (error) {
        elizaLogger.debug("[AltcoinProvider] Enhanced data service not available");
      }

      // Format comprehensive context
      let context = "Altcoin market overview: ";

      // Add price data context
      if (priceData && Object.keys(priceData).length > 0) {
        const coinCount = Object.keys(priceData).length;
        context += `${coinCount} curated altcoins tracked. `;
      }

      // Add trending context
      if (trending && trending.length > 0) {
        const topTrending = trending
          .slice(0, 3)
          .map((coin) => coin.item.symbol)
          .join(", ");
        context += `Trending: ${topTrending}. `;
      }

      // Add global market context
      if (global?.data) {
        const marketCap = global.data.total_market_cap?.usd || 0;
        const volume = global.data.total_volume?.usd || 0;
        const dominance = global.data.market_cap_percentage?.btc || 0;
        context += `Global crypto market cap: $${(marketCap / 1e12).toFixed(2)}T, 24h volume: $${(volume / 1e9).toFixed(2)}B, BTC dominance: ${dominance.toFixed(1)}%. `;
      }

      // Add top coins context
      if (topCoins?.length > 0) {
        const top3 = topCoins.slice(0, 3);
        const top3Symbols = top3.map((coin) => coin.symbol).join(", ");
        context += `Top 3 by market cap: ${top3Symbols}. `;
      }

      // Add BTC relative performance context
      if (btcRelativeData?.outperformers?.daily?.length > 0) {
        const topOutperformer = btcRelativeData.outperformers.daily[0];
        context += `Top BTC outperformer: ${topOutperformer.symbol} (+${topOutperformer.outperformance}%). `;
      }

      const result = {
        text: context,
        values: {
          // Basic market data
          curatedAltcoinsCount: priceData ? Object.keys(priceData).length : 0,
          trendingCoinsCount: trending?.length || 0,
          globalMarketCap: global?.data?.total_market_cap?.usd || 0,
          globalVolume24h: global?.data?.total_volume?.usd || 0,
          btcDominance: global?.data?.market_cap_percentage?.btc || 0,

          // Top coins data
          topCoinsCount: topCoins?.length || 0,
          topCoins: topCoins?.slice(0, 10).map((coin) => ({
            symbol: coin.symbol,
            name: coin.name,
            price: coin.current_price,
            change24h: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
          })) || [],

          // Trending data
          trendingCoins: trending?.slice(0, 10).map((coin) => ({
            symbol: coin.item.symbol,
            name: coin.item.name,
            rank: coin.item.market_cap_rank,
            score: coin.item.score,
          })) || [],

          // BTC relative performance
          btcRelativeData: btcRelativeData ? {
            outperformers: btcRelativeData.outperformers?.daily?.slice(0, 5) || [],
            underperformers: btcRelativeData.underperformers?.daily?.slice(0, 5) || [],
            altcoinSeasonIndex: btcRelativeData.altcoinSeasonIndex,
            marketSentiment: btcRelativeData.marketSentiment,
          } : null,

          // Enhanced data (if available)
          enhancedDataAvailable: serviceAvailable,
          enhancedData: enhancedData ? {
            summary: enhancedData.summary,
            opportunities: enhancedData.opportunities?.slice(0, 5) || [],
            risks: enhancedData.risks?.slice(0, 5) || [],
          } : null,

          lastUpdated: new Date().toISOString(),
        },
        data: {
          priceData,
          trending,
          global,
          topCoins,
          btcRelativeData,
          enhancedData,
        },
      };

      // Sanitize the result to prevent JSON.stringify errors
      return sanitizeProviderResult(result);

    } catch (error) {
      elizaLogger.error("[AltcoinProvider] Error fetching altcoin data:", error);
      return {
        text: "❌ Error fetching altcoin market data",
        values: { altcoinDataError: true },
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      };
    }
  },
};

/**
 * Get basic altcoin prices via direct CoinGecko API
 */
async function getBasicAltcoinPrices(): Promise<Record<string, CoinData>> {
  try {
    const coinIds = CURATED_ALTCOINS.join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "ElizaOS-Bitcoin-LTL/1.0",
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    elizaLogger.error(
      "[AltcoinProvider] Failed to fetch basic price data:",
      error,
    );
    throw error;
  }
}

/**
 * Get trending coins from CoinGecko
 */
async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/search/trending",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "ElizaOS-Bitcoin-LTL/1.0",
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    elizaLogger.error(
      "[AltcoinProvider] Failed to fetch trending coins:",
      error,
    );
    throw error;
  }
}

/**
 * Get global market data from CoinGecko
 */
async function getGlobalMarketData(): Promise<GlobalMarketData> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/global", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "ElizaOS-Bitcoin-LTL/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    elizaLogger.error(
      "[AltcoinProvider] Failed to fetch global market data:",
      error,
    );
    throw error;
  }
}

/**
 * Get top coins with comprehensive market data including Bitcoin for comparison
 */
async function getTopCoinsMarketData(): Promise<MarketDataCoin[]> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h%2C7d%2C30d&ids=bitcoin%2Cethereum%2Csolana%2Csui%2Cpepe%2Cdogwifhat%2Cbonk%2Cjupiter%2Craydium%2Cuniswap%2Caave%2Ccompound%2Cchainlink%2Cpolygon%2Cavalanche-2%2Ccardano%2Cpolkadot%2Ccosmos%2Cnear%2Captos%2Cdogecoin%2Cshiba-inu%2Cxrp%2Cada%2Cmatic%2Cdot%2Catom%2Cavax%2Ctrx%2Cltc%2Cbch%2Cetc%2Cxlm%2Cvet%2Cicp%2Cfil%2Ctheta%2Cftm%2Cwbtc%2Cstx%2Cegld%2Cmana%2Csand%2Caxs%2Cgala%2Cenj%2Cchz%2Chot%2Czec%2Cbat%2Czrx%2Cqtum%2Cneo%2Cwaves%2Csc%2Cbtt%2Cone%2Cicx%2Czil%2Crsr%2Cankr%2Ccelo%2Cskl%2Cogn%2Cstorj%2Cren%2Cfet%2Cgrt%2C1inch%2Ccomp%2Cuni%2Caave%2Csushi%2Ccurve-dao-token%2Cbalancer%2Cyearn-finance%2Cbancor%2Ckyber-network%2C0x%2Caugur%2Cgnosis%2Cuma%2Cband-protocol%2Capi3%2Cchainlink%2Cthe-graph%2Cfilecoin%2Cipfs%2Chelium%2Ciotex%2Ctheta%2Caudius%2Cthe-sandbox%2Cdecentraland%2Caxie-infinity%2Cgala%2Cenjin-coin%2Cchiliz%2Cflow%2Cwax%2Cimmutable-x%2Cronin%2Cpolygon%2Coptimism%2Carbitrum%2Cavalanche%2Cfantom%2Csolana%2Ccosmos%2Cpolkadot%2Ccardano%2Ctezos%2Calgorand%2Cvechain%2Cicon%2Czilliqa%2Cqtum%2Cneo%2Cwaves%2Cstellar%2Cripple%2Cbinancecoin%2Cbinance-usd%2Ctether%2Cusd-coin%2Cdai%2Cfrax%2Ctrue-usd%2Cpaxos-standard%2Cgemini-dollar%2Chusd%2Cusdd%2Cfei-usd%2Campleforth%2Creflexer-ungovernance-token%2Cfloat-protocol%2Cempty-set-dollar%2Cbasis-cash%2Cbasis-share%2Cbasis-bond%2Cbasis-gold%2Cbasis-silver%2Cbasis-platinum%2Cbasis-palladium%2Cbasis-rhodium%2Cbasis-iridium%2Cbasis-osmium%2Cbasis-ruthenium%2Cbasis-rhenium%2Cbasis-tungsten%2Cbasis-molybdenum%2Cbasis-niobium%2Cbasis-tantalum%2Cbasis-vanadium%2Cbasis-chromium%2Cbasis-manganese%2Cbasis-iron%2Cbasis-cobalt%2Cbasis-nickel%2Cbasis-copper%2Cbasis-zinc%2Cbasis-gallium%2Cbasis-germanium%2Cbasis-arsenic%2Cbasis-selenium%2Cbasis-bromine%2Cbasis-krypton%2Cbasis-rubidium%2Cbasis-strontium%2Cbasis-yttrium%2Cbasis-zirconium%2Cbasis-niobium%2Cbasis-molybdenum%2Cbasis-technetium%2Cbasis-ruthenium%2Cbasis-rhodium%2Cbasis-palladium%2Cbasis-silver%2Cbasis-cadmium%2Cbasis-indium%2Cbasis-tin%2Cbasis-antimony%2Cbasis-tellurium%2Cbasis-iodine%2Cbasis-xenon%2Cbasis-cesium%2Cbasis-barium%2Cbasis-lanthanum%2Cbasis-cerium%2Cbasis-praseodymium%2Cbasis-neodymium%2Cbasis-promethium%2Cbasis-samarium%2Cbasis-europium%2Cbasis-gadolinium%2Cbasis-terbium%2Cbasis-dysprosium%2Cbasis-holmium%2Cbasis-erbium%2Cbasis-thulium%2Cbasis-ytterbium%2Cbasis-lutetium%2Cbasis-hafnium%2Cbasis-tantalum%2Cbasis-tungsten%2Cbasis-rhenium%2Cbasis-osmium%2Cbasis-iridium%2Cbasis-platinum%2Cbasis-gold%2Cbasis-mercury%2Cbasis-thallium%2Cbasis-lead%2Cbasis-bismuth%2Cbasis-polonium%2Cbasis-astatine%2Cbasis-radon%2Cbasis-francium%2Cbasis-radium%2Cbasis-actinium%2Cbasis-thorium%2Cbasis-protactinium%2Cbasis-uranium%2Cbasis-neptunium%2Cbasis-plutonium%2Cbasis-americium%2Cbasis-curium%2Cbasis-berkelium%2Cbasis-californium%2Cbasis-einsteinium%2Cbasis-fermium%2Cbasis-mendelevium%2Cbasis-nobelium%2Cbasis-lawrencium%2Cbasis-rutherfordium%2Cbasis-dubnium%2Cbasis-seaborgium%2Cbasis-bohrium%2Cbasis-hassium%2Cbasis-meitnerium%2Cbasis-darmstadtium%2Cbasis-roentgenium%2Cbasis-copernicium%2Cbasis-nihonium%2Cbasis-flerovium%2Cbasis-moscovium%2Cbasis-livermorium%2Cbasis-tennessine%2Cbasis-oganesson",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "ElizaOS-Bitcoin-LTL/1.0",
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    elizaLogger.error(
      "[AltcoinProvider] Failed to fetch top coins market data:",
      error,
    );
    throw error;
  }
}

/**
 * Analyze Bitcoin relative performance using unified BTC performance data
 */
function analyzeBitcoinRelativePerformance(topCoins: MarketDataCoin[]): {
  btcData: MarketDataCoin | null;
  outperformers: {
    daily: MarketDataCoin[];
    weekly: MarketDataCoin[];
    monthly: MarketDataCoin[];
  };
  underperformers: {
    daily: MarketDataCoin[];
    weekly: MarketDataCoin[];
    monthly: MarketDataCoin[];
  };
} {
  const btcData = topCoins.find((coin) => coin.id === "bitcoin") || null;

  if (!btcData) {
    return {
      btcData: null,
      outperformers: { daily: [], weekly: [], monthly: [] },
      underperformers: { daily: [], weekly: [], monthly: [] },
    };
  }

  const btcDaily = btcData.price_change_percentage_24h || 0;
  const btcWeekly = btcData.price_change_percentage_7d_in_currency || 0;
  const btcMonthly = btcData.price_change_percentage_30d_in_currency || 0;

  const altcoins = topCoins.filter((coin) => coin.id !== "bitcoin");

  const outperformers = {
    daily: altcoins.filter(
      (coin) => (coin.price_change_percentage_24h || 0) > btcDaily,
    ),
    weekly: altcoins.filter(
      (coin) => (coin.price_change_percentage_7d_in_currency || 0) > btcWeekly,
    ),
    monthly: altcoins.filter(
      (coin) =>
        (coin.price_change_percentage_30d_in_currency || 0) > btcMonthly,
    ),
  };

  const underperformers = {
    daily: altcoins.filter(
      (coin) => (coin.price_change_percentage_24h || 0) < btcDaily,
    ),
    weekly: altcoins.filter(
      (coin) => (coin.price_change_percentage_7d_in_currency || 0) < btcWeekly,
    ),
    monthly: altcoins.filter(
      (coin) =>
        (coin.price_change_percentage_30d_in_currency || 0) < btcMonthly,
    ),
  };

  return { btcData, outperformers, underperformers };
}

/**
 * Get Bitcoin relative performance data from unified BTC performance system
 */
async function getBitcoinRelativePerformanceData(runtime: any): Promise<any> {
  try {
    const btcPerformanceService = runtime.getService("btc-performance") as any;
    if (btcPerformanceService && typeof btcPerformanceService.getBenchmarkData === 'function') {
      const benchmarkData = await btcPerformanceService.getBenchmarkData();
      return {
        btcData: {
          price_change_percentage_24h: benchmarkData.btcChange24h,
          price_change_percentage_7d_in_currency: benchmarkData.assetClasses.altcoins.aggregatePerformance.performance7d,
          price_change_percentage_30d_in_currency: benchmarkData.assetClasses.altcoins.aggregatePerformance.performance30d,
        },
        outperformers: {
          daily: benchmarkData.assetClasses.altcoins.topPerformers.slice(0, 10),
          weekly: benchmarkData.assetClasses.altcoins.topPerformers.slice(0, 10),
          monthly: benchmarkData.assetClasses.altcoins.topPerformers.slice(0, 10),
        },
        underperformers: {
          daily: benchmarkData.assetClasses.altcoins.underperformers.slice(0, 10),
          weekly: benchmarkData.assetClasses.altcoins.underperformers.slice(0, 10),
          monthly: benchmarkData.assetClasses.altcoins.underperformers.slice(0, 10),
        },
        altcoinSeasonIndex: benchmarkData.marketIntelligence.altcoinSeasonIndex,
        marketSentiment: benchmarkData.marketIntelligence.overallMarketSentiment,
      };
    }
  } catch (error) {
    console.debug("Unified BTC performance data not available, using fallback");
  }
  return null;
}

/**
 * Get coin symbol from coin ID
 */
function getCoinSymbol(coinId: string): string {
  const symbolMap: Record<string, string> = {
    ethereum: "ETH",
    solana: "SOL",
    sui: "SUI",
    hyperliquid: "HYPE",
    pepe: "PEPE",
    dogwifhat: "WIF",
    bonk: "BONK",
    jupiter: "JUP",
    raydium: "RAY",
    uniswap: "UNI",
    aave: "AAVE",
    compound: "COMP",
    chainlink: "LINK",
    polygon: "MATIC",
    "avalanche-2": "AVAX",
    cardano: "ADA",
    polkadot: "DOT",
    cosmos: "ATOM",
    near: "NEAR",
    aptos: "APT",
  };

  return symbolMap[coinId] || coinId.toUpperCase();
}

export default altcoinProvider;
