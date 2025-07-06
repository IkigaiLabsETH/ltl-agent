import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";
import { StarterService } from "../services/StarterService";
import { ElizaOSErrorHandler } from "../types/errorTypes";

/**
 * Memory Management Action - Reset Agent Memory
 */
export const resetMemoryAction: Action = {
  name: "RESET_AGENT_MEMORY",
  similes: ["RESET_MEMORY", "CLEAR_MEMORY", "MEMORY_RESET", "CLEAR_DATABASE"],
  description: "Resets the agent's memory following ElizaOS best practices",
  
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("reset") &&
      (text.includes("memory") || text.includes("database") || text.includes("clear"))
    );
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
      const bitcoinService = runtime.getService("bitcoin-data") as StarterService;
      if (!bitcoinService) {
        throw new Error("Bitcoin data service not available");
      }

      const result = await bitcoinService.resetMemory();

      const responseText = result.success
        ? `🔄 **MEMORY RESET COMPLETE**\n\n${result.message}\n\nThe agent will have a fresh start with no previous conversation history.`
        : `⚠️ **MEMORY RESET FAILED**\n\n${result.message}`;

      const responseContent: Content = {
        text: responseText,
        actions: ["RESET_AGENT_MEMORY"],
        source: message.content.source || "memory-reset",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(
        error as Error,
        "ResetMemoryAction",
      );

      const errorText = `❌ **MEMORY RESET ERROR**\n\nFailed to reset memory: ${enhancedError.message}${
        enhancedError instanceof Error && 'resolution' in enhancedError
          ? `\n\n**Resolution:** ${(enhancedError as any).resolution}`
          : ""
      }`;

      const responseContent: Content = {
        text: errorText,
        actions: ["RESET_AGENT_MEMORY"],
        source: message.content.source || "memory-reset",
      };

      await callback(responseContent);
      return responseContent;
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "Reset the agent memory" },
      },
      {
        name: "agent",
        content: {
          text: "🔄 **MEMORY RESET COMPLETE**\n\nMemory reset successful. Deleted database directory: .eliza/.elizadb. Restart the agent to create a fresh database.\n\nThe agent will have a fresh start with no previous conversation history.",
          actions: ["RESET_AGENT_MEMORY"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "Clear the database" },
      },
      {
        name: "agent",
        content: {
          text: "🔄 **MEMORY RESET COMPLETE**\n\nMemory has been cleared successfully. The agent now has a clean slate.",
          actions: ["RESET_AGENT_MEMORY"],
        },
      },
    ],
  ],
};

/**
 * Memory Health Check Action
 */
export const checkMemoryHealthAction: Action = {
  name: "CHECK_MEMORY_HEALTH",
  similes: ["MEMORY_HEALTH", "MEMORY_STATUS", "DATABASE_HEALTH", "HEALTH_CHECK"],
  description: "Checks the health and status of the agent's memory system",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("memory") &&
      (text.includes("health") ||
        text.includes("status") ||
        text.includes("check") ||
        text.includes("database"))
    );
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
      const bitcoinService = runtime.getService("bitcoin-data") as StarterService;
      if (!bitcoinService) {
        throw new Error("Bitcoin data service not available");
      }

      const healthCheck = await bitcoinService.checkMemoryHealth();

      const statusEmoji = healthCheck.healthy ? "✅" : "⚠️";
      const responseText = `${statusEmoji} **MEMORY HEALTH STATUS**

**Database Type:** ${healthCheck.stats.databaseType}
**Data Directory:** ${healthCheck.stats.dataDirectory || "Not specified"}
**Overall Health:** ${healthCheck.healthy ? "Healthy" : "Issues Detected"}

${healthCheck.issues.length > 0 ? `**Issues Found:**\n${healthCheck.issues.map((issue) => `• ${issue}`).join("\n")}` : "**No issues detected** - Memory system is operating normally."}

*Health check completed: ${new Date().toISOString()}*`;

      const responseContent: Content = {
        text: responseText,
        actions: ["CHECK_MEMORY_HEALTH"],
        source: message.content.source || "memory-health",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(
        error as Error,
        "MemoryHealthAction",
      );

      const errorText = `❌ **MEMORY HEALTH CHECK FAILED**\n\n${enhancedError.message}${
        enhancedError instanceof Error && 'resolution' in enhancedError
          ? `\n\n**Resolution:** ${(enhancedError as any).resolution}`
          : ""
      }`;

      const responseContent: Content = {
        text: errorText,
        actions: ["CHECK_MEMORY_HEALTH"],
        source: message.content.source || "memory-health",
      };

      await callback(responseContent);
      return responseContent;
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "Check memory health" },
      },
      {
        name: "agent",
        content: {
          text: "✅ **MEMORY HEALTH STATUS**\n\n**Database Type:** pglite\n**Data Directory:** .eliza/.elizadb\n**Overall Health:** Healthy\n\n**No issues detected** - Memory system is operating normally.",
          actions: ["CHECK_MEMORY_HEALTH"],
        },
      },
    ],
  ],
}; 