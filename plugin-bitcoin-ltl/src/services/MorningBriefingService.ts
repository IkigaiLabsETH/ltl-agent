import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { ProcessedIntelligence } from "./ContentIngestionService";
import { SlackIngestionService } from "./SlackIngestionService";

export interface MorningBriefingConfig {
  deliveryTime: { hour: number; minute: number }; // 24-hour format
  timezone: string; // e.g., 'America/New_York'
  includeWeather: boolean;
  includeMarketData: boolean;
  includeNewsDigest: boolean;
  includePerformanceTracking: boolean;
  personalizations: {
    greetingStyle: "casual" | "professional" | "satoshi";
    focusAreas: string[]; // e.g., ['bitcoin', 'stocks', 'crypto']
    alertThresholds: {
      bitcoinPriceChange: number; // percentage
      stockMoves: number; // percentage
      altcoinOutperformance: number; // percentage
    };
  };
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

export interface MarketPulse {
  bitcoin: {
    price: number;
    change24h: number;
    change7d: number;
    trend: "bullish" | "bearish" | "neutral";
    thesisProgress: number; // percentage to $1M
    nextResistance: number;
    nextSupport: number;
  };
  altcoins: {
    outperformers: { symbol: string; change: number; reason: string }[];
    underperformers: { symbol: string; change: number; reason: string }[];
    totalOutperforming: number;
    isAltseason: boolean;
  };
  stocks: {
    watchlist: {
      symbol: string;
      change: number;
      signal: string;
      price: number;
    }[];
    opportunities: string[];
    sectorRotation: string[];
  };
  overall: {
    sentiment: "risk-on" | "risk-off" | "neutral";
    majorEvents: string[];
    catalysts: string[];
  };
}

export interface KnowledgeDigest {
  newResearch: {
    title: string;
    summary: string;
    source: string;
    importance: "high" | "medium" | "low";
    predictions: string[];
  }[];
  predictionUpdates: {
    original: string;
    current: string;
    accuracy: number;
    performance: string;
  }[];
  contentSummary: {
    totalItems: number;
    slackMessages: number;
    twitterPosts: number;
    researchPieces: number;
    topTopics: string[];
  };
}

export interface OpportunityAlert {
  type: "immediate" | "upcoming" | "watchlist";
  asset: string;
  signal: string;
  confidence: number;
  timeframe: string;
  action: string;
  reason: string;
  priceTargets?: {
    entry: number;
    target: number;
    stop: number;
  };
}

export class MorningBriefingService extends BaseDataService {
  static serviceType = "morning-briefing";
  capabilityDescription =
    "Generates proactive morning intelligence briefings with market data and curated insights";

