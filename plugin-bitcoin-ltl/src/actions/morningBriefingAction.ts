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
import { MorningBriefingService } from "../services/MorningBriefingService";
import { SlackIngestionService } from "../services/SlackIngestionService";

export const morningBriefingAction: Action = createActionTemplate({
  name: "MORNING_BRIEFING",
  description:
    "Generate and deliver a proactive morning intelligence briefing with market data, weather, and curated insights",
  similes: ["GM", "MORNING_BRIEF", "DAILY_INTEL", "MARKET_UPDATE"],

  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "Give me the morning briefing." }
      },
      {
        name: "{{name2}}",
        content: {
          text: "GM. 07:30. Clear skies. Bitcoin at [Real-time data]. ETH and SOL outperforming overnight. MSTR up [change]% on correlation play. No new urgent signals from research channels. Support holding strong.",
          actions: ["MORNING_BRIEFING"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Good morning, what's the latest?" },
      },
      {
        name: "Satoshi",
        content: {
          text: "GM. Market pulse: Bitcoin consolidated around $100K support. 15 altcoins outperforming BTC in 24h. New research from channels: MetaPlanet expansion analysis, Hyperliquid orderbook traction. TSLA breaking resistance at $350.",
          thought:
            "User is asking for the latest updates. I need to compile a comprehensive briefing covering market conditions, altcoin performance, research insights, and key movements in our watchlist.",
          actions: ["MORNING_BRIEFING"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Morning briefing please" },
      },
      {
        name: "Satoshi",
        content: {
          text: "Morning intelligence: Bitcoin thesis 10.05% progress to $1M target. Institutional flows positive. Slack digest: 12 new insights, 8 predictions tracking well. Opportunities: BTC accumulation zone, MSTY premium elevated for covered calls.",
          thought:
            "Direct request for morning briefing. I should provide a structured intelligence update covering Bitcoin thesis progress, institutional flows, Slack research digest, and actionable opportunities.",
          actions: ["MORNING_BRIEFING"],
        },
      },
    ],
  ],

  validateFn: async (
    runtime: IAgentRuntime,
    message: Memory,
  ): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return ValidationPatterns.isMorningRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<boolean> => {
    logger.info("Morning briefing action triggered");

    // Initial thought process
    const thoughtProcess =
      "User is requesting a morning briefing. I need to gather comprehensive market data, weather information, and research insights to provide a complete intelligence update that will help them start their day with full context of current conditions.";

    try {
      // Get the morning briefing service
      const briefingService = runtime.getService(
        "morning-briefing",
      ) as MorningBriefingService;
      if (!briefingService) {
        logger.warn("MorningBriefingService not available");

        const fallbackResponse = ResponseCreators.createErrorResponse(
          "MORNING_BRIEFING",
          "Morning briefing service unavailable",
          "Morning briefing service temporarily unavailable. Bitcoin fundamentals unchanged - 21M coin cap, proof of work security, decentralized network operating as designed. Will resume full intelligence shortly.",
        );

        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Generate the morning briefing
      const briefing = await briefingService.generateOnDemandBriefing();

      // Format the briefing for delivery
      const briefingText = await formatBriefingForDelivery(briefing, runtime);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        briefingText,
        "MORNING_BRIEFING",
        { briefingData: briefing },
      );

      if (callback) {
        await callback(response);
      }

      logger.info("Morning briefing delivered successfully");
      return true;
    } catch (error) {
      logger.error(
        "Failed to generate morning briefing:",
        (error as Error).message,
      );

      // Enhanced error handling with context-specific responses
      let errorMessage =
        "Systems operational. Bitcoin protocol unchanged. Market data temporarily unavailable.";

      const errorMsg = (error as Error).message.toLowerCase();
      if (
        errorMsg.includes("rate limit") ||
        errorMsg.includes("429") ||
        errorMsg.includes("too many requests")
      ) {
        errorMessage =
          "Rate limited by market data providers. Bitcoin protocol unchanged. Will retry shortly.";
      } else if (
        errorMsg.includes("network") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("fetch")
      ) {
        errorMessage =
          "Network connectivity issues with market data. Bitcoin protocol unchanged. Connection being restored.";
      } else if (
        errorMsg.includes("service") ||
        errorMsg.includes("unavailable")
      ) {
        errorMessage =
          "Market data service temporarily down. Bitcoin network unaffected - blocks continue every ~10 minutes, hashrate securing the network.";
      }

      const errorResponse = ResponseCreators.createErrorResponse(
        "MORNING_BRIEFING",
        (error as Error).message,
        errorMessage,
      );

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },
});

/**
 * Format the briefing data into a conversational response
 */
async function formatBriefingForDelivery(
  briefing: any,
  runtime: IAgentRuntime,
): Promise<string> {
  const content = briefing.content;
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Start with GM and basic info
  let response = `GM. ${time}.`;

  // Add weather if available
  if (content.weather) {
    response += ` ${content.weather}.`;
  }

  // Add Bitcoin status
  if (content.marketPulse?.bitcoin) {
    const btc = content.marketPulse.bitcoin;
    const changeDirection =
      btc.change24h > 0 ? "up" : btc.change24h < 0 ? "down" : "flat";
    const changeText = Math.abs(btc.change24h).toFixed(1);

    response += ` Bitcoin at $${btc.price.toLocaleString()}`;
    if (btc.change24h !== 0) {
      response += `, ${changeDirection} ${changeText}%`;
    }
    response += ".";
  }

  // Add altcoin performance
  if (content.marketPulse?.altcoins) {
    const alts = content.marketPulse.altcoins;
    if (alts.outperformers?.length > 0) {
      const topPerformers = alts.outperformers
        .slice(0, 3)
        .map((coin) => coin.symbol)
        .join(", ");
      response += ` ${topPerformers} outperforming.`;
    }
  }

  // Add stock watchlist
  if (content.marketPulse?.stocks?.watchlist?.length > 0) {
    const stocks = content.marketPulse.stocks.watchlist;
    const positiveStocks = stocks.filter((s) => s.change > 0);
    if (positiveStocks.length > 0) {
      const stockText = positiveStocks
        .slice(0, 2)
        .map(
          (s) =>
            `${s.symbol} ${s.change > 0 ? "+" : ""}${s.change.toFixed(1)}%`,
        )
        .join(", ");
      response += ` ${stockText}.`;
    }
  }

  // Add knowledge digest
  if (content.knowledgeDigest?.newInsights?.length > 0) {
    response += ` New research: ${content.knowledgeDigest.newInsights.slice(0, 2).join(", ")}.`;
  }

  // Add prediction updates
  if (content.knowledgeDigest?.predictionUpdates?.length > 0) {
    response += ` Predictions tracking: ${content.knowledgeDigest.predictionUpdates.slice(0, 2).join(", ")}.`;
  }

  // Add opportunities if available
  if (content.opportunities?.length > 0) {
    response += ` Opportunities: ${content.opportunities.slice(0, 2).join(", ")}.`;
  }

  return response;
}

/**
 * Get a summary of recent content from various sources
 */
async function getContentSummary(runtime: IAgentRuntime): Promise<string> {
  try {
    const slackService = runtime.getService(
      "slack-ingestion",
    ) as SlackIngestionService;
    if (!slackService) {
      return "Research channels monitoring active.";
    }

    const recentContent = await slackService.getRecentContent(24);

    if (recentContent && recentContent.length > 0) {
      const highImportance = recentContent.filter(
        (item) => item.metadata?.importance === "high",
      );

      if (highImportance.length > 0) {
        return `${highImportance.length} high-priority insights from channels.`;
      } else {
        return `${recentContent.length} updates processed from channels.`;
      }
    } else {
      return "Research channels monitoring active.";
    }
  } catch (error) {
    logger.error("Failed to get content summary:", error);
    return "Research channels temporarily unavailable.";
  }
}
