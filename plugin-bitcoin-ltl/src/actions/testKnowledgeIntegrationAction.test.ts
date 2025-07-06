import { describe, it, expect, beforeEach, vi } from "vitest";
import { testKnowledgeIntegrationAction } from "./testKnowledgeIntegrationAction";
import { IAgentRuntime, Memory, State } from "@elizaos/core";

// Mock the KnowledgeBaseService
const mockKnowledgeService = {
  getAllTopics: vi.fn(() => ["bitcoin-thesis", "market-cycles", "satoshi-philosophy", "other-topic"]),
  getFileByTopic: vi.fn((topic: string) => {
    if (topic === "bitcoin-thesis") {
      return { content: "Bitcoin thesis content...", data: {}, headings: ["Introduction", "Thesis"] };
    }
    if (topic === "market-cycles") {
      return { content: "Market cycles content...", data: {}, headings: ["Cycles", "Analysis"] };
    }
    if (topic === "satoshi-philosophy") {
      return { content: "Satoshi philosophy content...", data: {}, headings: ["Philosophy", "Vision"] };
    }
    return undefined;
  }),
  search: vi.fn((query: string) => {
    if (query === "bitcoin") {
      return [{ topic: "bitcoin-thesis", snippet: "Bitcoin is..." }];
    }
    if (query === "thesis") {
      return [{ topic: "bitcoin-thesis", snippet: "The thesis is..." }];
    }
    return [];
  }),
  summarize: vi.fn((topic: string) => {
    if (topic === "bitcoin-thesis") {
      return "Bitcoin thesis summary...";
    }
    if (topic === "market-cycles") {
      return "Market cycles summary...";
    }
    return undefined;
  }),
};

// Mock runtime
const mockRuntime = {
  getService: vi.fn((serviceName: string) => {
    if (serviceName === "knowledge-base") {
      return mockKnowledgeService;
    }
    return null;
  }),
} as unknown as IAgentRuntime;

describe("testKnowledgeIntegrationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate correctly for knowledge test messages", async () => {
    const message: Memory = {
      content: { text: "test knowledge integration" },
    } as Memory;

    const state: State = {} as State;

    const result = await testKnowledgeIntegrationAction.validate(mockRuntime, message, state);
    expect(result).toBe(true);
  });

  it("should not validate for non-knowledge test messages", async () => {
    const message: Memory = {
      content: { text: "hello world" },
    } as Memory;

    const state: State = {} as State;

    const result = await testKnowledgeIntegrationAction.validate(mockRuntime, message, state);
    expect(result).toBe(false);
  });

  it("should handle successful knowledge integration test", async () => {
    const message: Memory = {
      content: { text: "test knowledge integration" },
    } as Memory;

    const state: State = {} as State;

    const mockCallback = vi.fn();

    await testKnowledgeIntegrationAction.handler(
      mockRuntime,
      message,
      state,
      {},
      mockCallback,
      []
    );

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("Phase 3 Knowledge Integration Test"),
        actions: ["TEST_KNOWLEDGE_INTEGRATION"],
        source: "knowledge-integration-test",
      })
    );

    // Verify service methods were called
    expect(mockKnowledgeService.getAllTopics).toHaveBeenCalled();
    expect(mockKnowledgeService.getFileByTopic).toHaveBeenCalledWith("bitcoin-thesis");
    expect(mockKnowledgeService.getFileByTopic).toHaveBeenCalledWith("market-cycles");
    expect(mockKnowledgeService.getFileByTopic).toHaveBeenCalledWith("satoshi-philosophy");
    expect(mockKnowledgeService.search).toHaveBeenCalledWith("bitcoin");
    expect(mockKnowledgeService.search).toHaveBeenCalledWith("thesis");
    expect(mockKnowledgeService.summarize).toHaveBeenCalledWith("bitcoin-thesis");
    expect(mockKnowledgeService.summarize).toHaveBeenCalledWith("market-cycles");
  });

  it("should handle missing knowledge service gracefully", async () => {
    const mockRuntimeWithoutService = {
      getService: vi.fn(() => null),
    } as unknown as IAgentRuntime;

    const message: Memory = {
      content: { text: "test knowledge integration" },
    } as Memory;

    const state: State = {} as State;

    const mockCallback = vi.fn();

    await testKnowledgeIntegrationAction.handler(
      mockRuntimeWithoutService,
      message,
      state,
      {},
      mockCallback,
      []
    );

    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(String(callArgs.text)).toContain("Knowledge Integration Test Failed");
    expect(callArgs.actions).toEqual(["TEST_KNOWLEDGE_INTEGRATION"]);
    expect(callArgs.source).toBe("knowledge-integration-test");
  });
}); 