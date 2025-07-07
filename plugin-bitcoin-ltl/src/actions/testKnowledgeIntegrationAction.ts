import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from "@elizaos/core";
import { KnowledgeBaseService } from "../services/KnowledgeBaseService";

/**
 * Test Knowledge Integration Action
 * Verifies that Phase 3 knowledge base integration is working correctly
 */
export const testKnowledgeIntegrationAction: Action = {
  name: "TEST_KNOWLEDGE_INTEGRATION",
  similes: ["TEST_KNOWLEDGE", "VERIFY_KNOWLEDGE", "KNOWLEDGE_TEST"],
  description: "Tests the knowledge base integration to verify Phase 3 implementation",

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("test knowledge") || text.includes("verify knowledge") || text.includes("knowledge test");
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
      const knowledgeService = runtime.getService<KnowledgeBaseService>("knowledge-base");
      
      if (!knowledgeService) {
        const errorContent: Content = {
          text: "❌ **Knowledge Integration Test Failed**\n\nKnowledgeBaseService not found.",
          actions: ["TEST_KNOWLEDGE_INTEGRATION"],
          source: "knowledge-integration-test",
        };
        await callback(errorContent);
        return errorContent;
      }

      // Test 1: Check if knowledge base is loaded
      const topics = knowledgeService.getAllTopics();
      const bitcoinTopics = topics.filter(topic => topic.toLowerCase().includes("bitcoin"));

      // Test 2: Try to get a specific topic
      const thesisFile = knowledgeService.getFileByTopic("bitcoin-thesis");
      const cycleFile = knowledgeService.getFileByTopic("market-cycles");
      const satoshiFile = knowledgeService.getFileByTopic("satoshi-philosophy");

      // Test 3: Test search functionality
      const searchResults = knowledgeService.search("bitcoin");
      const thesisSearch = knowledgeService.search("thesis");

      // Test 4: Test summarization
      const thesisSummary = thesisFile ? knowledgeService.summarize("bitcoin-thesis") : "Not available";
      const cycleSummary = cycleFile ? knowledgeService.summarize("market-cycles") : "Not available";

      const responseContent: Content = {
        text: `🟠 **Phase 3 Knowledge Integration Test** 🟠

**✅ Service Status:**
📚 Knowledge Base Service: ${knowledgeService ? "✅ Loaded" : "❌ Not Found"}

**📊 Knowledge Base Statistics:**
📁 Total Topics: ${topics.length}
₿ Bitcoin Topics: ${bitcoinTopics.length}

**🔍 Content Tests:**
📄 Bitcoin Thesis: ${thesisFile ? "✅ Available" : "❌ Not Found"}
📈 Market Cycles: ${cycleFile ? "✅ Available" : "❌ Not Found"}
🎭 Satoshi Philosophy: ${satoshiFile ? "✅ Available" : "❌ Not Found"}

**🔎 Search Functionality:**
🔍 "bitcoin" search results: ${searchResults.length} matches
📋 "thesis" search results: ${thesisSearch.length} matches

**📝 Summarization Tests:**
📄 Thesis Summary: ${thesisSummary ? thesisSummary.substring(0, 100) + "..." : "Not available"}
📈 Cycle Summary: ${cycleSummary ? cycleSummary.substring(0, 100) + "..." : "Not available"}

**🎯 Phase 3 Status:**
${knowledgeService && topics.length > 0 && bitcoinTopics.length > 0 
  ? "✅ **KNOWLEDGE INTEGRATION SUCCESSFUL**" 
  : "❌ **KNOWLEDGE INTEGRATION FAILED**"}

*"Knowledge is power. Bitcoin is freedom."* 🟠`,
        actions: ["TEST_KNOWLEDGE_INTEGRATION"],
        source: "knowledge-integration-test",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      console.error("[TestKnowledgeIntegrationAction] Error:", error);
      
      const errorContent: Content = {
        text: "❌ **Knowledge Integration Test Failed**\n\nAn error occurred while testing the knowledge base integration. Please check the service configuration and try again.",
        actions: ["TEST_KNOWLEDGE_INTEGRATION"],
        source: "knowledge-integration-test",
      };

      await callback(errorContent);
      return errorContent;
    }
  },
}; 