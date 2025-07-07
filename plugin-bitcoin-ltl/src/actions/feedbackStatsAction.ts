import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";

/**
 * Feedback Stats Action
 * Demonstrates feedback provider functionality by showing feedback statistics
 */
export const feedbackStatsAction: Action = {
  name: "FEEDBACK_STATS",
  similes: ["SHOW_FEEDBACK", "FEEDBACK_ANALYSIS", "USER_FEEDBACK_STATS"],
  description: "Shows feedback statistics and insights for continuous improvement",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("feedback") ||
      text.includes("stats") ||
      text.includes("rating") ||
      text.includes("review") ||
      text.includes("user") ||
      text.includes("analysis")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback: any
  ) => {
    try {
      // Get feedback stats from provider
      const feedbackStats = state?.values?.feedbackStats;

      if (!feedbackStats) {
        await callback({
          thought: "No feedback data available in state. This might be because the feedback provider isn't included in the state composition.",
          text: "I don't have access to feedback statistics at the moment. The feedback provider needs to be included in the state composition to show this data.",
          actions: ["FEEDBACK_STATS"],
        });
        return true;
      }

      // Format the feedback statistics
      let responseText = "📊 **Feedback Statistics Report**\n\n";

      // Overall stats
      responseText += `**Overall Performance:**\n`;
      responseText += `• Total Feedback: ${feedbackStats.totalCount}\n`;
      responseText += `• Average Rating: ${feedbackStats.averageRating}/5 ⭐\n\n`;

      // Rating distribution
      if (feedbackStats.ratingDistribution && Object.keys(feedbackStats.ratingDistribution).length > 0) {
        responseText += `**Rating Distribution:**\n`;
        for (let i = 5; i >= 1; i--) {
          const count = feedbackStats.ratingDistribution[i] || 0;
          const percentage = feedbackStats.totalCount > 0 ? Math.round((count / feedbackStats.totalCount) * 100) : 0;
          const stars = "⭐".repeat(i);
          responseText += `• ${stars} (${i}/5): ${count} responses (${percentage}%)\n`;
        }
        responseText += "\n";
      }

      // Most recent feedback
      if (feedbackStats.mostRecent) {
        const recent = feedbackStats.mostRecent;
        const date = new Date(recent.timestamp).toLocaleDateString();
        responseText += `**Most Recent Feedback:**\n`;
        responseText += `• Date: ${date}\n`;
        responseText += `• Action: ${recent.actionName}\n`;
        responseText += `• Rating: ${"⭐".repeat(recent.rating)} (${recent.rating}/5)\n`;
        if (recent.comment) {
          responseText += `• Comment: "${recent.comment}"\n`;
        }
        responseText += "\n";
      }

      // Top actions
      if (feedbackStats.topActions && feedbackStats.topActions.length > 0) {
        responseText += `**Top Actions by Feedback Volume:**\n`;
        feedbackStats.topActions.forEach((action, index) => {
          responseText += `${index + 1}. **${action.actionName}**: ${action.count} reviews, ${action.avgRating.toFixed(1)}/5 avg\n`;
        });
        responseText += "\n";
      }

      // Common comments
      if (feedbackStats.commonComments && feedbackStats.commonComments.length > 0) {
        responseText += `**Most Common Comments:**\n`;
        feedbackStats.commonComments.forEach((comment, index) => {
          responseText += `${index + 1}. "${comment}"\n`;
        });
        responseText += "\n";
      }

      // Low rating flags
      if (feedbackStats.lowRatingFlags && feedbackStats.lowRatingFlags.length > 0) {
        responseText += `🚨 **Low Rating Alerts (${feedbackStats.lowRatingFlags.length} recent):**\n`;
        feedbackStats.lowRatingFlags.slice(0, 3).forEach((flag, index) => {
          const date = new Date(flag.timestamp).toLocaleDateString();
          responseText += `${index + 1}. ${flag.actionName} (${date}) - ${"⭐".repeat(flag.rating)}`;
          if (flag.comment) {
            responseText += ` - "${flag.comment}"`;
          }
          responseText += "\n";
        });
        if (feedbackStats.lowRatingFlags.length > 3) {
          responseText += `... and ${feedbackStats.lowRatingFlags.length - 3} more\n`;
        }
        responseText += "\n";
      }

      // Summary and recommendations
      responseText += `**Summary:**\n`;
      if (feedbackStats.averageRating >= 4.0) {
        responseText += `✅ Excellent performance! Users are highly satisfied.\n`;
      } else if (feedbackStats.averageRating >= 3.0) {
        responseText += `⚠️ Good performance with room for improvement.\n`;
      } else {
        responseText += `❌ Performance needs attention. Review low ratings.\n`;
      }

      if (feedbackStats.lowRatingFlags && feedbackStats.lowRatingFlags.length > 0) {
        responseText += `🔍 **Recommendation:** Review the flagged low ratings to identify improvement opportunities.\n`;
      }

      await callback({
        thought: "Successfully retrieved and formatted feedback statistics. The data shows user satisfaction levels and areas for improvement.",
        text: responseText,
        actions: ["FEEDBACK_STATS"],
      });

      return true;

    } catch (error) {
      console.error("Error in feedback stats action:", error);
      
      await callback({
        thought: "Encountered an error while processing feedback statistics.",
        text: "Sorry, I encountered an error while retrieving feedback statistics. Please try again later.",
        actions: ["FEEDBACK_STATS"],
      });

      return false;
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "Show me the feedback statistics" },
      },
      {
        name: "{{name2}}",
        content: {
          text: "📊 **Feedback Statistics Report**\n\n**Overall Performance:**\n• Total Feedback: 15\n• Average Rating: 4.2/5 ⭐\n\n**Rating Distribution:**\n• ⭐⭐⭐⭐⭐ (5/5): 8 responses (53%)\n• ⭐⭐⭐⭐ (4/5): 5 responses (33%)\n• ⭐⭐⭐ (3/5): 2 responses (13%)\n• ⭐⭐ (2/5): 0 responses (0%)\n• ⭐ (1/5): 0 responses (0%)\n\n**Summary:**\n✅ Excellent performance! Users are highly satisfied.",
          actions: ["FEEDBACK_STATS"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "What's the user feedback like?" },
      },
      {
        name: "{{name2}}",
        content: {
          text: "📊 **Feedback Statistics Report**\n\n**Overall Performance:**\n• Total Feedback: 23\n• Average Rating: 3.8/5 ⭐\n\n**Top Actions by Feedback Volume:**\n1. **BITCOIN_ANALYSIS**: 8 reviews, 4.1/5 avg\n2. **MARKET_BRIEFING**: 6 reviews, 3.9/5 avg\n3. **OPPORTUNITY_ALERT**: 5 reviews, 3.5/5 avg\n\n**Most Common Comments:**\n1. \"Very helpful insights\"\n2. \"Could be more detailed\"\n3. \"Great market analysis\"\n\n**Summary:**\n⚠️ Good performance with room for improvement.",
          actions: ["FEEDBACK_STATS"],
        },
      },
    ],
  ],
}; 