  private briefingConfig: MorningBriefingConfig;
  private lastBriefing: Date | null = null;
  private scheduledBriefing: NodeJS.Timeout | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "morningBriefing");
    this.briefingConfig = this.getDefaultBriefingConfig();
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("MorningBriefingService starting...");
    const service = new MorningBriefingService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("MorningBriefingService stopping...");
    const service = runtime.getService("morning-briefing");
    if (service && service.stop) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Service starting...`,
    );
    await this.updateData();
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Service started successfully`,
    );
  }

  async init() {
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Service initialized`,
    );

    // Schedule daily briefings
    this.scheduleDailyBriefing();

    // Generate initial briefing if none exists
    if (!this.lastBriefing) {
      await this.generateMorningBriefing();
    }
  }

  async stop() {
    if (this.scheduledBriefing) {
      clearTimeout(this.scheduledBriefing);
    }
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Service stopped`,
    );
  }

  /**
   * Required abstract method implementation
   */
  async updateData(): Promise<void> {
    try {
      // Check if it's time for a new briefing
      const now = new Date();
      const lastBriefingDate = this.lastBriefing
        ? new Date(this.lastBriefing)
        : null;

      if (
        !lastBriefingDate ||
        (now.getDate() !== lastBriefingDate.getDate() &&
          now.getHours() >= this.briefingConfig.deliveryTime.hour)
      ) {
        await this.generateMorningBriefing();
      }
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Error updating data:`,
        error,
      );
    }
  }

  /**
   * Required abstract method implementation
   */
  async forceUpdate(): Promise<any> {
    try {
      return await this.generateMorningBriefing();
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Error in force update:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get default configuration for this service
   */
  protected getDefaultConfig(): any {
    return {
      enabled: true,
      cacheTimeout: 3600000, // 1 hour
      maxRetries: 3,
      rateLimitPerMinute: 30,
      deliveryTime: { hour: 7, minute: 0 },
      timezone: "America/New_York",
      includeWeather: true,
      includeMarketData: true,
      includeNewsDigest: true,
      includePerformanceTracking: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
    };
  }

  /**
   * Handle configuration changes
   */
  protected async onConfigurationChanged(newConfig: any): Promise<void> {
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Configuration updated`,
    );

    // Update briefing config if delivery time changed
    if (newConfig.deliveryTime) {
      this.briefingConfig.deliveryTime = newConfig.deliveryTime;

      // Reschedule if delivery time changed
      if (this.scheduledBriefing) {
        clearTimeout(this.scheduledBriefing);
        this.scheduleDailyBriefing();
      }
    }
  }

  private getDefaultBriefingConfig(): MorningBriefingConfig {
    return {
      deliveryTime: { hour: 7, minute: 0 }, // 7:00 AM
      timezone: "America/New_York",
      includeWeather: true,
      includeMarketData: true,
      includeNewsDigest: true,
      includePerformanceTracking: true,
      personalizations: {
        greetingStyle: "satoshi",
        focusAreas: ["bitcoin", "stocks", "crypto"],
        alertThresholds: {
          bitcoinPriceChange: 5.0, // 5% change triggers alert
          stockMoves: 10.0, // 10% move triggers alert
          altcoinOutperformance: 15.0, // 15% outperformance triggers alert
        },
      },
    };
  }

  private scheduleDailyBriefing() {
    // Calculate milliseconds until next briefing time
    const now = new Date();
    const next = new Date();
    next.setHours(
      this.briefingConfig.deliveryTime.hour,
      this.briefingConfig.deliveryTime.minute,
      0,
      0,
    );

    // If the time has already passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    const msUntilNext = next.getTime() - now.getTime();

    this.scheduledBriefing = setTimeout(async () => {
      await this.generateMorningBriefing();

      // Schedule the next briefing (24 hours later)
      this.scheduleDailyBriefing();
    }, msUntilNext);

    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Next morning briefing scheduled for ${next.toLocaleString()}`,
    );
  }

  async generateMorningBriefing(): Promise<ProcessedIntelligence> {
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Generating morning intelligence briefing...`,
    );

    try {
      // Gather all necessary data
      const [weatherData, marketPulse, knowledgeDigest, opportunities] =
        await Promise.all([
          this.briefingConfig.includeWeather
            ? this.getWeatherData()
            : Promise.resolve(null),
          this.briefingConfig.includeMarketData
            ? this.getMarketPulse()
            : Promise.resolve(null),
          this.briefingConfig.includeNewsDigest
            ? this.getKnowledgeDigest()
            : Promise.resolve(null),
          this.getOpportunities(),
        ]);

      // Generate the briefing
      const briefing = await this.compileBriefing(
        weatherData,
        marketPulse,
        knowledgeDigest,
        opportunities,
      );

      // Store in memory for persistence - DISABLED to prevent database errors
      // await this.storeInMemory(briefing, 'morning-briefing');

      // Log the briefing
      elizaLogger.info(
        `[MorningBriefingService:${this.correlationId}] Morning briefing generated: ${briefing.briefingId}`,
      );
      this.lastBriefing = new Date();

      return briefing;
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Failed to generate morning briefing:`,
        error,
      );
      throw error;
    }
  }

  private async getWeatherData(): Promise<WeatherData | null> {
    try {
      // Get real weather data from RealTimeDataService
      const realTimeDataService = this.runtime.getService(
        "RealTimeDataService",
      ) as any;
      if (!realTimeDataService) {
        elizaLogger.warn(
          `[MorningBriefingService:${this.correlationId}] RealTimeDataService not available for weather data`,
        );
        return null;
      }

      const weatherData = realTimeDataService.getWeatherData();
      if (!weatherData) {
        elizaLogger.warn(
          `[MorningBriefingService:${this.correlationId}] No weather data available`,
        );
        return null;
      }

      // Format for morning briefing - use Monaco as primary (tax haven preference)
      const monaco = weatherData.cities.find((c: any) => c.city === "monaco");
      const biarritz = weatherData.cities.find(
        (c: any) => c.city === "biarritz",
      );
      const bordeaux = weatherData.cities.find(
        (c: any) => c.city === "bordeaux",
      );

      // Use best weather city or Monaco as fallback
      const primaryCity =
        weatherData.cities.find(
          (c: any) => c.displayName === weatherData.summary.bestWeatherCity,
        ) || monaco;

      if (!primaryCity) {
        return null;
      }

      // Get primary city temperature (handle optional values)
      const primaryTemp = primaryCity.weather.current?.temperature_2m || 15;

      // Convert wind conditions to descriptive text
      let condition = "clear";
      if (weatherData.summary.windConditions === "stormy") condition = "stormy";
      else if (weatherData.summary.windConditions === "windy")
        condition = "windy";
      else if (weatherData.summary.airQuality === "poor") condition = "hazy";
      else if (primaryTemp > 20) condition = "sunny";
      else condition = "clear";

      // Create enhanced description with all cities (handle optional values)
      let description = `${primaryCity.displayName}: ${primaryTemp}°C`;
      if (monaco && monaco !== primaryCity) {
        const monacoTemp = monaco.weather.current?.temperature_2m || "N/A";
        description += `, Monaco: ${monacoTemp}°C`;
      }
      if (biarritz && biarritz !== primaryCity) {
        const biarritzTemp = biarritz.weather.current?.temperature_2m || "N/A";
        description += `, Biarritz: ${biarritzTemp}°C`;
        if (biarritz.marine) {
          description += ` (${biarritz.marine.current.wave_height}m waves)`;
        }
      }
      if (bordeaux && bordeaux !== primaryCity) {
        const bordeauxTemp = bordeaux.weather.current?.temperature_2m || "N/A";
        description += `, Bordeaux: ${bordeauxTemp}°C`;
      }

      description += `. Air quality: ${weatherData.summary.airQuality}`;

      if (weatherData.summary.bestSurfConditions) {
        description += `, best surf: ${weatherData.summary.bestSurfConditions}`;
      }

      return {
        location: weatherData.summary.bestWeatherCity,
        temperature: Math.round(primaryTemp),
        condition,
        description,
        humidity: 65, // Open-Meteo doesn't provide humidity in current endpoint
        windSpeed: Math.round(primaryCity.weather.current?.wind_speed_10m || 0),
      };
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Error fetching weather data:`,
        error,
      );
      return null;
    }
  }

  private async getMarketPulse(): Promise<MarketPulse | null> {
    try {
      // Get Bitcoin data service
      const bitcoinService = this.runtime.getService(
        "bitcoin-intelligence",
      ) as any;
      if (!bitcoinService) {
        elizaLogger.warn(
          `[MorningBriefingService:${this.correlationId}] BitcoinDataService not available`,
        );
        return null;
      }

      // Get Bitcoin price and analysis
      const bitcoinPrice = await bitcoinService.getBitcoinPrice();
      const thesisMetrics =
        await bitcoinService.calculateThesisMetrics(bitcoinPrice);

      // Get real stock data from StockDataService
      const stockDataService = this.runtime.getService("stock-data") as any;
      let stockData = null;
      if (stockDataService && stockDataService.getStockData) {
        try {
          stockData = stockDataService.getStockData();
          elizaLogger.info(
            `[MorningBriefingService:${this.correlationId}] Stock data loaded for morning briefing`,
          );
        } catch (error) {
          elizaLogger.warn(
            `[MorningBriefingService:${this.correlationId}] Failed to get stock data:`,
            error,
          );
        }
      }

      // Build stocks section with real data or fallback
      let stocksSection = {
        watchlist: [
          {
            symbol: "TSLA",
            change: 3.2,
            signal: "Breakout above resistance",
            price: 350,
          },
          {
            symbol: "MSTR",
            change: 7.8,
            signal: "Bitcoin correlation play",
            price: 420,
          },
        ],
        opportunities: ["Tech sector rotation", "AI infrastructure plays"],
        sectorRotation: ["Technology", "Energy"],
      };

      if (stockData && stockData.performance) {
        const { performance, stocks, mag7 } = stockData;

        // Get top performers for watchlist
        const topPerformers = performance.topPerformers
          .slice(0, 5)
          .map((comp) => {
            let signal = "Market neutral";
            if (comp.vsMag7.outperforming && comp.vsSp500.outperforming) {
              signal = "Outperforming both MAG7 and S&P 500";
            } else if (comp.vsMag7.outperforming) {
              signal = "Outperforming MAG7";
            } else if (comp.vsSp500.outperforming) {
              signal = "Outperforming S&P 500";
            } else {
              signal = "Underperforming market";
            }

            return {
              symbol: comp.stock.symbol,
              change: comp.stock.changePercent,
              signal,
              price: comp.stock.price,
            };
          });

        // Generate opportunities based on performance
        const opportunities = [];
        if (performance.bitcoinRelatedAverage > performance.mag7Average) {
          opportunities.push("Bitcoin proxy stocks outperforming tech");
        }
        if (performance.techStocksAverage > performance.sp500Performance) {
          opportunities.push("Tech sector leading broader market");
        }
        if (
          performance.topPerformers.some(
            (p) => p.stock.sector === "bitcoin-related",
          )
        ) {
          opportunities.push("Bitcoin treasury strategies gaining momentum");
        }

        // Determine sector rotation
        const sectorRotation = [];
        if (performance.bitcoinRelatedAverage > performance.techStocksAverage) {
          sectorRotation.push("Bitcoin-related equities");
        }
        if (performance.techStocksAverage > 0) {
          sectorRotation.push("Technology");
        }
        if (performance.mag7Average > performance.sp500Performance) {
          sectorRotation.push("Large-cap tech concentration");
        }

        stocksSection = {
          watchlist: topPerformers,
          opportunities:
            opportunities.length > 0
              ? opportunities
              : ["Monitor market consolidation"],
          sectorRotation:
            sectorRotation.length > 0
              ? sectorRotation
              : ["Broad market participation"],
        };
      }

      // Get real altcoin performance data from RealTimeDataService
      const realTimeDataService = this.runtime.getService(
        "real-time-data",
      ) as any;
      let altcoinsData = {
        outperformers: [
          { symbol: "ETH", change: 5.2, reason: "Ethereum upgrade momentum" },
          { symbol: "SOL", change: 8.7, reason: "DeFi activity surge" },
        ],
        underperformers: [
          { symbol: "ADA", change: -3.1, reason: "Profit taking" },
        ],
        totalOutperforming: 15,
        isAltseason: false,
      };

      // Get real altcoin performance data
      const altcoinService = this.runtime.getService("altcoin-data") as any;
      if (altcoinService) {
        try {
          const curatedData = altcoinService.getCuratedAltcoinsData();
          
          if (curatedData && Object.keys(curatedData).length > 0) {
            const coins = Object.values(curatedData);
            const positivePerformers = coins.filter((coin: any) => coin.change24h > 0);
            const negativePerformers = coins.filter((coin: any) => coin.change24h < 0);

            // Get top outperformers (up to 5 for briefing)
            const topOutperformers = positivePerformers
              .sort((a: any, b: any) => b.change24h - a.change24h)
              .slice(0, 5)
              .map((coin: any) => ({
                symbol: coin.symbol,
                change: coin.change24h,
                reason: `24h change: +${coin.change24h.toFixed(1)}%`,
              }));

            // Get top underperformers (up to 3 for briefing)
            const topUnderperformers = negativePerformers
              .sort((a: any, b: any) => a.change24h - b.change24h)
              .slice(0, 3)
              .map((coin: any) => ({
                symbol: coin.symbol,
                change: coin.change24h,
                reason: `24h change: ${coin.change24h.toFixed(1)}%`,
              }));

            const outperformingPercent = (positivePerformers.length / coins.length) * 100;
            const isAltseason = outperformingPercent > 50;

            altcoinsData = {
              outperformers: topOutperformers,
              underperformers: topUnderperformers,
              totalOutperforming: positivePerformers.length,
              isAltseason: isAltseason,
            };

            elizaLogger.info(
              `[MorningBriefingService:${this.correlationId}] Real altcoin data loaded: ${positivePerformers.length}/${coins.length} positive performers (${outperformingPercent.toFixed(1)}%)`,
            );
          }
        } catch (error) {
          elizaLogger.warn(
            `[MorningBriefingService:${this.correlationId}] Failed to get real altcoin data, using fallback:`,
            error,
          );
        }
      }

      const marketPulse: MarketPulse = {
        bitcoin: {
          price: bitcoinPrice,
          change24h: 2.5, // Could get from RealTimeDataService
          change7d: 8.2, // Could get from RealTimeDataService
          trend: "bullish",
          thesisProgress: thesisMetrics.progressPercentage,
          nextResistance: bitcoinPrice * 1.05,
          nextSupport: bitcoinPrice * 0.95,
        },
        altcoins: altcoinsData,
        stocks: stocksSection,
        overall: {
          sentiment:
            stockData && stockData.performance.mag7Average > 0
              ? "risk-on"
              : "risk-off",
          majorEvents: ["Fed decision pending", "Bitcoin ETF flows"],
          catalysts:
            stockData && stockData.performance.bitcoinRelatedAverage > 0
              ? [
                  "Institutional Bitcoin adoption",
                  "Corporate treasury diversification",
                  "Regulatory clarity",
                ]
              : ["Institutional adoption", "Regulatory clarity"],
        },
      };

      return marketPulse;
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Failed to get market pulse:`,
        error,
      );
      return null;
    }
  }

  private async getKnowledgeDigest(): Promise<KnowledgeDigest | null> {
    try {
      // Get Slack ingestion service
      const slackService = this.runtime.getService(
        "slack-ingestion",
      ) as SlackIngestionService;

      let contentSummary = {
        totalItems: 0,
        slackMessages: 0,
        twitterPosts: 0,
        researchPieces: 0,
        topTopics: [],
      };

      if (slackService) {
        const recentContent = await slackService.getRecentContent(24);
        contentSummary = {
          totalItems: recentContent.length,
          slackMessages: recentContent.filter((item) => item.source === "slack")
            .length,
          twitterPosts: recentContent.filter((item) => item.type === "tweet")
            .length,
          researchPieces: recentContent.filter(
            (item) => item.type === "research",
          ).length,
          topTopics: ["Bitcoin", "MSTY", "MetaPlanet", "Hyperliquid"], // Mock data
        };
      }

      const knowledgeDigest: KnowledgeDigest = {
        newResearch: [
          {
            title: "MetaPlanet Bitcoin Strategy Analysis",
            summary: "Deep dive into Japanese corporate Bitcoin adoption",
            source: "LiveTheLifeTV Research",
            importance: "high",
            predictions: ["50x potential over 2 years"],
          },
        ],
        predictionUpdates: [
          {
            original: "Hyperliquid to challenge CEXs",
            current: "Hyperliquid orderbook model gaining traction",
            accuracy: 85,
            performance: "Tracking well - predicted 6 months ago",
          },
        ],
        contentSummary,
      };

      return knowledgeDigest;
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Failed to get knowledge digest:`,
        error,
      );
      return null;
    }
  }

  private async getOpportunities(): Promise<OpportunityAlert[]> {
    // Mock opportunity data - in real implementation, analyze market conditions
    return [
      {
        type: "immediate",
        asset: "BTC",
        signal: "Support holding at $100K",
        confidence: 80,
        timeframe: "1-3 days",
        action: "Accumulate on dips",
        reason: "Institutional demand strong",
        priceTargets: {
          entry: 100000,
          target: 110000,
          stop: 95000,
        },
      },
      {
        type: "upcoming",
        asset: "MSTY",
        signal: "Options premium elevated",
        confidence: 75,
        timeframe: "1-2 weeks",
        action: "Consider covered calls",
        reason: "Volatility expansion expected",
      },
    ];
  }

  private async compileBriefing(
    weather: WeatherData | null,
    market: MarketPulse | null,
    knowledge: KnowledgeDigest | null,
    opportunities: OpportunityAlert[],
  ): Promise<ProcessedIntelligence> {
    const briefingId = `briefing-${Date.now()}`;

    // Generate greeting based on style
    const greeting = this.generateGreeting(weather, market);

    const briefing: ProcessedIntelligence = {
      briefingId,
      date: new Date(),
      content: {
        weather: weather
          ? `${weather.condition}, ${weather.temperature}°C`
          : undefined,
        marketPulse: market
          ? {
              bitcoin: {
                price: market.bitcoin.price,
                change24h: market.bitcoin.change24h,
                trend: market.bitcoin.trend,
              },
              altcoins: {
                outperformers: market.altcoins.outperformers.map(
                  (o) => o.symbol,
                ),
                underperformers: market.altcoins.underperformers.map(
                  (u) => u.symbol,
                ),
                signals: market.altcoins.outperformers.map(
                  (o) => `${o.symbol}: ${o.reason}`,
                ),
              },
              stocks: {
                watchlist: market.stocks.watchlist.map((s) => ({
                  symbol: s.symbol,
                  change: s.change,
                  signal: s.signal,
                })),
                opportunities: market.stocks.opportunities,
              },
            }
          : {
              bitcoin: { price: 0, change24h: 0, trend: "neutral" },
              altcoins: { outperformers: [], underperformers: [], signals: [] },
              stocks: { watchlist: [], opportunities: [] },
            },
        knowledgeDigest: knowledge
          ? {
              newInsights: knowledge.newResearch.map((r) => r.title),
              predictionUpdates: knowledge.predictionUpdates.map(
                (p) => p.current,
              ),
              performanceReport: knowledge.predictionUpdates.map(
                (p) => `${p.original}: ${p.accuracy}% accuracy`,
              ),
            }
          : {
              newInsights: [],
              predictionUpdates: [],
              performanceReport: [],
            },
        opportunities: {
          immediate: opportunities
            .filter((o) => o.type === "immediate")
            .map((o) => `${o.asset}: ${o.signal}`),
          upcoming: opportunities
            .filter((o) => o.type === "upcoming")
            .map((o) => `${o.asset}: ${o.signal}`),
          watchlist: opportunities
            .filter((o) => o.type === "watchlist")
            .map((o) => `${o.asset}: ${o.signal}`),
        },
      },
      deliveryMethod: "morning-briefing",
    };

    return briefing;
  }

  private generateGreeting(
    weather: WeatherData | null,
    market: MarketPulse | null,
  ): string {
    const style = this.briefingConfig.personalizations.greetingStyle;
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    switch (style) {
      case "satoshi":
        return `GM. ${time}. ${weather?.condition || "Clear skies"}. ${market?.bitcoin ? `Bitcoin at $${market.bitcoin.price.toLocaleString()}` : "Systems operational"}.`;

      case "professional":
        return `Good morning. Here's your ${time} market briefing. ${weather?.condition ? `Weather: ${weather.condition}` : ""}`;

      case "casual":
      default:
        return `Hey! ${time} briefing ready. ${weather?.condition ? `Looking ${weather.condition} outside` : ""}`;
    }
  }

  /**
   * Generate briefing on demand
   */
  async generateOnDemandBriefing(): Promise<ProcessedIntelligence> {
    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Generating on-demand briefing...`,
    );
    return await this.generateMorningBriefing();
  }

  /**
   * Update briefing configuration
   */
  async updateConfig(newConfig: Partial<MorningBriefingConfig>): Promise<void> {
    this.briefingConfig = { ...this.briefingConfig, ...newConfig };

    // Reschedule if delivery time changed
    if (newConfig.deliveryTime && this.scheduledBriefing) {
      clearTimeout(this.scheduledBriefing);
      this.scheduleDailyBriefing();
    }

    elizaLogger.info(
      `[MorningBriefingService:${this.correlationId}] Briefing configuration updated`,
    );
  }

  /**
   * Get briefing history
   */
  async getBriefingHistory(
    days: number = 7,
  ): Promise<{ lastBriefing: Date | null; totalGenerated: number }> {
    try {
      const recentBriefings = await this.getFromMemory(
        "morning-briefing",
        days,
      );

      return {
        lastBriefing: this.lastBriefing,
        totalGenerated: recentBriefings.length,
      };
    } catch (error) {
      elizaLogger.error(
        `[MorningBriefingService:${this.correlationId}] Failed to get briefing history:`,
        error,
      );
      return {
        lastBriefing: this.lastBriefing,
        totalGenerated: 0,
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MorningBriefingConfig {
    return { ...this.briefingConfig };
  }
}
