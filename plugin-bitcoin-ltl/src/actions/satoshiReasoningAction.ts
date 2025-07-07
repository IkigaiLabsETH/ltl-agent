import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { KnowledgeBaseService } from "../services/KnowledgeBaseService";
import { getRandomSatoshiEnding } from '../utils/btc-performance.utils';

/**
 * Satoshi Reasoning Action (Enhanced)
 * Synthesizes real-time data, knowledge base, and Satoshi philosophy for nuanced, context-aware reasoning
 */
export const satoshiReasoningAction: Action = {
  name: "SATOSHI_REASONING",
  similes: ["BITCOIN_REASONING", "PHILOSOPHY_REASONING", "SATOSHI_RESPONSE"],
  description: "Synthesizes real-time data, knowledge base, and Satoshi philosophy for actionable, philosophy-aligned reasoning.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("satoshi") || text.includes("reason") || text.includes("bitcoin");
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      // 1. Echo user query
      const userQuery = message.content?.text || "(no question provided)";

      // 2. Get real-time Bitcoin data
      const bitcoinService = runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
      const knowledgeService = runtime.getService<KnowledgeBaseService>("knowledge-base");
      const philosophy = state?.values?.philosophy;

      let bitcoinData = undefined;
      if (bitcoinService) {
        bitcoinData = await bitcoinService.getComprehensiveIntelligence();
      }

      // 3. Deeper knowledge base synthesis: match top 2-3 topics to user query
      let knowledgeSummaries: string[] = [];
      if (knowledgeService) {
        const topics = knowledgeService.getAllTopics();
        // Simple keyword match: rank topics by query keyword presence
        const query = userQuery.toLowerCase();
        const ranked = topics
          .map(topic => ({
            topic,
            score: topic.toLowerCase().split("-").filter(word => query.includes(word)).length
          }))
          .sort((a, b) => b.score - a.score);
        // Pick top 2-3 relevant topics (with fallback)
        const selected = ranked.filter(r => r.score > 0).slice(0, 3).map(r => r.topic);
        if (selected.length === 0 && topics.length > 0) selected.push(topics[0]);
        knowledgeSummaries = selected.map(topic => {
          const summary = knowledgeService.summarize(topic);
          return summary ? `• **${topic.replace(/-/g, ' ')}**: ${summary}` : '';
        }).filter(Boolean);
      }

      // 4. Nuanced actionable insights based on multiple market conditions
      let actionable = "Stay focused on first principles.";
      if (bitcoinData) {
        const { price, dominance, marketCap } = bitcoinData.network;
        // Example: nuanced advice
        if (price > 100000 && dominance > 60) {
          actionable = "Consider risk management. High price and dominance may signal exuberance.";
        } else if (price < 50000 && dominance < 50) {
          actionable = "Potential accumulation zone. Monitor for altcoin rotation.";
        } else if (marketCap > 2e12) {
          actionable = "Bitcoin is in a strong market phase. Reassess long-term strategy.";
        } else if (dominance < 40) {
          actionable = "Altcoin season risk. Stay vigilant and review portfolio allocations.";
        } else {
          actionable = "Stack accordingly. Focus on fundamentals.";
        }
      }

      // 5. Pick a random Satoshi quote or principle
      let satoshiQuote = "Truth is verified, not argued.";
      if (philosophy?.satoshiQuotes && philosophy.satoshiQuotes.length > 0) {
        satoshiQuote = philosophy.satoshiQuotes[Math.floor(Math.random() * philosophy.satoshiQuotes.length)];
      } else if (philosophy?.corePrinciples && philosophy.corePrinciples.length > 0) {
        satoshiQuote = philosophy.corePrinciples[0];
      }

      // 6. Compose the response
      const responseText = `🟠 **Satoshi Reasoning** 🟠\n\n**Your Question:**\n${userQuery}\n\n**Philosophy:**\n${satoshiQuote}\n\n**Knowledge Synthesis:**\n${knowledgeSummaries.length > 0 ? knowledgeSummaries.join("\n") : "(no relevant knowledge found)"}\n\n**Market Data:**\n${bitcoinData ? `Price: $${bitcoinData.network.price.toLocaleString()} | Market Cap: $${(bitcoinData.network.marketCap/1e9).toFixed(2)}B | Dominance: ${bitcoinData.network.dominance.toFixed(2)}%` : "(data unavailable)"}\n\n**Actionable Insight:**\n${actionable}\n\n*${getRandomSatoshiEnding()}*`;

      const content: Content = {
        text: responseText,
        actions: ["SATOSHI_REASONING"],
        source: "satoshi-reasoning-action",
      };

      await callback(content);
      return content;
    } catch (error) {
      const errorContent: Content = {
        text: "❌ Satoshi Reasoning failed. Please try again.",
        actions: ["SATOSHI_REASONING"],
        source: "satoshi-reasoning-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
}; 