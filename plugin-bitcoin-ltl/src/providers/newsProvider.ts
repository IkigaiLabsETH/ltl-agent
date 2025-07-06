import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { RealTimeDataService } from "../services/RealTimeDataService";

/**
 * News Provider - News and sentiment analysis
 * Following ElizaOS documentation patterns
 * Dynamic provider: Only used when explicitly requested
 */
export const newsProvider: Provider = {
  name: "news",
  description: "Provides recent news and sentiment analysis",
  dynamic: true, // Only used when explicitly requested

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      const realTimeService = runtime.getService(
        "real-time-data",
      ) as RealTimeDataService;

      if (!realTimeService) {
        return {
          text: "News service not available",
          values: { newsError: true },
        };
      }

      // Get news and sentiment data
      const newsItems = realTimeService.getNewsItems();
      const socialSentiment = realTimeService.getSocialSentiment();

      // Format news context
      let context = "Recent news: ";

      if (newsItems?.length > 0) {
        const recentNews = newsItems.slice(0, 3);
        const newsSummary = recentNews
          .map((item) => {
            const sentimentEmoji =
              item.sentiment === "positive"
                ? "📈"
                : item.sentiment === "negative"
                  ? "📉"
                  : "📊";
            return `${item.title.substring(0, 50)}... ${sentimentEmoji}`;
          })
          .join("; ");
        context += newsSummary + ". ";
      } else {
        context += "Loading news data. ";
      }

      if (socialSentiment?.length > 0) {
        const avgSentiment =
          socialSentiment.reduce((acc, item) => acc + item.sentiment, 0) /
          socialSentiment.length;
        const sentimentLabel =
          avgSentiment > 0.1
            ? "bullish"
            : avgSentiment < -0.1
              ? "bearish"
              : "neutral";
        const sentimentEmoji =
          avgSentiment > 0.1 ? "🟢" : avgSentiment < -0.1 ? "🔴" : "🟡";
        context += `Social sentiment: ${sentimentLabel} ${sentimentEmoji}. `;
      }

      // Get Bitcoin price context from state if available
      const btcPrice = state?.values?.bitcoinPrice;
      const btcDirection = state?.values?.bitcoinPriceDirection;
      if (btcPrice && newsItems?.length > 0) {
        context += `Bitcoin at $${btcPrice.toLocaleString()} (${btcDirection}) amid current news cycle. `;
      }

      return {
        text: context,
        values: {
          newsCount: newsItems?.length || 0,
          positiveSentimentCount:
            newsItems?.filter((n) => n.sentiment === "positive").length || 0,
          negativeSentimentCount:
            newsItems?.filter((n) => n.sentiment === "negative").length || 0,
          neutralSentimentCount:
            newsItems?.filter((n) => n.sentiment === "neutral").length || 0,

          // Social sentiment metrics
          socialSentimentCount: socialSentiment?.length || 0,
          averageSocialSentiment:
            socialSentiment?.length > 0
              ? socialSentiment.reduce((acc, item) => acc + item.sentiment, 0) /
                socialSentiment.length
              : 0,
          socialSentimentLabel:
            socialSentiment?.length > 0
              ? (() => {
                  const avg =
                    socialSentiment.reduce(
                      (acc, item) => acc + item.sentiment,
                      0,
                    ) / socialSentiment.length;
                  return avg > 0.1
                    ? "bullish"
                    : avg < -0.1
                      ? "bearish"
                      : "neutral";
                })()
              : "unknown",

          // Recent news summaries
          recentNews:
            newsItems?.slice(0, 5)?.map((item) => ({
              title: item.title,
              summary: item.summary,
              sentiment: item.sentiment,
              source: item.source,
              publishedAt: item.publishedAt,
              relevanceScore: item.relevanceScore,
              keywords: item.keywords,
            })) || [],

          // Social sentiment details
          socialSentimentByPlatform:
            socialSentiment?.map((item) => ({
              platform: item.platform,
              sentiment: item.sentiment,
              mentions: item.mentions,
              timestamp: item.timestamp,
              trendingKeywords: item.trendingKeywords,
            })) || [],

          // Timing
          lastNewsUpdate: newsItems?.[0]?.publishedAt || null,
          lastSocialUpdate: socialSentiment?.[0]?.timestamp || null,
          lastUpdated: new Date().toISOString(),
        },
        data: {
          newsItems: newsItems,
          socialSentiment: socialSentiment,
        },
      };
    } catch (error) {
      return {
        text: `News data temporarily unavailable: ${error.message}`,
        values: { newsError: true },
      };
    }
  },
};
