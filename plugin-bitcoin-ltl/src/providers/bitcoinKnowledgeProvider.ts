import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { KnowledgeBaseService } from "../services/KnowledgeBaseService";

/**
 * Bitcoin Knowledge Provider
 * Integrates static Bitcoin knowledge with real-time market intelligence
 * Provides context from Bitcoin thesis, market cycles, and philosophy
 */
export const bitcoinKnowledgeProvider: Provider = {
  name: "BITCOIN_KNOWLEDGE",
  description: "Provides Bitcoin knowledge context from global knowledge base",
  position: 5, // Run after market data providers

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      const knowledgeService = runtime.getService<KnowledgeBaseService>("knowledge-base");
      if (!knowledgeService) {
        return {
          text: "",
          values: { bitcoinKnowledge: "Knowledge service not available" }
        };
      }

      // Get key Bitcoin knowledge topics
      const topics = knowledgeService.getAllTopics();
      const bitcoinTopics = topics.filter(topic => 
        topic.includes("bitcoin") || 
        topic.includes("satoshi") || 
        topic.includes("market-cycle") ||
        topic.includes("thesis")
      );

      // Get current Bitcoin thesis
      const bitcoinThesis = knowledgeService.getFileByTopic("bitcoin-thesis");
      const marketCycles = knowledgeService.getFileByTopic("bitcoin-market-cycles-analysis");
      const satoshi = knowledgeService.getFileByTopic("satoshi-nakamoto");

      // Extract key insights
      const thesisSummary = bitcoinThesis ? knowledgeService.summarize("bitcoin-thesis") : "";
      const cycleSummary = marketCycles ? knowledgeService.summarize("bitcoin-market-cycles-analysis") : "";
      const satoshiSummary = satoshi ? knowledgeService.summarize("satoshi-nakamoto") : "";

      // Search for relevant content based on message
      const messageText = message.content.text.toLowerCase();
      let relevantSearch = "";
      
      if (messageText.includes("halving") || messageText.includes("cycle")) {
        const searchResults = knowledgeService.search("halving");
        relevantSearch = searchResults.length > 0 ? searchResults[0].snippet : "";
      } else if (messageText.includes("thesis") || messageText.includes("philosophy")) {
        const searchResults = knowledgeService.search("thesis");
        relevantSearch = searchResults.length > 0 ? searchResults[0].snippet : "";
      } else if (messageText.includes("price") || messageText.includes("market")) {
        const searchResults = knowledgeService.search("market cycle");
        relevantSearch = searchResults.length > 0 ? searchResults[0].snippet : "";
      }

      const knowledgeContext = {
        availableTopics: bitcoinTopics.slice(0, 10), // Top 10 topics
        bitcoinThesis: thesisSummary,
        marketCycles: cycleSummary,
        satoshiPhilosophy: satoshiSummary,
        relevantContent: relevantSearch,
        totalTopics: topics.length
      };

      return {
        text: `Bitcoin Knowledge Context: ${bitcoinTopics.length} Bitcoin-related topics available. Key insights from Bitcoin thesis, market cycles, and Satoshi philosophy integrated with current market intelligence.`,
        values: { 
          bitcoinKnowledge: knowledgeContext,
          knowledgeTopics: bitcoinTopics,
          thesisSummary,
          cycleSummary,
          satoshiSummary,
          relevantSearch
        },
        data: {
          fullKnowledgeContext: knowledgeContext
        }
      };

    } catch (error) {
      console.error("Bitcoin Knowledge Provider error:", error);
      return {
        text: "Bitcoin knowledge context unavailable",
        values: { bitcoinKnowledge: "Error loading knowledge" }
      };
    }
  }
}; 