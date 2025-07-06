import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import {
  LoggerWithContext,
  generateCorrelationId,
  globalErrorHandler,
} from "../utils";
import { CentralizedConfigService } from "./CentralizedConfigService";
import axios from "axios";

/**
 * Social Sentiment Interface
 */
export interface SocialSentiment {
  platform: string;
  symbol: string;
  sentiment: number; // -1 to 1
  mentions: number;
  timestamp: Date;
  trendingKeywords: string[];
}

/**
 * Social Platform Interface
 */
export interface SocialPlatform {
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
  weight: number; // Weight for sentiment calculation
}

/**
 * Sentiment Summary Interface
 */
export interface SentimentSummary {
  overallSentiment: number;
  totalMentions: number;
  platformBreakdown: Record<string, { sentiment: number; mentions: number }>;
  trendingKeywords: string[];
  sentimentTrend: "bullish" | "bearish" | "neutral";
  confidence: number;
  lastUpdated: Date;
}

/**
 * Social Sentiment Data Service
 * Handles all social sentiment data fetching, analysis, and aggregation
 */
export class SocialSentimentService extends BaseDataService {
  static serviceType = "social-sentiment";

  private contextLogger: LoggerWithContext;
  private configService: CentralizedConfigService;
  private errorHandler: typeof globalErrorHandler;
  private updateInterval: NodeJS.Timeout | null = null;

  // Data storage
  private socialSentiment: SocialSentiment[] = [];
  private sentimentSummary: SentimentSummary | null = null;

  // Social platforms configuration
  private readonly socialPlatforms: SocialPlatform[] = [
    {
      name: "twitter",
      enabled: true,
      baseUrl: "https://api.twitter.com/2",
      weight: 0.4,
    },
    {
      name: "reddit",
      enabled: true,
      baseUrl: "https://www.reddit.com/api",
      weight: 0.3,
    },
    {
      name: "telegram",
      enabled: true,
      baseUrl: "https://api.telegram.org",
      weight: 0.2,
    },
    {
      name: "discord",
      enabled: true,
      baseUrl: "https://discord.com/api",
      weight: 0.1,
    },
  ];

