import {
  IAgentRuntime,
  Memory,
  Provider,
  State,
  ModelType,
} from "@elizaos/core";

export const knowledgeContextProvider: Provider = {
  name: "knowledge-context",
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      // Use the correct service name
      const digestService = runtime.getService("knowledge-digest");

      if (!digestService) {
        console.warn(
          "Knowledge digest service not available for context provider",
        );
        return { text: "" };
      }

      const messageText = message.content?.text;
      if (!messageText || messageText.length < 20) {
        return { text: "" };
      }

      // Extract key topics from the message
      const topics = extractTopics(messageText);
      if (topics.length === 0) {
        return { text: "" };
      }

      // Search for relevant knowledge using runtime's searchMemories method
      const contextResults = await Promise.all(
        topics.map(async (topic) => {
          try {
            // Generate embedding for the topic
            const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
              text: topic,
            });

            if (!embedding || embedding.length === 0) {
              console.warn("Failed to generate embedding for topic:", topic);
              return { topic, results: [] };
            }

            // Search memories
            const results = await runtime.searchMemories({
              tableName: "knowledge",
              embedding: embedding,
              query: topic,
              count: 2,
              match_threshold: 0.75,
              roomId: message.roomId,
            });

            return {
              topic,
              results: results || [],
            };
          } catch (error) {
            console.error(`Error searching for topic "${topic}":`, error);
            return { topic, results: [] };
          }
        }),
      );

      // Filter and format results
      const validResults = contextResults.filter(
        (ctx) => ctx.results.length > 0,
      );

      if (validResults.length === 0) {
        return { text: "" };
      }

      // Build context string
      let context = "## Relevant Knowledge Context\n\n";

      for (const ctx of validResults) {
        context += `### ${ctx.topic}\n`;

        for (const result of ctx.results.slice(0, 1)) {
          // Top result per topic
          const content = result.content?.text || "No content available";
          const snippet =
            content.length > 300 ? content.substring(0, 300) + "..." : content;
          const source = result.metadata?.source || "Knowledge Base";

          context += `- **Source:** ${source}\n`;
          context += `- **Relevance:** ${((result.similarity || 0) * 100).toFixed(1)}%\n`;
          context += `- **Info:** ${snippet}\n\n`;
        }
      }

      context += "---\n\n";

      return { text: context };
    } catch (error) {
      console.error("Knowledge context provider error:", error);
      return { text: "" };
    }
  },
};

function extractTopics(text: string): string[] {
  // Keywords that indicate important topics
  const topicKeywords = [
    // Bitcoin/Crypto
    "bitcoin",
    "btc",
    "cryptocurrency",
    "crypto",
    "microstrategy",
    "treasury",
    "mining",
    "lightning",
    "satoshi",
    "blockchain",
    "defi",
    "altcoin",

    // Investment/Finance
    "investment",
    "strategy",
    "portfolio",
    "stock",
    "equity",
    "etf",
    "analysis",
    "market",
    "trading",
    "financial",
    "wealth",
    "asset",

    // Luxury/Lifestyle
    "luxury",
    "lifestyle",
    "travel",
    "premium",
    "exclusive",
    "sovereign",
    "geographic arbitrage",
    "real estate",
    "yacht",
    "aviation",
    "wine",

    // Technology
    "ai",
    "artificial intelligence",
    "robotaxi",
    "technology",
    "innovation",
    "automation",
    "digital",
    "nft",
    "metaverse",

    // Specific Companies/Brands
    "tesla",
    "mara",
    "metaplanet",
    "vaneck",
    "msty",
    "innovation",
    "hyperliquid",
    "solana",
    "ethereum",
    "sui",
    "dogecoin",
  ];

  const lowerText = text.toLowerCase();
  const foundTopics = new Set<string>();

  // Find direct keyword matches
  for (const keyword of topicKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundTopics.add(keyword);
    }
  }

  // Extract multi-word concepts
  const concepts = [
    "bitcoin treasury strategy",
    "luxury lifestyle",
    "geographic arbitrage",
    "investment strategy",
    "market analysis",
    "bitcoin mining",
    "cryptocurrency investment",
    "luxury travel",
    "sovereign living",
    "wealth building",
    "premium experiences",
    "blockchain technology",
    "artificial intelligence",
    "real estate investment",
  ];

  for (const concept of concepts) {
    if (lowerText.includes(concept.toLowerCase())) {
      foundTopics.add(concept);
    }
  }

  return Array.from(foundTopics).slice(0, 3); // Limit to top 3 topics
}
