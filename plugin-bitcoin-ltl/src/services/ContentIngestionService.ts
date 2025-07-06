import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import {
  ConfigurationManager,
  type ServiceConfig,
} from "./ConfigurationManager";
import {
  ElizaOSErrorHandler,
  LoggerWithContext,
  generateCorrelationId,
  validateElizaOSEnvironment,
} from "../utils";

export interface ContentItem {
  id: string;
  source: "slack" | "twitter" | "youtube" | "news";
  type: "tweet" | "post" | "video" | "article" | "research" | "podcast";
  content: string;
  metadata: {
    author?: string;
    timestamp: Date;
    url?: string;
    tags?: string[];
    sentiment?: "bullish" | "bearish" | "neutral";
    importance?: "high" | "medium" | "low";
    assets?: string[]; // Bitcoin, ETH, TSLA, etc.
  };
  processed: boolean;
  insights?: {
    predictions?: string[];
    actionItems?: string[];
    marketSignals?: string[];
    performance?: {
      prediction: string;
      accuracy?: number;
      outcome?: string;
    };
  };
}

export interface ProcessedIntelligence {
  briefingId: string;
  date: Date;
  content: {
    weather?: string;
    marketPulse: {
      bitcoin: {
        price: number;
        change24h: number;
        trend: string;
      };
      altcoins: {
        outperformers: string[];
        underperformers: string[];
        signals: string[];
      };
      stocks: {
        watchlist: { symbol: string; change: number; signal: string }[];
        opportunities: string[];
      };
    };
    knowledgeDigest: {
      newInsights: string[];
      predictionUpdates: string[];
      performanceReport: string[];
    };
    opportunities: {
      immediate: string[];
      upcoming: string[];
      watchlist: string[];
    };
  };
  deliveryMethod: "morning-briefing" | "alert" | "digest";
}

export abstract class ContentIngestionService extends BaseDataService {
  protected contextLogger: LoggerWithContext;
  protected contentQueue: ContentItem[] = [];
  protected processedContent: ContentItem[] = [];

  constructor(
    protected runtime: IAgentRuntime,
    protected serviceName: string,
    configKey: keyof ServiceConfig = "bitcoinData",
  ) {
    super(runtime, configKey);
    this.correlationId = generateCorrelationId();
    this.contextLogger = new LoggerWithContext(this.correlationId, serviceName);
  }

  // Set capability description after constructor
  public get capabilityDescription(): string {
    return "Ingests and processes content from various sources for analysis";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("ContentIngestionService starting...");
    // Individual services that extend this will provide their own start method
    return null;
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("ContentIngestionService stopping...");
    // Individual services that extend this will provide their own stop method
  }

  async start(): Promise<void> {
    this.contextLogger.info(`${this.serviceName} starting...`);
    await this.updateData();
    this.contextLogger.info(`${this.serviceName} started successfully`);
  }

  async init() {
    this.contextLogger.info(`${this.serviceName} initialized`);
  }

  async stop() {
    this.contextLogger.info(`${this.serviceName} stopped`);
  }

  // Required abstract methods from BaseDataService
  async updateData(): Promise<void> {
    try {
      const newContent = await this.ingestContent();
      if (newContent.length > 0) {
        const processedItems = await this.processContent(newContent);
        await this.storeContent(processedItems);

        // Store in memory for persistence
        await this.storeInMemory(
          {
            contentItems: processedItems,
            timestamp: Date.now(),
            source: this.serviceName,
          },
          "content-ingestion",
        );

        this.contextLogger.info(
          `Updated data: processed ${processedItems.length} new content items`,
        );
      }
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(
        error as Error,
        "ContentIngestionUpdate",
      );
      this.contextLogger.error(
        "Failed to update content data:",
        enhancedError.message,
      );
      throw enhancedError;
    }
  }

  async forceUpdate(): Promise<void> {
    this.contextLogger.info("Forcing content ingestion update");
    await this.updateData();
  }

  /**
   * Abstract method to be implemented by specific ingestion services
   */
  abstract ingestContent(): Promise<ContentItem[]>;

  /**
   * Process raw content and extract insights
   */
  async processContent(content: ContentItem[]): Promise<ContentItem[]> {
    const processedItems: ContentItem[] = [];

    for (const item of content) {
      try {
        const processedItem = await this.analyzeContent(item);
        processedItems.push(processedItem);
        this.contextLogger.info(`Processed content item: ${item.id}`);
      } catch (error) {
        const enhancedError = ElizaOSErrorHandler.handleCommonErrors(
          error as Error,
          "ContentProcessing",
        );
        this.contextLogger.error(
          `Failed to process content item ${item.id}:`,
          enhancedError.message,
        );
      }
    }

    return processedItems;
  }

