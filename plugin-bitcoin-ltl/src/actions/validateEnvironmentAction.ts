import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";
import { validateElizaOSEnvironment } from "../utils/environmentUtils";

/**
 * Environment Validation Action
 * Validates the ElizaOS environment configuration and API keys
 */
export const validateEnvironmentAction: Action = {
  name: "VALIDATE_ENVIRONMENT",
  similes: ["ENV_CHECK", "ENVIRONMENT_STATUS", "CONFIG_CHECK", "API_KEYS"],
  description: "Validates the ElizaOS environment configuration and API keys",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("environment") ||
      text.includes("config") ||
      text.includes("api") ||
      text.includes("keys") ||
      (text.includes("check") && (text.includes("env") || text.includes("setup")))
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
      const validation = validateElizaOSEnvironment();

      // Check API keys using runtime.getSetting()
      const apiKeyChecks = [
        {
          name: "OPENAI_API_KEY",
          value: runtime.getSetting("OPENAI_API_KEY"),
          required: false,
        },
        {
          name: "ANTHROPIC_API_KEY",
          value: runtime.getSetting("ANTHROPIC_API_KEY"),
          required: false,
        },
        {
          name: "COINGECKO_API_KEY",
          value: runtime.getSetting("COINGECKO_API_KEY"),
          required: false,
        },
        {
          name: "THIRDWEB_SECRET_KEY",
          value: runtime.getSetting("THIRDWEB_SECRET_KEY"),
          required: false,
        },
        {
          name: "LUMA_API_KEY",
          value: runtime.getSetting("LUMA_API_KEY"),
          required: false,
        },
      ];

      const hasLLMKey = apiKeyChecks.some(
        (check) =>
          (check.name === "OPENAI_API_KEY" ||
            check.name === "ANTHROPIC_API_KEY") &&
          check.value,
      );

      if (!hasLLMKey) {
        validation.issues.push(
          "No LLM API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY",
        );
      }

      const statusEmoji = validation.valid && hasLLMKey ? "✅" : "⚠️";
      const responseText = `${statusEmoji} **ENVIRONMENT VALIDATION**

**Overall Status:** ${validation.valid && hasLLMKey ? "Valid Configuration" : "Issues Detected"}

**API Keys Status:**
${apiKeyChecks
  .map(
    (check) =>
      `• ${check.name}: ${check.value ? "✅ Configured" : "❌ Missing"}`,
  )
  .join("\n")}

${
  validation.issues.length > 0
    ? `**Configuration Issues:**\n${validation.issues.map((issue) => `• ${issue}`).join("\n")}

**Quick Fix:**
Use \`elizaos env edit-local\` to configure missing API keys.`
    : "**No issues detected** - Environment is properly configured."
}

*Validation completed: ${new Date().toISOString()}*`;

      const responseContent: Content = {
        text: responseText,
        actions: ["VALIDATE_ENVIRONMENT"],
        source: message.content.source || "environment-validation",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in environment validation:", error);

      const errorContent: Content = {
        text: "Unable to validate environment configuration at this time. Please check your setup manually.",
        actions: ["VALIDATE_ENVIRONMENT"],
        source: message.content.source || "environment-validation",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "user",
        content: { text: "Check environment configuration" },
      },
      {
        name: "agent",
        content: {
          text: "✅ **ENVIRONMENT VALIDATION**\n\n**Overall Status:** Valid Configuration\n\n**API Keys Status:**\n• OPENAI_API_KEY: ✅ Configured\n• ANTHROPIC_API_KEY: ❌ Missing\n\n**No issues detected** - Environment is properly configured.",
          actions: ["VALIDATE_ENVIRONMENT"],
        },
      },
    ],
    [
      {
        name: "user",
        content: { text: "Validate my API keys" },
      },
      {
        name: "agent",
        content: {
          text: "✅ **ENVIRONMENT VALIDATION**\n\n**Overall Status:** Valid Configuration\n\n**API Keys Status:**\n• OPENAI_API_KEY: ✅ Configured\n• COINGECKO_API_KEY: ✅ Configured\n\n**No issues detected** - Environment is properly configured.",
          actions: ["VALIDATE_ENVIRONMENT"],
        },
      },
    ],
  ],
}; 