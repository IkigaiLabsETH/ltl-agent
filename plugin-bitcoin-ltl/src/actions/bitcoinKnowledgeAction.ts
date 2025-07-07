import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { KnowledgeBaseService } from "../services/KnowledgeBaseService";
import { getRandomSatoshiEnding } from '../utils/btc-performance.utils';

/**
 * Bitcoin Knowledge Integration Action
 * Demonstrates how static Bitcoin knowledge integrates with real-time market intelligence
 */
export const bitcoinKnowledgeAction: Action = {
  name: "BITCOIN_KNOWLEDGE_INTEGRATION",
  similes: ["KNOWLEDGE_INTEGRATION", "BITCOIN_WISDOM", "SATOSHI_KNOWLEDGE"],
  description: "Integrates Bitcoin knowledge base with real-time market intelligence for comprehensive insights",

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("knowledge") ||
      text.includes("thesis") ||
      text.includes("philosophy") ||
      text.includes("wisdom") ||
      text.includes("satoshi") ||
      text.includes("bitcoin theory") ||
      text.includes("market cycle") ||
      text.includes("halving")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    try {
      // Get services
      const bitcoinService = runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
      const knowledgeService = runtime.getService<KnowledgeBaseService>("knowledge-base");

      if (!bitcoinService || !knowledgeService) {
        await callback({
          text: "Bitcoin intelligence or knowledge services not available.",
          thought: "Services unavailable for knowledge integration",
          actions: ["BITCOIN_KNOWLEDGE_INTEGRATION"]
        });
        return false;
      }

      // Get real-time Bitcoin data
      const bitcoinData = await bitcoinService.getComprehensiveIntelligence();
      
      // Get knowledge base insights
      const topics = knowledgeService.getAllTopics();
      const bitcoinTopics = topics.filter(topic => 
        topic.includes("bitcoin") || 
        topic.includes("satoshi") || 
        topic.includes("market-cycle") ||
        topic.includes("thesis")
      );

      // Get key knowledge summaries
      const thesisSummary = knowledgeService.summarize("bitcoin-thesis") || "Bitcoin thesis not available";
      const cycleSummary = knowledgeService.summarize("bitcoin-market-cycles-analysis") || "Market cycles not available";
      const satoshiSummary = knowledgeService.summarize("satoshi-nakamoto") || "Satoshi philosophy not available";

      // Search for relevant content based on current market conditions
      let relevantKnowledge = "";
      if (bitcoinData.network.price > 100000) {
        const searchResults = knowledgeService.search("bull market");
        relevantKnowledge = searchResults.length > 0 ? searchResults[0].snippet : "";
      } else if (bitcoinData.network.price < 50000) {
        const searchResults = knowledgeService.search("bear market");
        relevantKnowledge = searchResults.length > 0 ? searchResults[0].snippet : "";
      } else {
        const searchResults = knowledgeService.search("accumulation");
        relevantKnowledge = searchResults.length > 0 ? searchResults[0].snippet : "";
      }

      // Create integrated response
      const response = {
        text: `🟠 **Bitcoin Knowledge Integration** 🟠\n\n**Real-Time Market Status:**\n💰 Price: $${bitcoinData.network.price.toLocaleString()}\n📊 Market Cap: $${(bitcoinData.network.marketCap / 1e9).toFixed(2)}B\n🎯 Dominance: ${bitcoinData.network.dominance.toFixed(2)}%\n\n**Bitcoin Thesis Context:**\n${thesisSummary}\n\n**Market Cycle Intelligence:**\n${cycleSummary}\n\n**Satoshi Philosophy:**\n${satoshiSummary}\n\n**Knowledge Base:**\n📚 ${bitcoinTopics.length} Bitcoin-related topics available\n🔍 ${topics.length} total knowledge files indexed\n\n**Relevant Market Context:**\n${relevantKnowledge ? relevantKnowledge : "Current market conditions align with Bitcoin's long-term thesis."}\n\n*"${getRandomSatoshiEnding()}"*`,
        thought: `Integrated Bitcoin knowledge base (${bitcoinTopics.length} topics) with real-time market data. Provided context from thesis, cycles, and Satoshi philosophy.`,
        actions: ["BITCOIN_KNOWLEDGE_INTEGRATION"]
      };

      await callback(response);
      return true;

    } catch (error) {
      console.error("Bitcoin Knowledge Integration error:", error);
      await callback({
        text: "Error integrating Bitcoin knowledge with market intelligence.",
        thought: "Knowledge integration failed",
        actions: ["BITCOIN_KNOWLEDGE_INTEGRATION"]
      });
      return false;
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: { text: "What does the Bitcoin thesis say about current market conditions?" }
      },
      {
        name: "{{name2}}",
        content: {
          text: "🟠 **Bitcoin Knowledge Integration** 🟠\n\n**Real-Time Market Status:**\n💰 Price: $107,940\n📊 Market Cap: $2,165.83B\n🎯 Dominance: 63.89%\n\n**Bitcoin Thesis Context:**\nBitcoin represents sound money in a digital age - 21 million fixed supply, predictable issuance, and decentralized verification...\n\n**Market Cycle Intelligence:**\nCurrent phase shows strong momentum with institutional adoption accelerating...\n\n**Satoshi Philosophy:**\nBitcoin is the exit strategy from fiat currency. Everything else is noise...\n\n*\"The protocol is permanent.\"* 🟠",
          actions: ["BITCOIN_KNOWLEDGE_INTEGRATION"]
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: { text: "How does Satoshi's philosophy apply to today's market?" }
      },
      {
        name: "{{name2}}",
        content: {
          text: "🟠 **Bitcoin Knowledge Integration** 🟠\n\n**Satoshi Philosophy Applied:**\nSatoshi's vision of sound money becomes more relevant as fiat currencies face inflationary pressures...\n\n**Current Market Context:**\nWith Bitcoin at $107,940 and institutional adoption accelerating, we're seeing Satoshi's thesis validated...\n\n**Knowledge Integration:**\nThe Bitcoin thesis, market cycles, and Satoshi philosophy all point to continued adoption...\n\n*\"Sovereignty is non-negotiable.\"* 🟠",
          actions: ["BITCOIN_KNOWLEDGE_INTEGRATION"]
        }
      }
    ]
  ]
}; 