import {
  IAgentRuntime,
  Provider,
  elizaLogger,
  Memory,
  State,
} from "@elizaos/core";
import { AltcoinDataService } from "../services/AltcoinDataService";

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
    "Provides comprehensive altcoin market data using multiple CoinGecko endpoints",
  dynamic: true, // Only loads when explicitly requested
  position: 3, // After basic market data but before complex analysis

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    elizaLogger.debug(
      "🪙 [AltcoinProvider] Providing comprehensive altcoin market context",
    );

    try {
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
        const altcoinService = runtime.getService(
          "altcoin-data",
        ) as AltcoinDataService;
        if (altcoinService) {
          enhancedData = {
            curatedAltcoins: altcoinService.getCuratedAltcoinsData(),
            top100VsBtc: altcoinService.getTop100VsBtcData(),
            dexScreener: altcoinService.getDexScreenerData(),
            topMovers: altcoinService.getTopMoversData(),
            trending: altcoinService.getTrendingCoinsData(),
          };
          serviceAvailable = true;
        }
      } catch (serviceError) {
        elizaLogger.warn(
          "[AltcoinProvider] Service not available, using API data only",
        );
      }

      // Build comprehensive response
      if (serviceAvailable && enhancedData) {
        return buildEnhancedResponse(priceData, enhancedData);
      } else {
        return buildComprehensiveResponse(
          priceData,
          trending,
          global,
          topCoins,
        );
      }
    } catch (error) {
      elizaLogger.error(
        "[AltcoinProvider] Error providing altcoin context:",
        error,
      );
      return {
        text: "Altcoin market services encountered an error. Please try again later.",
        values: {
          altcoinDataAvailable: false,
          error: error.message,
        },
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
 * Analyze Bitcoin-relative performance across timeframes
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
 * Build comprehensive response using multiple API endpoints
 */
function buildComprehensiveResponse(
  priceData: Record<string, CoinData> | null,
  trending: TrendingCoin[] | null,
  global: GlobalMarketData | null,
  topCoins: MarketDataCoin[] | null,
): any {
  const context = [];

  // Global market overview
  if (global) {
    const globalData = global.data;
    const totalMarketCap = globalData.total_market_cap.usd || 0;
    const totalVolume = globalData.total_volume.usd || 0;
    const marketCapChange =
      globalData.market_cap_change_percentage_24h_usd || 0;

    context.push(`🌍 GLOBAL CRYPTO MARKET:`);
    context.push(
      `• Total Market Cap: $${(totalMarketCap / 1000000000000).toFixed(1)}T`,
    );
    context.push(`• 24h Volume: $${(totalVolume / 1000000000).toFixed(1)}B`);
    context.push(
      `• Market Cap Change: ${marketCapChange > 0 ? "+" : ""}${marketCapChange.toFixed(2)}%`,
    );
    context.push("");
  }

  // Curated altcoins performance
  if (priceData) {
    const coins = Object.entries(priceData);
    const validCoins = coins.filter(
      ([_, coinData]) => coinData && coinData.usd,
    );
    const totalCoins = validCoins.length;
    const positiveCoins = validCoins.filter(
      ([_, coinData]) => coinData.usd_24h_change > 0,
    ).length;
    const avgChange =
      validCoins.reduce(
        (sum, [_, coinData]) => sum + (coinData.usd_24h_change || 0),
        0,
      ) / totalCoins;

    // Get top performers
    const topPerformers = validCoins
      .sort((a, b) => (b[1].usd_24h_change || 0) - (a[1].usd_24h_change || 0))
      .slice(0, 3)
      .map(([id, coinData]) => ({
        id,
        symbol: getCoinSymbol(id),
        price: coinData.usd,
        change24h: coinData.usd_24h_change || 0,
        marketCap: coinData.usd_market_cap || 0,
        volume24h: coinData.usd_24h_vol || 0,
      }));

    context.push(`📊 CURATED ALTCOINS (${totalCoins} tracked):`);
    context.push(
      `• Performance: ${positiveCoins} positive, ${totalCoins - positiveCoins} negative`,
    );
    context.push(
      `• Average Change: ${avgChange > 0 ? "+" : ""}${avgChange.toFixed(2)}%`,
    );
    if (topPerformers.length > 0) {
      context.push(
        `• Top Performer: ${topPerformers[0].symbol} (+${topPerformers[0].change24h.toFixed(2)}%)`,
      );
    }
    context.push("");
  }

  // Trending coins
  if (trending && trending.length > 0) {
    context.push(`🔥 TRENDING COINS:`);
    trending.slice(0, 5).forEach((coin, index) => {
      const item = coin.item;
      context.push(
        `${index + 1}. ${item.symbol} (${item.name}) - Rank #${item.market_cap_rank}`,
      );
    });
    context.push("");
  }

  // Bitcoin-relative performance analysis
  if (topCoins && topCoins.length > 0) {
    const btcAnalysis = analyzeBitcoinRelativePerformance(topCoins);

    if (btcAnalysis.btcData) {
      const btc = btcAnalysis.btcData;
      
      // Only show Bitcoin performance if we have meaningful data
      const btc24h = btc.price_change_percentage_24h || 0;
      const btc7d = btc.price_change_percentage_7d_in_currency || 0;
      const btc30d = btc.price_change_percentage_30d_in_currency || 0;
      
      if (btc24h !== 0 || btc7d !== 0 || btc30d !== 0) {
        context.push(`₿ BITCOIN PERFORMANCE:`);
        context.push(
          `• 24h: ${btc24h > 0 ? "+" : ""}${btc24h.toFixed(2)}%`,
        );
        if (btc7d !== 0) {
          context.push(
            `• 7d: ${btc7d > 0 ? "+" : ""}${btc7d.toFixed(2)}%`,
          );
        }
        if (btc30d !== 0) {
          context.push(
            `• 30d: ${btc30d > 0 ? "+" : ""}${btc30d.toFixed(2)}%`,
          );
        }
        context.push("");
      }
    }

    // Top 2 altcoins outperforming Bitcoin (7 days only)
    if (
      btcAnalysis.outperformers.weekly.length > 0 &&
      btcAnalysis.btcData?.price_change_percentage_7d_in_currency
    ) {
      const topWeeklyOutperformers = btcAnalysis.outperformers.weekly
        .sort(
          (a, b) =>
            (b.price_change_percentage_7d_in_currency || 0) -
            (a.price_change_percentage_7d_in_currency || 0),
        )
        .slice(0, 2); // Only top 2

      context.push(`🚀 TOP 2 ALTCOINS OUTPERFORMING BTC (7d):`);
      topWeeklyOutperformers.forEach((coin, index) => {
        const btcChange =
          btcAnalysis.btcData?.price_change_percentage_7d_in_currency || 0;
        const outperformance =
          (coin.price_change_percentage_7d_in_currency || 0) - btcChange;
        context.push(
          `${index + 1}. ${coin.symbol}: +${coin.price_change_percentage_7d_in_currency?.toFixed(2)}% (vs BTC +${btcChange.toFixed(2)}%, +${outperformance.toFixed(2)}% better)`,
        );
      });
      context.push("");
    }

    // General top gainers/losers
    const topGainers = topCoins
      .filter((coin) => coin.price_change_percentage_24h > 0)
      .sort(
        (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
      )
      .slice(0, 3);

    const topLosers = topCoins
      .filter((coin) => coin.price_change_percentage_24h < 0)
      .sort(
        (a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h,
      )
      .slice(0, 3);

    if (topGainers.length > 0) {
      context.push(`🔥 TOP GAINERS (24h):`);
      topGainers.forEach((coin, index) => {
        context.push(
          `${index + 1}. ${coin.symbol}: +${coin.price_change_percentage_24h.toFixed(2)}%`,
        );
      });
      context.push("");
    }

    if (topLosers.length > 0) {
      context.push(`📉 TOP LOSERS (24h):`);
      topLosers.forEach((coin, index) => {
        context.push(
          `${index + 1}. ${coin.symbol}: ${coin.price_change_percentage_24h.toFixed(2)}%`,
        );
      });
      context.push("");
    }
  }

  // Market insights
  context.push(`💡 MARKET INSIGHTS:`);
  context.push(`• Data from CoinGecko API (multiple endpoints)`);
  context.push(`• Trending coins updated in real-time`);
  context.push(`• Global market sentiment analysis`);
  context.push(`• Top 50 coins by market cap tracked`);

  const summaryText = context.join("\n");

  // Calculate Bitcoin-relative performance metrics
  let btcRelativeMetrics = null;
  if (topCoins && topCoins.length > 0) {
    const btcAnalysis = analyzeBitcoinRelativePerformance(topCoins);
    if (btcAnalysis.btcData) {
      btcRelativeMetrics = {
        btcPerformance: {
          weekly:
            btcAnalysis.btcData.price_change_percentage_7d_in_currency || 0,
        },
        outperformersCount: {
          weekly: btcAnalysis.outperformers.weekly.length,
        },
        topOutperformers: {
          weekly: btcAnalysis.outperformers.weekly
            .sort(
              (a, b) =>
                (b.price_change_percentage_7d_in_currency || 0) -
                (a.price_change_percentage_7d_in_currency || 0),
            )
            .slice(0, 2) // Only top 2
            .map((coin) => ({
              symbol: coin.symbol,
              performance: coin.price_change_percentage_7d_in_currency || 0,
              vsBtc:
                (coin.price_change_percentage_7d_in_currency || 0) -
                (btcAnalysis.btcData?.price_change_percentage_7d_in_currency ||
                  0),
            })),
        },
      };
    }
  }

  return {
    text: summaryText,
    values: {
      altcoinDataAvailable: true,
      serviceMode: "comprehensive",
      curatedAltcoinsCount: priceData ? Object.keys(priceData).length : 0,
      trendingCount: trending ? trending.length : 0,
      topCoinsCount: topCoins ? topCoins.length : 0,
      globalDataAvailable: !!global,
      btcRelativeMetrics,
      lastUpdated: new Date().toISOString(),
    },
    data: {
      altcoinData: {
        priceData,
        trending,
        global,
        topCoins,
        btcRelativeMetrics,
        lastUpdated: new Date().toISOString(),
      },
    },
  };
}

/**
 * Build enhanced response with full analysis
 */
function buildEnhancedResponse(priceData: any, enhancedData: any): any {
  // Determine market conditions
  const marketConditions = analyzeAltcoinMarketConditions(
    enhancedData.top100VsBtc,
    enhancedData.topMovers,
  );

  // Find standout performers
  const standoutPerformers = findStandoutPerformers(
    enhancedData.curatedAltcoins,
    enhancedData.topMovers,
    enhancedData.trending,
  );

  // Analyze DEX trends
  const dexTrends = analyzeDexTrends(enhancedData.dexScreener);

  // Build altcoin context
  const altcoinContext = buildAltcoinContext(
    marketConditions,
    standoutPerformers,
    dexTrends,
    enhancedData.top100VsBtc,
    enhancedData.curatedAltcoins,
  );

  return {
    text: altcoinContext,
    values: {
      altcoinDataAvailable: true,
      serviceMode: "enhanced",
      curatedAltcoinsCount: Object.keys(enhancedData.curatedAltcoins || {})
        .length,
      outperformingBtcCount: enhancedData.top100VsBtc?.outperformingCount || 0,
      underperformingBtcCount:
        enhancedData.top100VsBtc?.underperformingCount || 0,
      topGainersCount: enhancedData.topMovers?.topGainers?.length || 0,
      topLosersCount: enhancedData.topMovers?.topLosers?.length || 0,
      trendingCount: enhancedData.trending?.coins?.length || 0,
      dexTrendingCount: enhancedData.dexScreener?.trendingTokens?.length || 0,
      isAltSeason: marketConditions.isAltSeason,
      marketSentiment: marketConditions.sentiment,
      dominantChain: dexTrends.dominantChain,
      avgAltcoinPerformance: marketConditions.avgPerformance,
      // Include data for actions to access
      curatedAltcoins: enhancedData.curatedAltcoins,
      top100VsBtc: enhancedData.top100VsBtc,
      dexScreener: enhancedData.dexScreener,
      topMovers: enhancedData.topMovers,
      trending: enhancedData.trending,
      standoutPerformers: standoutPerformers,
      dexTrends: dexTrends,
      basicPriceData: priceData,
    },
  };
}

/**
 * Helper function to analyze altcoin market conditions
 */
function analyzeAltcoinMarketConditions(top100VsBtc: any, topMovers: any): any {
  let isAltSeason = false;
  let sentiment = "neutral";
  let avgPerformance = 0;

  if (top100VsBtc) {
    const outperformingRatio =
      top100VsBtc.outperformingCount / top100VsBtc.totalCoins;
    avgPerformance = top100VsBtc.averagePerformance || 0;

    // Consider it alt season if >60% of top 100 are outperforming Bitcoin
    isAltSeason = outperformingRatio > 0.6;

    // Determine sentiment based on average performance and ratio
    if (outperformingRatio > 0.7 && avgPerformance > 5) {
      sentiment = "very bullish";
    } else if (outperformingRatio > 0.5 && avgPerformance > 0) {
      sentiment = "bullish";
    } else if (outperformingRatio < 0.3 || avgPerformance < -5) {
      sentiment = "bearish";
    }
  }

  return {
    isAltSeason,
    sentiment,
    avgPerformance: Math.round(avgPerformance * 100) / 100,
  };
}

/**
 * Helper function to find standout performers
 */
function findStandoutPerformers(
  curated: any,
  topMovers: any,
  trending: any,
): any {
  const performers = {
    topGainers: [],
    topLosers: [],
    trendingStandouts: [],
    curatedStandouts: [],
  };

  // Extract top gainers/losers
  if (topMovers) {
    performers.topGainers = topMovers.topGainers?.slice(0, 3) || [];
    performers.topLosers = topMovers.topLosers?.slice(0, 3) || [];
  }

  // Find trending standouts (high score)
  if (trending?.coins) {
    performers.trendingStandouts = trending.coins
      .filter((coin) => coin.score > 2)
      .slice(0, 3);
  }

  // Find curated standouts (significant moves)
  if (curated) {
    performers.curatedStandouts = Object.entries(curated)
      .filter(([_, data]: [string, any]) => Math.abs(data.change24h) > 10)
      .map(([coinId, data]: [string, any]) => ({ coinId, ...data }))
      .sort((a: any, b: any) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 3);
  }

  return performers;
}

/**
 * Helper function to analyze DEX trends
 */
function analyzeDexTrends(dexScreener: any): any {
  const trends = {
    dominantChain: "unknown",
    topTrending: [],
    highLiquidity: [],
    newListings: [],
  };

  if (dexScreener?.trendingTokens) {
    // Count chains to find dominant
    const chainCounts = dexScreener.trendingTokens.reduce(
      (acc: any, token: any) => {
        acc[token.chainId] = (acc[token.chainId] || 0) + 1;
        return acc;
      },
      {},
    );

    trends.dominantChain =
      Object.entries(chainCounts).sort(
        ([, a]: any, [, b]: any) => b - a,
      )[0]?.[0] || "unknown";

    // Find high liquidity tokens (>$100k)
    trends.highLiquidity = dexScreener.trendingTokens
      .filter((token: any) => token.totalLiquidity > 100000)
      .slice(0, 5);

    // Top trending by pools count
    trends.topTrending = dexScreener.trendingTokens
      .filter((token: any) => token.poolsCount > 0)
      .sort((a: any, b: any) => b.poolsCount - a.poolsCount)
      .slice(0, 5);
  }

  return trends;
}

/**
 * Helper function to build altcoin context
 */
function buildAltcoinContext(
  marketConditions: any,
  standoutPerformers: any,
  dexTrends: any,
  top100VsBtc: any,
  curatedAltcoins: any,
): string {
  const context = [];

  // Market overview
  context.push(`🪙 ALTCOIN MARKET CONTEXT`);
  context.push(`📊 Market sentiment: ${marketConditions.sentiment}`);
  context.push(
    `🌟 Alt season status: ${marketConditions.isAltSeason ? "ACTIVE" : "INACTIVE"}`,
  );
  context.push("");

  // Bitcoin vs altcoins performance
  if (top100VsBtc) {
    context.push(`⚡ TOP 100 vs BITCOIN:`);
    context.push(
      `• Outperforming BTC: ${top100VsBtc.outperformingCount}/${top100VsBtc.totalCoins} (${Math.round((top100VsBtc.outperformingCount / top100VsBtc.totalCoins) * 100)}%)`,
    );
    context.push(
      `• Average performance: ${marketConditions.avgPerformance > 0 ? "+" : ""}${marketConditions.avgPerformance}%`,
    );
    context.push("");
  }

  // Standout performers
  if (standoutPerformers.topGainers.length > 0) {
    context.push(`🚀 TOP GAINERS:`);
    standoutPerformers.topGainers.forEach((coin: any, index: number) => {
      context.push(
        `${index + 1}. ${coin.symbol}: +${coin.price_change_percentage_24h.toFixed(2)}%`,
      );
    });
    context.push("");
  }

  if (standoutPerformers.topLosers.length > 0) {
    context.push(`📉 TOP LOSERS:`);
    standoutPerformers.topLosers.forEach((coin: any, index: number) => {
      context.push(
        `${index + 1}. ${coin.symbol}: ${coin.price_change_percentage_24h.toFixed(2)}%`,
      );
    });
    context.push("");
  }

  // DEX trends
  if (dexTrends.dominantChain !== "unknown") {
    context.push(`🔥 DEX TRENDS:`);
    context.push(`• Dominant chain: ${dexTrends.dominantChain}`);
    context.push(`• High liquidity tokens: ${dexTrends.highLiquidity.length}`);
    context.push(`• Trending tokens tracked: ${dexTrends.topTrending.length}`);
    context.push("");
  }

  // Curated altcoins status
  if (curatedAltcoins) {
    const curatedCount = Object.keys(curatedAltcoins).length;
    context.push(`📋 CURATED ALTCOINS:`);
    context.push(`• Tracking ${curatedCount} curated projects`);
    context.push(
      `• Significant movers: ${standoutPerformers.curatedStandouts.length}`,
    );
    context.push("");
  }

  // Trading insights
  context.push(`💡 INSIGHTS:`);
  context.push(`• Use altcoin actions for detailed analysis`);
  context.push(`• DEX data updated every 5 minutes`);
  context.push(`• Performance relative to Bitcoin is key metric`);

  return context.join("\n");
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