  // Cryptocurrency symbols to track
  private readonly trackedSymbols = ["BTC", "ETH", "SOL", "MATIC", "ADA"];

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "SocialSentimentService",
    );
    
    // Safely get the config service with retry logic
    this.configService = this.getConfigServiceSafely(runtime);
    this.errorHandler = globalErrorHandler;
  }

  /**
   * Safely get the CentralizedConfigService with retry logic
   */
  private getConfigServiceSafely(runtime: IAgentRuntime): CentralizedConfigService {
    let configService = runtime.getService<CentralizedConfigService>("centralized-config");
    
    if (!configService) {
      // If not available immediately, try again after a short delay
      setTimeout(() => {
        configService = runtime.getService<CentralizedConfigService>("centralized-config");
        if (configService) {
          this.configService = configService;
          this.contextLogger.info("CentralizedConfigService successfully retrieved");
        } else {
          this.contextLogger.warn("CentralizedConfigService not available after retry");
        }
      }, 1000);
      
      // Return a fallback config service for now
      return this.createFallbackConfigService();
    }
    
    return configService;
  }

  /**
   * Create a fallback config service when the main one is not available
   */
  private createFallbackConfigService(): CentralizedConfigService {
    // Create a minimal fallback that provides the essential methods
    const fallback = {
      get: (path: string, defaultValue?: any) => {
        this.contextLogger.warn(`Using fallback config for path: ${path}`);
        return defaultValue;
      },
      set: (path: string, value: any) => {
        this.contextLogger.warn(`Cannot set config in fallback mode: ${path}`);
      },
      getAll: () => ({}),
      watch: (path: string, listener: any) => () => {},
      validate: () => ({ valid: true, errors: [] }),
      getStats: () => ({ totalWatchers: 0, watchedPaths: [], lastModified: 0, configSize: 0 }),
      updateData: async () => {},
      forceUpdate: async () => ({}),
      start: async () => {},
      stop: async () => {},
      init: async () => {},
      capabilityDescription: "Fallback config service",
      serviceType: "centralized-config-fallback"
    };
    
    return fallback as unknown as CentralizedConfigService;
  }

  public get capabilityDescription(): string {
    return "Provides real-time social sentiment analysis across multiple platforms for cryptocurrency markets";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("Starting SocialSentimentService...");
    const service = new SocialSentimentService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("Stopping SocialSentimentService...");
    const service = runtime.getService(
      "social-sentiment",
    ) as unknown as SocialSentimentService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info("Starting social sentiment service...");
    await this.startRealTimeUpdates();
  }

  async init() {
    this.contextLogger.info("Initializing social sentiment service...");
    await this.updateData();
  }

  async stop(): Promise<void> {
    this.contextLogger.info("Stopping social sentiment service...");
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async updateData(): Promise<void> {
    try {
      this.contextLogger.info("Updating social sentiment data...");
      await this.updateSocialSentiment();
      this.contextLogger.info("Social sentiment data update completed");
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "updateData",
      });
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info("Forcing social sentiment data update...");
    await this.updateData();
  }

  /**
   * Start real-time updates for social sentiment data
   */
  private async startRealTimeUpdates(): Promise<void> {
    const updateInterval = this.configService.get(
      "services.socialSentiment.updateInterval",
      300000,
    ); // 5 minutes

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateData();
      } catch (error) {
        this.errorHandler.handleError(error, {
          component: "SocialSentimentService",
          operation: "startRealTimeUpdates",
        });
      }
    }, updateInterval);

    this.contextLogger.info(
      `Social sentiment updates scheduled every ${updateInterval}ms`,
    );
  }

  /**
   * Update social sentiment data
   */
  private async updateSocialSentiment(): Promise<void> {
    try {
      const sentimentData = await this.fetchSocialSentiment();
      if (sentimentData && sentimentData.length > 0) {
        this.socialSentiment = sentimentData;
        this.sentimentSummary = this.calculateSentimentSummary(sentimentData);
        this.contextLogger.info(
          `Updated ${sentimentData.length} sentiment records`,
        );
      } else {
        this.contextLogger.warn(
          "No social sentiment data available, using fallback",
        );
        this.socialSentiment = this.getFallbackSocialSentiment();
        this.sentimentSummary = this.calculateSentimentSummary(
          this.socialSentiment,
        );
      }
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "updateSocialSentiment",
      });
      this.socialSentiment = this.getFallbackSocialSentiment();
      this.sentimentSummary = this.calculateSentimentSummary(
        this.socialSentiment,
      );
    }
  }

  /**
   * Fetch social sentiment data from multiple platforms
   */
  private async fetchSocialSentiment(): Promise<SocialSentiment[]> {
    try {
      this.contextLogger.info("Fetching social sentiment data...");

      const sentimentData: SocialSentiment[] = [];
      const enabledPlatforms = this.socialPlatforms.filter(
        (platform) => platform.enabled,
      );

      // Fetch data for each platform and symbol combination
      for (const platform of enabledPlatforms) {
        for (const symbol of this.trackedSymbols) {
          try {
            const platformSentiment = await this.fetchPlatformSentiment(
              platform,
              symbol,
            );
            if (platformSentiment) {
              sentimentData.push(platformSentiment);
            }
          } catch (error) {
            this.errorHandler.handleError(error, {
              component: "SocialSentimentService",
              operation: `fetchPlatformSentiment.${platform.name}.${symbol}`,
            });
          }
        }
      }

      return sentimentData;
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "fetchSocialSentiment",
      });
      return this.getFallbackSocialSentiment();
    }
  }

  /**
   * Fetch sentiment data for a specific platform and symbol
   */
  private async fetchPlatformSentiment(
    platform: SocialPlatform,
    symbol: string,
  ): Promise<SocialSentiment | null> {
    try {
      let sentiment = 0;
      let mentions = 0;
      let trendingKeywords: string[] = [];

      switch (platform.name) {
        case "twitter":
          const twitterData = await this.fetchTwitterSentiment(symbol);
          sentiment = twitterData.sentiment;
          mentions = twitterData.mentions;
          trendingKeywords = twitterData.trendingKeywords;
          break;

        case "reddit":
          const redditData = await this.fetchRedditSentiment(symbol);
          sentiment = redditData.sentiment;
          mentions = redditData.mentions;
          trendingKeywords = redditData.trendingKeywords;
          break;

        case "telegram":
          const telegramData = await this.fetchTelegramSentiment(symbol);
          sentiment = telegramData.sentiment;
          mentions = telegramData.mentions;
          trendingKeywords = telegramData.trendingKeywords;
          break;

        case "discord":
          const discordData = await this.fetchDiscordSentiment(symbol);
          sentiment = discordData.sentiment;
          mentions = discordData.mentions;
          trendingKeywords = discordData.trendingKeywords;
          break;

        default:
          this.contextLogger.warn(`Unsupported platform: ${platform.name}`);
          return null;
      }

      return {
        platform: platform.name,
        symbol,
        sentiment,
        mentions,
        timestamp: new Date(),
        trendingKeywords,
      };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: `fetchPlatformSentiment.${platform.name}.${symbol}`,
      });
      return null;
    }
  }

  /**
   * Fetch Twitter sentiment data
   */
  private async fetchTwitterSentiment(
    symbol: string,
  ): Promise<{
    sentiment: number;
    mentions: number;
    trendingKeywords: string[];
  }> {
    try {
      const apiKey = this.configService.get("apis.twitter.apiKey", "");
      if (!apiKey) {
        return this.getMockSentimentData();
      }

      // Mock Twitter API call (replace with actual Twitter API v2 implementation)
      const response = await axios.get(
        `${this.socialPlatforms.find((p) => p.name === "twitter")?.baseUrl}/tweets/search/recent`,
        {
          params: {
            query: `${symbol} crypto`,
            max_results: 100,
          },
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 10000,
        },
      );

      // Process tweets for sentiment analysis
      const tweets = response.data.data || [];
      const sentiment = this.analyzeTextSentiment(
        tweets.map((tweet: any) => tweet.text).join(" "),
      );
      const mentions = tweets.length;
      const trendingKeywords = this.extractTrendingKeywords(
        tweets.map((tweet: any) => tweet.text).join(" "),
      );

      return { sentiment, mentions, trendingKeywords };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "fetchTwitterSentiment",
      });
      return this.getMockSentimentData();
    }
  }

  /**
   * Fetch Reddit sentiment data
   */
  private async fetchRedditSentiment(
    symbol: string,
  ): Promise<{
    sentiment: number;
    mentions: number;
    trendingKeywords: string[];
  }> {
    try {
      // Mock Reddit API call (replace with actual Reddit API implementation)
      const response = await axios.get(
        `${this.socialPlatforms.find((p) => p.name === "reddit")?.baseUrl}/search.json`,
        {
          params: {
            q: symbol,
            subreddit: "cryptocurrency,bitcoin,ethereum",
            sort: "hot",
            limit: 100,
          },
          timeout: 10000,
        },
      );

      const posts = response.data.data?.children || [];
      const sentiment = this.analyzeTextSentiment(
        posts
          .map((post: any) => post.data.title + " " + post.data.selftext)
          .join(" "),
      );
      const mentions = posts.length;
      const trendingKeywords = this.extractTrendingKeywords(
        posts
          .map((post: any) => post.data.title + " " + post.data.selftext)
          .join(" "),
      );

      return { sentiment, mentions, trendingKeywords };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "fetchRedditSentiment",
      });
      return this.getMockSentimentData();
    }
  }

  /**
   * Fetch Telegram sentiment data
   */
  private async fetchTelegramSentiment(
    symbol: string,
  ): Promise<{
    sentiment: number;
    mentions: number;
    trendingKeywords: string[];
  }> {
    try {
      const apiKey = this.configService.get("apis.telegram.apiKey", "");
      if (!apiKey) {
        return this.getMockSentimentData();
      }

      // Mock Telegram API call (replace with actual Telegram Bot API implementation)
      const response = await axios.get(
        `${this.socialPlatforms.find((p) => p.name === "telegram")?.baseUrl}/bot${apiKey}/getUpdates`,
        {
          timeout: 10000,
        },
      );

      const messages = response.data.result || [];
      const sentiment = this.analyzeTextSentiment(
        messages.map((msg: any) => msg.message?.text || "").join(" "),
      );
      const mentions = messages.length;
      const trendingKeywords = this.extractTrendingKeywords(
        messages.map((msg: any) => msg.message?.text || "").join(" "),
      );

      return { sentiment, mentions, trendingKeywords };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "fetchTelegramSentiment",
      });
      return this.getMockSentimentData();
    }
  }

  /**
   * Fetch Discord sentiment data
   */
  private async fetchDiscordSentiment(
    symbol: string,
  ): Promise<{
    sentiment: number;
    mentions: number;
    trendingKeywords: string[];
  }> {
    try {
      const apiKey = this.configService.get("apis.discord.apiKey", "");
      if (!apiKey) {
        return this.getMockSentimentData();
      }

      // Mock Discord API call (replace with actual Discord API implementation)
      const response = await axios.get(
        `${this.socialPlatforms.find((p) => p.name === "discord")?.baseUrl}/channels/messages`,
        {
          headers: {
            Authorization: `Bot ${apiKey}`,
          },
          timeout: 10000,
        },
      );

      const messages = response.data || [];
      const sentiment = this.analyzeTextSentiment(
        messages.map((msg: any) => msg.content || "").join(" "),
      );
      const mentions = messages.length;
      const trendingKeywords = this.extractTrendingKeywords(
        messages.map((msg: any) => msg.content || "").join(" "),
      );

      return { sentiment, mentions, trendingKeywords };
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: "SocialSentimentService",
        operation: "fetchDiscordSentiment",
      });
      return this.getMockSentimentData();
    }
  }

  /**
   * Analyze text sentiment using simple keyword analysis
   */
  private analyzeTextSentiment(text: string): number {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      "bullish",
      "moon",
      "pump",
      "surge",
      "rally",
      "gain",
      "profit",
      "positive",
      "growth",
      "adoption",
      "innovation",
      "breakthrough",
      "success",
      "win",
      "up",
      "higher",
      "strong",
      "buy",
      "hodl",
      "diamond",
      "rocket",
      "lambo",
      "mooning",
      "pumping",
    ];

    const negativeWords = [
      "bearish",
      "dump",
      "crash",
      "drop",
      "loss",
      "negative",
      "decline",
      "rejection",
      "failure",
      "problem",
      "issue",
      "down",
      "lower",
      "weak",
      "sell",
      "fud",
      "scam",
      "rug",
      "dead",
      "dying",
      "bear",
      "dumpster",
    ];

    const positiveCount = positiveWords.filter((word) =>
      lowerText.includes(word),
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      lowerText.includes(word),
    ).length;

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  /**
   * Extract trending keywords from text
   */
  private extractTrendingKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !["this", "that", "with", "have", "will", "from"].includes(word),
      );

    const keywordCounts = new Map<string, number>();
    words.forEach((word) => {
      keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
    });

    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Calculate sentiment summary from all platform data
   */
  private calculateSentimentSummary(
    sentimentData: SocialSentiment[],
  ): SentimentSummary {
    const platformBreakdown: Record<
      string,
      { sentiment: number; mentions: number }
    > = {};
    let totalSentiment = 0;
    let totalMentions = 0;
    const allKeywords: string[] = [];

    // Group by platform
    const platformGroups = new Map<string, SocialSentiment[]>();
    sentimentData.forEach((item) => {
      if (!platformGroups.has(item.platform)) {
        platformGroups.set(item.platform, []);
      }
      platformGroups.get(item.platform)!.push(item);
    });

    // Calculate platform-specific metrics
    platformGroups.forEach((items, platform) => {
      const platformSentiment =
        items.reduce((sum, item) => sum + item.sentiment, 0) / items.length;
      const platformMentions = items.reduce(
        (sum, item) => sum + item.mentions,
        0,
      );

      platformBreakdown[platform] = {
        sentiment: platformSentiment,
        mentions: platformMentions,
      };

      totalSentiment +=
        platformSentiment *
        (this.socialPlatforms.find((p) => p.name === platform)?.weight || 1);
      totalMentions += platformMentions;
      allKeywords.push(...items.flatMap((item) => item.trendingKeywords));
    });

    const overallSentiment =
      totalSentiment / this.socialPlatforms.filter((p) => p.enabled).length;

    // Determine sentiment trend
    let sentimentTrend: "bullish" | "bearish" | "neutral";
    if (overallSentiment > 0.1) sentimentTrend = "bullish";
    else if (overallSentiment < -0.1) sentimentTrend = "bearish";
    else sentimentTrend = "neutral";

    // Calculate confidence based on mention volume
    const confidence = Math.min(totalMentions / 1000, 1); // Max confidence at 1000 mentions

    // Get trending keywords across all platforms
    const keywordCounts = new Map<string, number>();
    allKeywords.forEach((keyword) => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
    const trendingKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    return {
      overallSentiment,
      totalMentions,
      platformBreakdown,
      trendingKeywords,
      sentimentTrend,
      confidence,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get mock sentiment data for fallback
   */
  private getMockSentimentData(): {
    sentiment: number;
    mentions: number;
    trendingKeywords: string[];
  } {
    return {
      sentiment: (Math.random() - 0.5) * 2, // Random sentiment between -1 and 1
      mentions: Math.floor(Math.random() * 100) + 10,
      trendingKeywords: ["bitcoin", "crypto", "market", "trading", "bullish"],
    };
  }

  /**
   * Get fallback social sentiment data
   */
  private getFallbackSocialSentiment(): SocialSentiment[] {
    return this.trackedSymbols.map((symbol) => ({
      platform: "mock",
      symbol,
      sentiment: (Math.random() - 0.5) * 2,
      mentions: Math.floor(Math.random() * 100) + 10,
      timestamp: new Date(),
      trendingKeywords: ["bitcoin", "crypto", "market", "trading"],
    }));
  }

  /**
   * Get all social sentiment data
   */
  public getSocialSentiment(): SocialSentiment[] {
    return this.socialSentiment;
  }

  /**
   * Get sentiment summary
   */
  public getSentimentSummary(): SentimentSummary | null {
    return this.sentimentSummary;
  }

  /**
   * Get sentiment by platform
   */
  public getSentimentByPlatform(platform: string): SocialSentiment[] {
    return this.socialSentiment.filter((item) => item.platform === platform);
  }

  /**
   * Get sentiment by symbol
   */
  public getSentimentBySymbol(symbol: string): SocialSentiment[] {
    return this.socialSentiment.filter((item) => item.symbol === symbol);
  }

  /**
   * Get overall market sentiment
   */
  public getOverallSentiment(): number {
    return this.sentimentSummary?.overallSentiment || 0;
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    totalRecords: number;
    platformsCount: number;
    symbolsCount: number;
    overallSentiment: number;
    totalMentions: number;
    lastUpdate: Date | null;
  } {
    return {
      totalRecords: this.socialSentiment.length,
      platformsCount: new Set(this.socialSentiment.map((item) => item.platform))
        .size,
      symbolsCount: new Set(this.socialSentiment.map((item) => item.symbol))
        .size,
      overallSentiment: this.sentimentSummary?.overallSentiment || 0,
      totalMentions: this.sentimentSummary?.totalMentions || 0,
      lastUpdate: this.sentimentSummary?.lastUpdated || null,
    };
  }
}
