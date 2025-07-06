import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import {
  createActionTemplate,
  ValidationPatterns,
  ResponseCreators,
} from "./base/ActionTemplate";
import { StockDataService } from "../services/StockDataService";

// Helper function to safely format percentage values
const formatPercentage = (value: number): string => {
  if (!isFinite(value)) return "0.00";
  return value.toFixed(2);
};

// Helper function to safely format currency values
const formatCurrency = (value: number): string => {
  if (!isFinite(value)) return "0.00";
  return value.toFixed(2);
};

export const stockMarketAction: Action = createActionTemplate({
  name: "STOCK_MARKET_ANALYSIS",
  description:
    "Comprehensive stock market analysis for curated equities including Bitcoin-related stocks, MAG7 comparison, and sovereign wealth portfolio performance",
  similes: [
    "STOCK_PERFORMANCE",
    "EQUITY_ANALYSIS",
    "MAG7_COMPARISON",
    "MARKET_PERFORMANCE",
  ],

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are our stocks performing vs the market?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "TSLA: $316.36 (+2.1%) - Outperforming MAG7 by +1.2pp. MSTR: $402.15 (+8.3%) - Bitcoin proxy leading. MAG7 Average: +0.9%. S&P 500: +0.4%. Bitcoin stocks: +4.2% avg. Tech innovation and sound money thesis both advancing. Trade equities for yield, stack sats for wealth.",
          thought:
            "User wants sovereign equity portfolio performance vs market benchmarks. I need to analyze our curated stocks against MAG7 and S&P 500, highlighting Bitcoin-related outperformance while maintaining perspective on fiat-denominated assets.",
          actions: ["STOCK_MARKET_ANALYSIS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "What's happening with Tesla and MicroStrategy today?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "TSLA: $316.36 (+2.1%) vs MAG7 +1.2pp advantage. MSTR: $402.15 (+8.3%) vs MAG7 +7.4pp advantage. MicroStrategy's Bitcoin treasury strategy outperforming traditional corporate allocation. Tesla's innovation premium intact. Both beating S&P 500 by significant margins.",
          thought:
            "User asking about specific stock performance for TSLA and MSTR. I should provide current prices, performance metrics, and context about their relative outperformance versus market benchmarks.",
          actions: ["STOCK_MARKET_ANALYSIS"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Are Bitcoin mining stocks doing well?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Bitcoin proxy stocks: +4.2% average. MARA: +6.1%, RIOT: +5.8%, CLSK: +3.2%. Mining stocks reflecting Bitcoin's network strength. Outperforming MAG7 (+0.9%) and S&P 500 (+0.4%). Hash rate security translates to equity performance. Sound money thesis in action.",
          thought:
            "User interested in Bitcoin mining stock performance. I need to analyze the Bitcoin-related stock category, compare to broader market performance, and connect to Bitcoin network fundamentals.",
          actions: ["STOCK_MARKET_ANALYSIS"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isStockMarketRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Stock market analysis action triggered");

    const thoughtProcess =
      "User is requesting stock market analysis. I need to analyze our sovereign equity portfolio performance versus market benchmarks, highlighting Bitcoin-related stocks while maintaining perspective on fiat-denominated assets versus sound money.";

    try {
      const stockDataService = runtime.getService(
        "stock-data",
      ) as StockDataService;

      if (!stockDataService) {
        logger.warn("StockDataService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "STOCK_MARKET_ANALYSIS",
          "Stock data temporarily unavailable",
          "Stock data temporarily unavailable. Like Bitcoin's price discovery, equity markets require patience during consolidation.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Check if force refresh is requested
      const forceRefresh =
        message.content?.text?.toLowerCase().includes("refresh") ||
        message.content?.text?.toLowerCase().includes("latest") ||
        message.content?.text?.toLowerCase().includes("current");

      let stockData;
      if (forceRefresh) {
        stockData = await stockDataService.forceStockUpdate();
      } else {
        stockData = stockDataService.getStockData();
      }

      if (!stockData) {
        logger.warn("No stock data available");

        const noDataResponse = ResponseCreators.createErrorResponse(
          "STOCK_MARKET_ANALYSIS",
          "Stock data unavailable",
          "Stock data unavailable. Markets, like Bitcoin, operate in cycles - this too shall pass.",
        );

        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      const { stocks, mag7, performance } = stockData;

      // Generate comprehensive stock analysis
      const responseText = formatStockAnalysis(stocks, mag7, performance);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        "STOCK_MARKET_ANALYSIS",
        {
          totalStocks: stocks.length,
          mag7Average: performance.mag7Average,
          sp500Performance: performance.sp500Performance,
          bitcoinRelatedAverage: performance.bitcoinRelatedAverage,
          techStocksAverage: performance.techStocksAverage,
          topPerformersCount: performance.topPerformers.length,
          underperformersCount: performance.underperformers.length,
        },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Stock market analysis delivered successfully");
      return true;
    } catch (error) {
      logger.error("Failed to analyze stock market:", (error as Error).message);

      const errorResponse = ResponseCreators.createErrorResponse(
        "STOCK_MARKET_ANALYSIS",
        (error as Error).message,
        "Market analysis failed. Like network congestion, sometimes data flows require patience and retry mechanisms.",
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Format comprehensive stock market analysis
 */
function formatStockAnalysis(
  stocks: any[],
  mag7: any[],
  performance: any,
): string {
  // Market performance overview
  let analysis = `Market performance: MAG7 ${performance.mag7Average > 0 ? "+" : ""}${formatPercentage(performance.mag7Average)}%, S&P 500 ${performance.sp500Performance > 0 ? "+" : ""}${formatPercentage(performance.sp500Performance)}%, Bitcoin stocks ${performance.bitcoinRelatedAverage > 0 ? "+" : ""}${formatPercentage(performance.bitcoinRelatedAverage)}%, Tech stocks ${performance.techStocksAverage > 0 ? "+" : ""}${formatPercentage(performance.techStocksAverage)}%. `;

  // Top performers analysis
  if (performance.topPerformers.length > 0) {
    const topPerformersText = performance.topPerformers
      .slice(0, 3)
      .map((comp: any) => {
        const { stock, vsMag7 } = comp;
        return `${stock.symbol}: $${formatCurrency(stock.price)} (${stock.changePercent > 0 ? "+" : ""}${formatPercentage(stock.changePercent)}%, ${vsMag7.outperforming ? "+" : ""}${formatPercentage(vsMag7.difference)}pp vs MAG7)`;
      })
      .join(", ");

    analysis += `Top performers: ${topPerformersText}. `;
  }

  // Bitcoin-related stocks focus
  const bitcoinStocks = stocks.filter((s) => s.sector === "bitcoin-related");
  if (bitcoinStocks.length > 0) {
    const bitcoinText = bitcoinStocks
      .slice(0, 3)
      .map((stock) => {
        return `${stock.symbol}: $${formatCurrency(stock.price)} (${stock.changePercent > 0 ? "+" : ""}${formatPercentage(stock.changePercent)}%)`;
      })
      .join(", ");
    analysis += `Bitcoin proxies: ${bitcoinText}. `;
  }

  // MAG7 breakdown
  if (mag7.length > 0) {
    const mag7Text = mag7
      .slice(0, 3)
      .map(
        (stock) =>
          `${stock.symbol}: $${formatCurrency(stock.price)} (${stock.changePercent > 0 ? "+" : ""}${formatPercentage(stock.changePercent)}%)`,
      )
      .join(", ");
    analysis += `MAG7 leaders: ${mag7Text}. `;
  }

  // Satoshi's market philosophy
  if (performance.bitcoinRelatedAverage > performance.mag7Average) {
    analysis +=
      "Bitcoin proxy stocks outperforming traditional tech. The parallel financial system gains strength. ";
  } else {
    analysis +=
      "Traditional tech leading Bitcoin proxies. The transition to sound money continues its gradual march. ";
  }

  analysis += `${performance.topPerformers.length} positions outperforming MAG7 average. `;
  analysis +=
    "Stocks are denominated in fiat. Bitcoin is the ultimate long-term store of value. ";
  analysis +=
    "Trade equities for yield, but stack sats for wealth preservation. ";
  analysis += "These companies may prosper, but Bitcoin is inevitable.";

  return analysis;
}
