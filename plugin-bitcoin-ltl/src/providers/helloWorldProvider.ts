import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  ProviderResult,
} from "@elizaos/core";

/**
 * Hello World Provider
 * Simple provider for testing and project starter demonstration
 */
export const helloWorldProvider: Provider = {
  name: "HELLO_WORLD_PROVIDER",
  description:
    "Provides hello world content for testing and demonstration purposes",

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    return {
      text: "Hello world from provider!",
      values: {
        greeting: "Hello world!",
        timestamp: new Date().toISOString(),
        provider: "HELLO_WORLD_PROVIDER",
      },
      data: {
        source: "hello-world-provider",
        timestamp: new Date().toISOString(),
      },
    };
  },
};
