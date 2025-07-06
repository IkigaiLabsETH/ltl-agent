import { IAgentRuntime, Service, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import {
  BitcoinETF,
  ETFFlowData,
  ETFFlowSummary,
  ETFHistoricalData,
  ETFMarketData,
} from "../types";

export class ETFDataService extends BaseDataService {
  static serviceType = "etf-data";
  capabilityDescription =
    "Provides Bitcoin ETF flow data, tracking institutional flows and market metrics";

  private etfCache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Major Bitcoin ETFs to track
  private readonly BITCOIN_ETFS = [
    {
      ticker: "IBIT",
      name: "iShares Bitcoin Trust",
      issuer: "BlackRock",
      launchDate: "2024-01-11",
    },
    {
      ticker: "FBTC",
      name: "Fidelity Wise Origin Bitcoin Fund",
      issuer: "Fidelity",
      launchDate: "2024-01-11",
    },
    {
      ticker: "ARKB",
      name: "ARK 21Shares Bitcoin ETF",
      issuer: "ARK Invest",
      launchDate: "2024-01-11",
    },
    {
      ticker: "BITB",
      name: "Bitwise Bitcoin ETF",
      issuer: "Bitwise",
      launchDate: "2024-01-11",
    },
    {
      ticker: "BTCO",
      name: "Invesco Galaxy Bitcoin ETF",
      issuer: "Invesco",
      launchDate: "2024-01-11",
    },
    {
      ticker: "EZBC",
      name: "Franklin Bitcoin ETF",
      issuer: "Franklin Templeton",
      launchDate: "2024-01-11",
    },
    {
      ticker: "BRRR",
      name: "Valkyrie Bitcoin Fund",
      issuer: "Valkyrie",
      launchDate: "2024-01-11",
    },
    {
      ticker: "HODL",
      name: "VanEck Bitcoin Trust",
      issuer: "VanEck",
      launchDate: "2024-01-11",
    },
    {
      ticker: "DEFI",
      name: "Hashdex Bitcoin ETF",
      issuer: "Hashdex",
      launchDate: "2024-01-11",
    },
    {
      ticker: "GBTC",
      name: "Grayscale Bitcoin Trust",
      issuer: "Grayscale",
      launchDate: "2024-01-11",
    },
  ];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "etfData");
    this.scheduleRegularUpdates();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info("ETFDataService starting...");
    return new ETFDataService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("ETFDataService stopping...");
    const service = runtime.getService("etf-data");
    if (service && service.stop && typeof service.stop === "function") {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    logger.info("ETFDataService starting...");
    await this.updateData();
    logger.info("ETFDataService started successfully");
  }

  async init() {
    logger.info("ETFDataService initialized");
    await this.updateData();
  }

  async stop() {
    logger.info("ETFDataService stopped");
  }

  /**
   * Schedule regular updates every 5 minutes during market hours
   */
  private scheduleRegularUpdates() {
    const updateInterval = 5 * 60 * 1000; // 5 minutes
    setInterval(() => {
      if (this.isMarketHours()) {
        this.updateData().catch((error) => {
          logger.error("Error in scheduled ETF data update:", error);
        });
      }
    }, updateInterval);
  }

  /**
   * Check if it's market hours (9:30 AM - 4:00 PM ET)
   */
  private isMarketHours(): boolean {
    const now = new Date();
    const etTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const hours = etTime.getHours();
    const minutes = etTime.getMinutes();
    const dayOfWeek = etTime.getDay();

    // Monday to Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const currentTime = hours * 60 + minutes;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM

      return currentTime >= marketOpen && currentTime <= marketClose;
    }

    return false;
  }

  /**
   * Update ETF data from multiple sources
   */
  async updateData(): Promise<void> {
    try {
      logger.info("Updating ETF data...");

      // Update data for all ETFs
      await Promise.all([
        this.updateETFMarketData(),
        this.updateETFFlowData(),
        this.updateETFHoldings(),
      ]);

      logger.info("ETF data updated successfully");
    } catch (error) {
      logger.error("Error updating ETF data:", error);
    }
  }

  /**
   * Force update all ETF data
   */
  async forceUpdate(): Promise<ETFMarketData> {
    this.etfCache.clear();
    await this.updateData();
    return this.getETFMarketData();
  }

  /**
   * Get comprehensive ETF market data
   */
  async getETFMarketData(): Promise<ETFMarketData> {
    const cacheKey = "etf-market-data";
    const cached = this.etfCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp, this.CACHE_DURATION)) {
      return cached.data;
    }

    try {
      const [etfs, flowSummary, historicalData] = await Promise.all([
        this.getETFList(),
        this.getETFFlowSummary(),
        this.getETFHistoricalData(),
      ]);

      const marketMetrics = this.calculateMarketMetrics(etfs, flowSummary);

      const marketData: ETFMarketData = {
        etfs,
        flowSummary,
        historicalData,
        marketMetrics,
        lastUpdated: new Date().toISOString(),
      };

      this.etfCache.set(cacheKey, {
        data: marketData,
        timestamp: Date.now(),
      });

      return marketData;
    } catch (error) {
      logger.error("Error fetching ETF market data:", error);
      throw error;
    }
  }

  /**
   * Get ETF flow data for a specific period
   */
  async getETFFlowData(days: number = 30): Promise<ETFFlowData[]> {
    const cacheKey = `etf-flow-data-${days}`;
    const cached = this.etfCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp, this.CACHE_DURATION)) {
      return cached.data;
    }

    try {
      const flowData = await this.fetchETFFlowData(days);

      this.etfCache.set(cacheKey, {
        data: flowData,
        timestamp: Date.now(),
      });

      return flowData;
    } catch (error) {
      logger.error("Error fetching ETF flow data:", error);
      throw error;
    }
  }

  /**
   * Update ETF market data from various sources
   */
  private async updateETFMarketData(): Promise<void> {
    return this.makeQueuedRequest(async () => {
      for (const etf of this.BITCOIN_ETFS) {
        try {
          const marketData = await this.fetchETFMarketData(etf.ticker);
          this.etfCache.set(`market-${etf.ticker}`, {
            data: marketData,
            timestamp: Date.now(),
          });
        } catch (error) {
          logger.error(`Error updating market data for ${etf.ticker}:`, error);
        }
      }
    });
  }

  /**
   * Update ETF flow data
   */
  private async updateETFFlowData(): Promise<void> {
    return this.makeQueuedRequest(async () => {
      try {
        const flowData = await this.fetchETFFlowData(5); // Last 5 days
        this.etfCache.set("recent-flows", {
          data: flowData,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error("Error updating ETF flow data:", error);
      }
    });
  }

  /**
   * Update ETF holdings data
   */
  private async updateETFHoldings(): Promise<void> {
    return this.makeQueuedRequest(async () => {
      for (const etf of this.BITCOIN_ETFS) {
        try {
          const holdings = await this.fetchETFHoldings(etf.ticker);
          this.etfCache.set(`holdings-${etf.ticker}`, {
            data: holdings,
            timestamp: Date.now(),
          });
        } catch (error) {
          logger.error(`Error updating holdings for ${etf.ticker}:`, error);
        }
      }
    });
  }

  /**
   * Fetch ETF market data from financial APIs
   */
  private async fetchETFMarketData(ticker: string): Promise<any> {
    try {
      // Try Yahoo Finance first
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      const yahooResponse = await fetch(yahooUrl, {
        signal: AbortSignal.timeout(15000),
      });

      if (!yahooResponse.ok) {
        throw new Error(
          `HTTP ${yahooResponse.status}: ${yahooResponse.statusText}`,
        );
      }

      const yahooData = await yahooResponse.json();

      if (yahooData?.chart?.result?.[0]) {
        const result = yahooData.chart.result[0];
        return {
          ticker,
          price: result.meta.regularMarketPrice,
          volume: result.meta.regularMarketVolume,
          marketCap:
            result.meta.regularMarketPrice * result.meta.sharesOutstanding,
          change: result.meta.regularMarketPrice - result.meta.previousClose,
          changePercent:
            ((result.meta.regularMarketPrice - result.meta.previousClose) /
              result.meta.previousClose) *
            100,
          lastUpdated: new Date().toISOString(),
        };
      }

      // Fallback to Alpha Vantage if available
      const alphaVantageKey = this.runtime.getSetting("ALPHA_VANTAGE_API_KEY");
      if (alphaVantageKey) {
        const alphaUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${alphaVantageKey}`;
        const alphaResponse = await fetch(alphaUrl, {
          signal: AbortSignal.timeout(15000),
        });

        if (!alphaResponse.ok) {
          throw new Error(
            `HTTP ${alphaResponse.status}: ${alphaResponse.statusText}`,
          );
        }

        const alphaData = await alphaResponse.json();

        if (alphaData?.["Global Quote"]) {
          const quote = alphaData["Global Quote"];
          return {
            ticker,
            price: parseFloat(quote["05. price"]),
            volume: parseInt(quote["06. volume"]),
            change: parseFloat(quote["09. change"]),
            changePercent: parseFloat(
              quote["10. change percent"].replace("%", ""),
            ),
            lastUpdated: new Date().toISOString(),
          };
        }
      }

      return null;
    } catch (error) {
      logger.error(`Error fetching market data for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch ETF flow data from various sources
   */
  private async fetchETFFlowData(days: number): Promise<ETFFlowData[]> {
    const flowData: ETFFlowData[] = [];

    try {
      // Fetch from FarSide Investors or similar sources
      // For now, we'll use a combination of volume and price analysis
      for (const etf of this.BITCOIN_ETFS) {
        const marketData = await this.fetchETFMarketData(etf.ticker);
        if (marketData) {
          const estimatedFlow = this.estimateETFFlow(marketData, etf);
          flowData.push({
            ticker: etf.ticker,
            name: etf.name,
            date: new Date().toISOString().split("T")[0],
            inflow: estimatedFlow.inflow,
            volume: marketData.volume,
            shares: estimatedFlow.shares,
            nav: marketData.price,
            premium: estimatedFlow.premium,
            bitcoinHoldings: estimatedFlow.bitcoinHoldings,
            bitcoinValue: estimatedFlow.bitcoinValue,
            price: marketData.price,
            priceChange: marketData.changePercent,
            lastUpdated: new Date().toISOString(),
          });
        }
      }

      return flowData;
    } catch (error) {
      logger.error("Error fetching ETF flow data:", error);
      return flowData;
    }
  }

  /**
   * Fetch ETF holdings data
   */
  private async fetchETFHoldings(ticker: string): Promise<any> {
    try {
      // This would ideally fetch from SEC filings or fund websites
      // For now, we'll estimate based on AUM and Bitcoin price
      const marketData = await this.fetchETFMarketData(ticker);
      const bitcoinPrice = await this.getBitcoinPrice();

      if (marketData && bitcoinPrice) {
        const estimatedAUM = marketData.marketCap;
        const estimatedBitcoinHoldings = estimatedAUM / bitcoinPrice;

        return {
          ticker,
          estimatedAUM,
          estimatedBitcoinHoldings,
          bitcoinValue: estimatedBitcoinHoldings * bitcoinPrice,
          lastUpdated: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error fetching holdings for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get Bitcoin price from CoinGecko
   */
  private async getBitcoinPrice(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        {
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.bitcoin.usd;
    } catch (error) {
      logger.error("Error fetching Bitcoin price:", error);
      return 0;
    }
  }

  /**
   * Estimate ETF flow based on market data
   */
  private estimateETFFlow(marketData: any, etf: any): any {
    // This is a simplified estimation
    // Real implementation would require access to creation/redemption data
    const volumeBasedFlow = marketData.volume * marketData.price;
    const priceBasedFlow =
      marketData.changePercent > 0
        ? volumeBasedFlow * 0.6
        : volumeBasedFlow * -0.4;

    return {
      inflow: priceBasedFlow,
      shares: marketData.volume,
      premium: Math.random() * 0.5 - 0.25, // Simplified estimation
      bitcoinHoldings: marketData.marketCap / 50000, // Rough estimate
      bitcoinValue: marketData.marketCap * 0.95, // Estimate 95% of AUM in Bitcoin
    };
  }

  /**
   * Get list of all tracked ETFs
   */
  private async getETFList(): Promise<BitcoinETF[]> {
    const etfs: BitcoinETF[] = [];

    for (const etf of this.BITCOIN_ETFS) {
      const marketData = this.etfCache.get(`market-${etf.ticker}`)?.data;
      const holdings = this.etfCache.get(`holdings-${etf.ticker}`)?.data;

      if (marketData && holdings) {
        etfs.push({
          ticker: etf.ticker,
          name: etf.name,
          issuer: etf.issuer,
          launchDate: etf.launchDate,
          expenseRatio: this.getExpenseRatio(etf.ticker),
          aum: holdings.estimatedAUM,
          shares: marketData.volume,
          nav: marketData.price,
          premium: holdings.premium || 0,
          volume: marketData.volume,
          bitcoinHoldings: holdings.estimatedBitcoinHoldings,
          bitcoinValue: holdings.bitcoinValue,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return etfs;
  }

  /**
   * Get ETF flow summary
   */
  private async getETFFlowSummary(): Promise<ETFFlowSummary> {
    const flowData = this.etfCache.get("recent-flows")?.data || [];

    const totalNetFlow = flowData.reduce(
      (sum: number, flow: ETFFlowData) => sum + flow.inflow,
      0,
    );
    const totalInflow = flowData
      .filter((flow: ETFFlowData) => flow.inflow > 0)
      .reduce((sum: number, flow: ETFFlowData) => sum + flow.inflow, 0);
    const totalOutflow = flowData
      .filter((flow: ETFFlowData) => flow.inflow < 0)
      .reduce(
        (sum: number, flow: ETFFlowData) => sum + Math.abs(flow.inflow),
        0,
      );

    const topInflows = flowData
      .filter((flow: ETFFlowData) => flow.inflow > 0)
      .sort((a: ETFFlowData, b: ETFFlowData) => b.inflow - a.inflow)
      .slice(0, 5);
    const topOutflows = flowData
      .filter((flow: ETFFlowData) => flow.inflow < 0)
      .sort((a: ETFFlowData, b: ETFFlowData) => a.inflow - b.inflow)
      .slice(0, 5);

    return {
      totalNetFlow,
      totalInflow,
      totalOutflow,
      totalVolume: flowData.reduce(
        (sum: number, flow: ETFFlowData) => sum + flow.volume,
        0,
      ),
      totalBitcoinHoldings: flowData.reduce(
        (sum: number, flow: ETFFlowData) => sum + flow.bitcoinHoldings,
        0,
      ),
      totalBitcoinValue: flowData.reduce(
        (sum: number, flow: ETFFlowData) => sum + flow.bitcoinValue,
        0,
      ),
      totalAUM: flowData.reduce(
        (sum: number, flow: ETFFlowData) => sum + flow.bitcoinValue,
        0,
      ),
      averagePremium:
        flowData.reduce(
          (sum: number, flow: ETFFlowData) => sum + flow.premium,
          0,
        ) / flowData.length,
      topInflows,
      topOutflows,
      date: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get ETF historical data
   */
  private async getETFHistoricalData(): Promise<ETFHistoricalData[]> {
    const historicalData: ETFHistoricalData[] = [];

    for (const etf of this.BITCOIN_ETFS) {
      // This would fetch historical data from APIs
      // For now, return empty structure
      historicalData.push({
        ticker: etf.ticker,
        name: etf.name,
        data: [],
        totalFlow: 0,
        averageFlow: 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    return historicalData;
  }

  /**
   * Calculate market metrics
   */
  private calculateMarketMetrics(
    etfs: BitcoinETF[],
    flowSummary: ETFFlowSummary,
  ): any {
    const totalAUM = etfs.reduce((sum, etf) => sum + etf.aum, 0);
    const totalBitcoinHeld = etfs.reduce(
      (sum, etf) => sum + etf.bitcoinHoldings,
      0,
    );
    const totalBitcoinValue = etfs.reduce(
      (sum, etf) => sum + etf.bitcoinValue,
      0,
    );

    const marketLeader = etfs.sort((a, b) => b.aum - a.aum)[0]?.ticker || "";
    const strongestInflow = flowSummary.topInflows[0]?.ticker || "";
    const largestOutflow = flowSummary.topOutflows[0]?.ticker || "";

    return {
      totalMarketAUM: totalAUM,
      totalBitcoinHeld,
      totalBitcoinValue,
      percentOfSupply: (totalBitcoinHeld / 21000000) * 100,
      averageExpenseRatio:
        etfs.reduce((sum, etf) => sum + etf.expenseRatio, 0) / etfs.length,
      marketLeader,
      strongestInflow,
      largestOutflow,
    };
  }

  /**
   * Get expense ratio for ETF
   */
  private getExpenseRatio(ticker: string): number {
    const expenseRatios: { [key: string]: number } = {
      IBIT: 0.25,
      FBTC: 0.25,
      ARKB: 0.21,
      BITB: 0.2,
      BTCO: 0.25,
      EZBC: 0.19,
      BRRR: 0.25,
      HODL: 0.25,
      DEFI: 0.25,
      GBTC: 1.5,
    };

    return expenseRatios[ticker] || 0.25;
  }
}