  /**
   * Analyze individual content item for insights
   */
  private async analyzeContent(item: ContentItem): Promise<ContentItem> {
    // Use the runtime's AI capabilities to analyze content
    const analysisPrompt = `
    Analyze this ${item.type} from ${item.source} for investment insights and predictions:
    
    Content: ${item.content}
    
    Extract:
    1. Any predictions or market signals
    2. Action items or recommendations
    3. Asset mentions (Bitcoin, altcoins, stocks)
    4. Sentiment (bullish/bearish/neutral)
    5. Importance level (high/medium/low)
    
    Return analysis in JSON format.
    `;

    try {
      // This would use the runtime's AI model to analyze content
      // For now, we'll implement basic keyword analysis
      const insights = await this.performBasicAnalysis(item);

      return {
        ...item,
        processed: true,
        insights,
      };
    } catch (error) {
      this.contextLogger.error(
        `Content analysis failed for ${item.id}:`,
        (error as Error).message,
      );
      return {
        ...item,
        processed: false,
      };
    }
  }

  /**
   * Basic keyword-based analysis (placeholder for AI analysis)
   */
  private async performBasicAnalysis(
    item: ContentItem,
  ): Promise<ContentItem["insights"]> {
    const content = item.content.toLowerCase();
    const insights: ContentItem["insights"] = {
      predictions: [],
      actionItems: [],
      marketSignals: [],
    };

    // Detect predictions
    const predictionKeywords = [
      "predict",
      "forecast",
      "expect",
      "target",
      "will reach",
      "going to",
    ];
    if (predictionKeywords.some((keyword) => content.includes(keyword))) {
      insights.predictions?.push("Contains market prediction");
    }

    // Detect action items
    const actionKeywords = [
      "buy",
      "sell",
      "accumulate",
      "dca",
      "take profit",
      "stop loss",
    ];
    if (actionKeywords.some((keyword) => content.includes(keyword))) {
      insights.actionItems?.push("Contains trading action");
    }

    // Detect market signals
    const signalKeywords = [
      "breakout",
      "resistance",
      "support",
      "oversold",
      "overbought",
      "momentum",
    ];
    if (signalKeywords.some((keyword) => content.includes(keyword))) {
      insights.marketSignals?.push("Contains technical signal");
    }

    // Detect asset mentions
    const assetKeywords = [
      "bitcoin",
      "btc",
      "ethereum",
      "eth",
      "tesla",
      "tsla",
      "msty",
      "mstr",
    ];
    const mentionedAssets = assetKeywords.filter((asset) =>
      content.includes(asset),
    );
    if (mentionedAssets.length > 0) {
      item.metadata.assets = mentionedAssets;
    }

    // Determine sentiment
    const bullishKeywords = [
      "moon",
      "pump",
      "bullish",
      "buy",
      "accumulate",
      "hodl",
    ];
    const bearishKeywords = [
      "crash",
      "dump",
      "bearish",
      "sell",
      "short",
      "decline",
    ];

    const bullishCount = bullishKeywords.filter((keyword) =>
      content.includes(keyword),
    ).length;
    const bearishCount = bearishKeywords.filter((keyword) =>
      content.includes(keyword),
    ).length;

    if (bullishCount > bearishCount) {
      item.metadata.sentiment = "bullish";
    } else if (bearishCount > bullishCount) {
      item.metadata.sentiment = "bearish";
    } else {
      item.metadata.sentiment = "neutral";
    }

    // Determine importance
    const importanceKeywords = [
      "breaking",
      "urgent",
      "major",
      "significant",
      "huge",
      "massive",
    ];
    if (importanceKeywords.some((keyword) => content.includes(keyword))) {
      item.metadata.importance = "high";
    } else if (insights.predictions?.length || insights.actionItems?.length) {
      item.metadata.importance = "medium";
    } else {
      item.metadata.importance = "low";
    }

    return insights;
  }

  /**
   * Store processed content for later retrieval
   */
  async storeContent(content: ContentItem[]): Promise<void> {
    this.processedContent.push(...content);

    // Store in memory for persistence with timestamp
    await this.storeInMemory(
      {
        contentItems: content,
        timestamp: Date.now(),
        source: this.serviceName,
        count: content.length,
      },
      "processed-content",
    );

    this.contextLogger.info(`Stored ${content.length} processed content items`);
  }

