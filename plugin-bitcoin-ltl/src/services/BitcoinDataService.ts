import { Service, elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { BitcoinPriceData, CoinMarketData, BitcoinThesisData } from "../types";
import {
  ElizaOSErrorHandler,
  LoggerWithContext,
  generateCorrelationId,
  validateElizaOSEnvironment,
} from "../utils";

export class BitcoinDataService extends BaseDataService {
  static serviceType = "bitcoin-data";
  capabilityDescription =
    "Provides Bitcoin market data, analysis, and thesis tracking capabilities";

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
  }

  static async start(runtime: IAgentRuntime) {
    // Validate ElizaOS environment on startup
    const validation = validateElizaOSEnvironment();
    if (!validation.valid) {
      const contextLogger = new LoggerWithContext(
        generateCorrelationId(),
        "BitcoinDataService",
      );
      contextLogger.warn("ElizaOS environment validation issues detected", {
        issues: validation.issues,
      });

      // Log each issue with resolution guidance
      validation.issues.forEach((issue) => {
        contextLogger.warn(`Environment Issue: ${issue}`);
      });
    }

    elizaLogger.info("BitcoinDataService starting...");
    return new BitcoinDataService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("BitcoinDataService stopping...");

    // Check if the service exists in the runtime
    const service = runtime.getService("bitcoin-data");
    if (!service) {
      throw new Error("BitcoinDataService not found");
    }

    // Call the service's stop method if it exists
    if (service.stop && typeof service.stop === "function") {
      await service.stop();
    }

    // Cleanup any resources if needed
  }

  async start(): Promise<void> {
    elizaLogger.info("BitcoinDataService starting...");
    await this.updateData();
    elizaLogger.info("BitcoinDataService started successfully");
  }

  async init() {
    elizaLogger.info("BitcoinDataService initialized");
  }

  async stop() {
    elizaLogger.info("BitcoinDataService stopped");
  }

  /**
   * Required abstract method implementation for BaseDataService
   */
  async updateData(): Promise<void> {
    try {
      // Update core Bitcoin data
      await this.getEnhancedMarketData();
      await this.getBitcoinPrice();

      // Calculate and store thesis metrics
      const currentPrice = await this.getBitcoinPrice();
      await this.calculateThesisMetrics(currentPrice);

      elizaLogger.info(
        "[BitcoinDataService] Data update completed successfully",
      );
    } catch (error) {
      elizaLogger.error("[BitcoinDataService] Error updating data:", error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Required abstract method implementation for BaseDataService
   */
  async forceUpdate(): Promise<any> {
    try {
      elizaLogger.info(
        "[BitcoinDataService] Force updating all Bitcoin data...",
      );

      // Force fresh data fetch
      const [marketData, currentPrice, thesisData] = await Promise.all([
        this.getEnhancedMarketData(),
        this.getBitcoinPrice(),
        this.getBitcoinPrice().then((price) =>
          this.calculateThesisMetrics(price),
        ),
      ]);

      const result = {
        marketData,
        currentPrice,
        thesisData,
        timestamp: Date.now(),
      };

      elizaLogger.info(
        "[BitcoinDataService] Force update completed successfully",
      );
      return result;
    } catch (error) {
      elizaLogger.error("[BitcoinDataService] Error in force update:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Reset agent memory following ElizaOS best practices
   */
  async resetMemory(): Promise<{ success: boolean; message: string }> {
    try {
      const databaseConfig = this.runtime.character.settings?.database;

      // Type guard to check if database config is an object
      const isDbConfigObject = (config: any): config is Record<string, any> => {
        return typeof config === "object" && config !== null;
      };

      if (
        isDbConfigObject(databaseConfig) &&
        databaseConfig.type === "postgresql" &&
        databaseConfig.url
      ) {
        // For PostgreSQL, provide instructions since we can't directly drop/recreate
        return {
          success: false,
          message:
            'PostgreSQL memory reset requires manual intervention. Run: psql -U username -c "DROP DATABASE database_name;" then recreate the database.',
        };
      } else {
        // For PGLite (default), delete the data directory
        const dataDir =
          (isDbConfigObject(databaseConfig) && databaseConfig.dataDir) ||
          ".eliza/.elizadb";
        const fs = await import("fs");

        if (fs.existsSync(dataDir)) {
          fs.rmSync(dataDir, { recursive: true, force: true });
          elizaLogger.info(`Deleted PGLite database directory: ${dataDir}`);

          return {
            success: true,
            message: `Memory reset successful. Deleted database directory: ${dataDir}. Restart the agent to create a fresh database.`,
          };
        } else {
          return {
            success: true,
            message: `Database directory ${dataDir} does not exist. Memory already clean.`,
          };
        }
      }
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(
        error as Error,
        "MemoryReset",
      );
      elizaLogger.error("Failed to reset memory:", enhancedError.message);

      return {
        success: false,
        message: `Memory reset failed: ${enhancedError.message}`,
      };
    }
  }

  /**
   * Check memory usage and database health
   */
  async checkMemoryHealth(): Promise<{
    healthy: boolean;
    stats: {
      databaseType: string;
      dataDirectory?: string;
      memoryCount?: number;
      lastCleanup?: string;
    };
    issues: string[];
  }> {
    const databaseConfig = this.runtime.character.settings?.database;

    // Type guard to check if database config is an object
    const isDbConfigObject = (config: any): config is Record<string, any> => {
      return typeof config === "object" && config !== null;
    };

    const stats = {
      databaseType:
        (isDbConfigObject(databaseConfig) && databaseConfig.type) || "pglite",
      dataDirectory:
        (isDbConfigObject(databaseConfig) && databaseConfig.dataDir) ||
        ".eliza/.elizadb",
    };

    const issues: string[] = [];

    try {
      // Check if database directory exists and is accessible
      const fs = await import("fs");
      if (stats.dataDirectory && !fs.existsSync(stats.dataDirectory)) {
        issues.push(`Database directory ${stats.dataDirectory} does not exist`);
      }

      // For PGLite, check directory size (basic health check)
      if (stats.databaseType === "pglite" && stats.dataDirectory) {
        try {
          const dirSize = await this.getDirectorySize(stats.dataDirectory);
          if (dirSize > 1000 * 1024 * 1024) {
            // > 1GB
            issues.push(
              `Database directory is large (${(dirSize / 1024 / 1024).toFixed(0)}MB). Consider cleanup.`,
            );
          }
        } catch (error) {
          issues.push(
            `Could not check database directory size: ${(error as Error).message}`,
          );
        }
      }

      // Check embedding dimensions configuration
      const embeddingDims = process.env.OPENAI_EMBEDDING_DIMENSIONS;
      if (
        embeddingDims &&
        parseInt(embeddingDims) !== 1536 &&
        parseInt(embeddingDims) !== 384
      ) {
        issues.push(
          `Invalid OPENAI_EMBEDDING_DIMENSIONS: ${embeddingDims}. Should be 384 or 1536.`,
        );
      }

      return {
        healthy: issues.length === 0,
        stats,
        issues,
      };
    } catch (error) {
      issues.push(`Memory health check failed: ${(error as Error).message}`);
      return {
        healthy: false,
        stats,
        issues,
      };
    }
  }

  /**
   * Helper method to calculate directory size
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    const fs = await import("fs");
    const path = await import("path");

    const calculateSize = (itemPath: string): number => {
      const stats = fs.statSync(itemPath);

      if (stats.isFile()) {
        return stats.size;
      } else if (stats.isDirectory()) {
        const items = fs.readdirSync(itemPath);
        return items.reduce((size, item) => {
          return size + calculateSize(path.join(itemPath, item));
        }, 0);
      }

      return 0;
    };

    if (fs.existsSync(dirPath)) {
      return calculateSize(dirPath);
    }

    return 0;
  }

  async getBitcoinPrice(): Promise<number> {
    try {
      // Try to get recent price from memory first
      const cachedData = await this.getFromMemory("bitcoin-price", 1);
      if (cachedData.length > 0) {
        const cached = cachedData[0];
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < 60000) {
          // 1 minute cache
          elizaLogger.debug(
            "[BitcoinDataService] Using cached Bitcoin price:",
            cached.price,
          );
          return cached.price;
        }
      }

      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const price = data.bitcoin?.usd || 100000;

      // Store in memory for future use
      await this.storeInMemory(
        {
          price: price,
          timestamp: Date.now(),
          source: "coingecko",
        },
        "bitcoin-price",
      );

      return price;
    } catch (error) {
      elizaLogger.error("Error fetching Bitcoin price:", error);

      // Try to get last known price from memory as fallback
      const fallbackData = await this.getFromMemory("bitcoin-price", 1);
      if (fallbackData.length > 0) {
        elizaLogger.warn(
          "[BitcoinDataService] Using fallback price from memory",
        );
        return fallbackData[0].price;
      }

      return 100000; // Ultimate fallback price
    }
  }

  async calculateThesisMetrics(
    currentPrice: number,
  ): Promise<BitcoinThesisData> {
    const targetPrice = 1000000;
    const progressPercentage = (currentPrice / targetPrice) * 100;
    const multiplierNeeded = targetPrice / currentPrice;

    // Calculate required compound annual growth rates
    const fiveYearCAGR =
      (Math.pow(targetPrice / currentPrice, 1 / 5) - 1) * 100;
    const tenYearCAGR =
      (Math.pow(targetPrice / currentPrice, 1 / 10) - 1) * 100;

    // Estimate addresses with 10+ BTC (dynamic calculation based on price)
    const baseHolders = 50000;
    const priceAdjustment = Math.max(0, (150000 - currentPrice) / 50000);
    const estimatedHolders = Math.floor(baseHolders + priceAdjustment * 25000);
    const targetHolders = 100000;
    const holdersProgress = (estimatedHolders / targetHolders) * 100;

    const thesisData: BitcoinThesisData = {
      currentPrice,
      targetPrice,
      progressPercentage,
      multiplierNeeded,
      estimatedHolders,
      targetHolders,
      holdersProgress,
      timeframe: "5-10 years",
      requiredCAGR: {
        fiveYear: fiveYearCAGR,
        tenYear: tenYearCAGR,
      },
      catalysts: [
        "U.S. Strategic Bitcoin Reserve",
        "Banking Bitcoin services expansion",
        "Corporate treasury adoption (MicroStrategy model)",
        "EU MiCA regulatory framework",
        "Institutional ETF demand acceleration",
        "Nation-state competition for reserves",
      ],
    };

    // Store thesis metrics in memory for tracking progress over time
    await this.storeInMemory(
      {
        ...thesisData,
        timestamp: Date.now(),
        calculatedAt: new Date().toISOString(),
      },
      "bitcoin-thesis",
    );

    elizaLogger.info(
      `[BitcoinDataService] Thesis metrics calculated: ${progressPercentage.toFixed(2)}% progress to $1M target`,
    );

    return thesisData;
  }

  /**
   * Enhanced Bitcoin market data with comprehensive metrics
   */
  async getEnhancedMarketData(): Promise<BitcoinPriceData> {
    try {
      // Check memory cache first
      const cachedData = await this.getFromMemory("bitcoin-market-data", 1);
      if (cachedData.length > 0) {
        const cached = cachedData[0];
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < 300000) {
          // 5 minute cache
          elizaLogger.debug("[BitcoinDataService] Using cached market data");
          return cached;
        }
      }

      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h%2C7d",
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as CoinMarketData[];
      const bitcoin = data[0];

      const marketData: BitcoinPriceData = {
        price: bitcoin.current_price || 100000,
        marketCap: bitcoin.market_cap || 2000000000000,
        volume24h: bitcoin.total_volume || 50000000000,
        priceChange24h: bitcoin.price_change_percentage_24h || 0,
        priceChange7d: bitcoin.price_change_percentage_7d || 0,
        priceChange30d: 0, // Not available in markets endpoint
        allTimeHigh: bitcoin.high_24h || 100000,
        allTimeLow: bitcoin.low_24h || 100,
        circulatingSupply: 19700000, // Static for Bitcoin
        totalSupply: 19700000, // Static for Bitcoin
        maxSupply: 21000000, // Static for Bitcoin
        lastUpdated: new Date().toISOString(),
      };

      // Store enhanced market data in memory
      await this.storeInMemory(
        {
          ...marketData,
          timestamp: Date.now(),
          source: "coingecko-enhanced",
        },
        "bitcoin-market-data",
      );

      elizaLogger.info(
        `[BitcoinDataService] Enhanced market data updated: $${marketData.price.toLocaleString()}`,
      );

      return marketData;
    } catch (error) {
      elizaLogger.error("Error fetching enhanced market data:", error);

      // Try to get fallback data from memory
      const fallbackData = await this.getFromMemory("bitcoin-market-data", 1);
      if (fallbackData.length > 0) {
        elizaLogger.warn(
          "[BitcoinDataService] Using fallback market data from memory",
        );
        return fallbackData[0];
      }

      // Return ultimate fallback data
      return {
        price: 100000,
        marketCap: 2000000000000,
        volume24h: 50000000000,
        priceChange24h: 0,
        priceChange7d: 0,
        priceChange30d: 0,
        allTimeHigh: 100000,
        allTimeLow: 100,
        circulatingSupply: 19700000,
        totalSupply: 19700000,
        maxSupply: 21000000,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate Bitcoin Freedom Mathematics with memory persistence
   */
  async calculateFreedomMathematics(targetFreedom: number = 10000000): Promise<{
    currentPrice: number;
    btcNeeded: number;
    scenarios: {
      [key: string]: { price: number; btc: number; timeline: string };
    };
    safeLevels: { conservative: number; moderate: number; aggressive: number };
  }> {
    const currentPrice = await this.getBitcoinPrice();
    const btcNeeded = targetFreedom / currentPrice;

    const scenarios = {
      current: {
        price: currentPrice,
        btc: btcNeeded,
        timeline: "Today",
      },
      thesis250k: {
        price: 250000,
        btc: targetFreedom / 250000,
        timeline: "2-3 years",
      },
      thesis500k: {
        price: 500000,
        btc: targetFreedom / 500000,
        timeline: "3-5 years",
      },
      thesis1m: {
        price: 1000000,
        btc: targetFreedom / 1000000,
        timeline: "5-10 years",
      },
    };

    // Safe accumulation levels accounting for volatility
    const safeLevels = {
      conservative: btcNeeded * 1.5, // 50% buffer
      moderate: btcNeeded * 1.25, // 25% buffer
      aggressive: btcNeeded, // Exact target
    };

    const freedomMath = {
      currentPrice,
      btcNeeded,
      scenarios,
      safeLevels,
    };

    // Store freedom mathematics calculation in memory for tracking
    await this.storeInMemory(
      {
        ...freedomMath,
        targetFreedom,
        timestamp: Date.now(),
        calculatedAt: new Date().toISOString(),
      },
      "bitcoin-freedom-math",
    );

    elizaLogger.info(
      `Freedom Mathematics calculated for $${targetFreedom.toLocaleString()}`,
      {
        currentBTCNeeded: `${btcNeeded.toFixed(2)} BTC`,
        conservativeTarget: `${safeLevels.conservative.toFixed(2)} BTC`,
      },
    );

    return freedomMath;
  }

  /**
   * Get historical thesis progress from memory
   */
  async getThesisProgressHistory(days: number = 30): Promise<any[]> {
    try {
      const thesisHistory = await this.getFromMemory("bitcoin-thesis", 50);

      // Filter by time range
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const recentHistory = thesisHistory.filter(
        (entry) => entry.timestamp > cutoffTime,
      );

      elizaLogger.info(
        `[BitcoinDataService] Retrieved ${recentHistory.length} thesis progress entries from last ${days} days`,
      );

      return recentHistory;
    } catch (error) {
      elizaLogger.error("Error retrieving thesis progress history:", error);
      return [];
    }
  }

  /**
   * Get freedom math calculation history
   */
  async getFreedomMathHistory(days: number = 30): Promise<any[]> {
    try {
      const freedomHistory = await this.getFromMemory(
        "bitcoin-freedom-math",
        50,
      );

      // Filter by time range
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const recentHistory = freedomHistory.filter(
        (entry) => entry.timestamp > cutoffTime,
      );

      elizaLogger.info(
        `[BitcoinDataService] Retrieved ${recentHistory.length} freedom math entries from last ${days} days`,
      );

      return recentHistory;
    } catch (error) {
      elizaLogger.error("Error retrieving freedom math history:", error);
      return [];
    }
  }

  /**
   * Analyze institutional adoption trends
   */
  async analyzeInstitutionalTrends(): Promise<{
    corporateAdoption: string[];
    bankingIntegration: string[];
    etfMetrics: { [key: string]: any };
    sovereignActivity: string[];
    adoptionScore: number; // 0-100 scale
  }> {
    // This would ideally fetch from institutional adoption APIs
    // For now, return curated analysis based on known trends

    const analysis = {
      corporateAdoption: [
        "MicroStrategy: $21B+ BTC treasury position",
        "Tesla: 11,509 BTC corporate holding",
        "Block (Square): Bitcoin-focused business model",
        "Marathon Digital: Mining infrastructure",
        "Tesla payments integration pilot programs",
      ],
      bankingIntegration: [
        "JPMorgan: Bitcoin exposure through ETFs",
        "Goldman Sachs: Bitcoin derivatives trading",
        "Bank of New York Mellon: Crypto custody",
        "Morgan Stanley: Bitcoin investment access",
        "Wells Fargo: Crypto research and analysis",
      ],
      etfMetrics: {
        totalAUM: "$50B+ across Bitcoin ETFs",
        dailyVolume: "$2B+ average trading volume",
        institutionalShare: "70%+ of ETF holdings",
        flowTrend: "Consistent net inflows 2024",
      },
      sovereignActivity: [
        "El Salvador: 2,500+ BTC national reserve",
        "U.S.: Strategic Bitcoin Reserve discussions",
        "Germany: Bitcoin legal tender consideration",
        "Singapore: Crypto-friendly regulatory framework",
        "Switzerland: Bitcoin tax optimization laws",
      ],
      adoptionScore: 75, // Based on current institutional momentum
    };

    elizaLogger.info("Institutional adoption analysis complete", {
      adoptionScore: `${analysis.adoptionScore}/100`,
      corporateCount: analysis.corporateAdoption.length,
      bankingCount: analysis.bankingIntegration.length,
    });

    return analysis;
  }
}
