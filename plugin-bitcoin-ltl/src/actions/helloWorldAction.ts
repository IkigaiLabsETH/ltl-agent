import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
} from "@elizaos/core";

/**
 * Hello World Action
 * Simple greeting action for testing and demonstration purposes
 */
export const helloWorldAction: Action = {
  name: "HELLO_WORLD",
  similes: ["GREET", "SAY_HELLO", "WELCOME", "INTRODUCTION"],
  description: "A simple greeting action for testing and demonstration purposes",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("hello") ||
      text.includes("hi") ||
      text.includes("hey") ||
      text.includes("greetings") ||
      text.includes("welcome") ||
      text.includes("good morning") ||
      text.includes("good afternoon") ||
      text.includes("good evening")
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
      const responseContent: Content = {
        text: "Hello! I'm your Bitcoin-focused AI assistant. I can help you with Bitcoin market analysis, thesis tracking, investment strategies, and sovereign living advice. What would you like to know about Bitcoin today?",
        actions: ["HELLO_WORLD"],
        source: message.content.source || "hello-world",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      console.error("[HelloWorldAction] Error:", error);
      
      const errorContent: Content = {
        text: "Hello! I'm here to help with Bitcoin insights and analysis.",
        actions: ["HELLO_WORLD"],
        source: message.content.source || "hello-world",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "Hello!",
        },
      },
      {
        name: "Assistant",
        content: {
          text: "Hello! I'm your Bitcoin-focused AI assistant. I can help you with Bitcoin market analysis, thesis tracking, investment strategies, and sovereign living advice. What would you like to know about Bitcoin today?",
          actions: ["HELLO_WORLD"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Hi there!",
        },
      },
      {
        name: "Assistant",
        content: {
          text: "Hello! I'm your Bitcoin-focused AI assistant. I can help you with Bitcoin market analysis, thesis tracking, investment strategies, and sovereign living advice. What would you like to know about Bitcoin today?",
          actions: ["HELLO_WORLD"],
        },
      },
    ],
  ],
}; 