  /**
   * Retrieve content by filters
   */
  async getContent(filters: {
    source?: ContentItem["source"];
    type?: ContentItem["type"];
    timeRange?: { start: Date; end: Date };
    importance?: ContentItem["metadata"]["importance"];
    assets?: string[];
  }): Promise<ContentItem[]> {
    // First check memory for cached results
    const cacheKey = `content-filter-${JSON.stringify(filters)}`;
    const cached = await this.getFromMemory(cacheKey, 10); // 10 minute cache

    if (cached.length > 0) {
      const cachedData = cached[0];
      if (Date.now() - cachedData.timestamp < 10 * 60 * 1000) {
        return cachedData.results;
      }
    }

    let filteredContent = this.processedContent;

    if (filters.source) {
      filteredContent = filteredContent.filter(
        (item) => item.source === filters.source,
      );
    }

    if (filters.type) {
      filteredContent = filteredContent.filter(
        (item) => item.type === filters.type,
      );
    }

    if (filters.timeRange) {
      filteredContent = filteredContent.filter(
        (item) =>
          item.metadata.timestamp >= filters.timeRange!.start &&
          item.metadata.timestamp <= filters.timeRange!.end,
      );
    }

    if (filters.importance) {
      filteredContent = filteredContent.filter(
        (item) => item.metadata.importance === filters.importance,
      );
    }

    if (filters.assets) {
      filteredContent = filteredContent.filter((item) =>
        item.metadata.assets?.some((asset) => filters.assets!.includes(asset)),
      );
    }

    // Store result in memory
    await this.storeInMemory(
      {
        results: filteredContent,
        timestamp: Date.now(),
        filters,
      },
      cacheKey,
    );

    return filteredContent;
  }

  /**
   * Get content summary for briefings
   */
  async generateContentSummary(timeRange: { start: Date; end: Date }): Promise<{
    totalItems: number;
    bySource: { [key: string]: number };
    byImportance: { [key: string]: number };
    topPredictions: string[];
    topSignals: string[];
    mentionedAssets: string[];
  }> {
    const content = await this.getContent({ timeRange });

    const summary = {
      totalItems: content.length,
      bySource: {} as { [key: string]: number },
      byImportance: {} as { [key: string]: number },
      topPredictions: [] as string[],
      topSignals: [] as string[],
      mentionedAssets: [] as string[],
    };

    // Count by source
    content.forEach((item) => {
      summary.bySource[item.source] = (summary.bySource[item.source] || 0) + 1;
    });

    // Count by importance
    content.forEach((item) => {
      const importance = item.metadata.importance || "low";
      summary.byImportance[importance] =
        (summary.byImportance[importance] || 0) + 1;
    });

    // Extract top predictions
    const predictions = content
      .filter((item) => item.insights?.predictions?.length)
      .flatMap((item) => item.insights!.predictions!)
      .slice(0, 5);
    summary.topPredictions = predictions;

    // Extract top signals
    const signals = content
      .filter((item) => item.insights?.marketSignals?.length)
      .flatMap((item) => item.insights!.marketSignals!)
      .slice(0, 5);
    summary.topSignals = signals;

    // Extract mentioned assets
    const assets = content
      .filter((item) => item.metadata.assets?.length)
      .flatMap((item) => item.metadata.assets!)
      .filter((asset, index, arr) => arr.indexOf(asset) === index) // unique
      .slice(0, 10);
    summary.mentionedAssets = assets;

    return summary;
  }

  /**
   * Get historical content processing metrics
   */
  async getContentMetrics(): Promise<{
    totalProcessed: number;
    averageProcessingTime: number;
    successRate: number;
    contentBySource: { [key: string]: number };
    contentByType: { [key: string]: number };
    lastProcessed: Date | null;
  }> {
    const memoryData = await this.getFromMemory("content-metrics", 1);

    if (memoryData.length > 0) {
      return memoryData[0];
    }

    // Calculate metrics
    const metrics = {
      totalProcessed: this.processedContent.length,
      averageProcessingTime: 0, // Would need to track this
      successRate:
        this.processedContent.filter((c) => c.processed).length /
        Math.max(this.processedContent.length, 1),
      contentBySource: {} as { [key: string]: number },
      contentByType: {} as { [key: string]: number },
      lastProcessed:
        this.processedContent.length > 0
          ? this.processedContent[this.processedContent.length - 1].metadata
              .timestamp
          : null,
    };

    // Calculate source and type distributions
    this.processedContent.forEach((item) => {
      metrics.contentBySource[item.source] =
        (metrics.contentBySource[item.source] || 0) + 1;
      metrics.contentByType[item.type] =
        (metrics.contentByType[item.type] || 0) + 1;
    });

    // Store in memory
    await this.storeInMemory(metrics, "content-metrics");

    return metrics;
  }
}
