import { describe, it, expect, vi } from "vitest";
import { satoshiReasoningAction } from "./satoshiReasoningAction";
import { IAgentRuntime, Memory, State } from "@elizaos/core";

const mockBitcoinService = {
  getComprehensiveIntelligence: vi.fn(() => Promise.resolve({
    network: {
      price: 120000,
      marketCap: 2100000000000,
      dominance: 65.12,
    },
  })),
};

const mockKnowledgeService = {
  getAllTopics: vi.fn(() => ["bitcoin-thesis", "other-topic"]),
  summarize: vi.fn((topic: string) => topic === "bitcoin-thesis" ? "Bitcoin thesis summary..." : "Other topic summary..."),
};

describe("satoshiReasoningAction", () => {
  it("should produce a philosophy-consistent, data-driven response", async () => {
    const mockRuntime = {
      getService: vi.fn((serviceName: string) => {
        if (serviceName === "bitcoin-intelligence") return mockBitcoinService;
        if (serviceName === "knowledge-base") return mockKnowledgeService;
        return null;
      }),
    } as unknown as IAgentRuntime;

    const message: Memory = {
      content: { text: "What would Satoshi say about Bitcoin now?" },
    } as Memory;

    const state = {
      values: {
        philosophy: {
          corePrinciples: ["Sound Money: 21 million fixed supply, predictable issuance"],
          satoshiQuotes: ["Bitcoin is the exit strategy from fiat currency. Everything else is noise."],
          responseFramework: ["Bitcoin-first perspective"],
          style: "Deadpan clarity, spartan efficiency, proof-driven language."
        }
      }
    } as unknown as State;

    const mockCallback = vi.fn();

    await satoshiReasoningAction.handler(
      mockRuntime,
      message,
      state,
      {},
      mockCallback,
      []
    );

    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.text).toContain("Satoshi Reasoning");
    expect(callArgs.text).toMatch(/Bitcoin is the exit strategy from fiat currency/);
    expect(callArgs.text).toMatch(/Price: \$120,000/);
    expect(callArgs.text).toMatch(/Bitcoin thesis summary/);
    expect(callArgs.text).toMatch(/Stack accordingly|Consider risk management/);
  });

  it("should handle missing data gracefully", async () => {
    const mockRuntime = {
      getService: vi.fn(() => null),
    } as unknown as IAgentRuntime;

    const message: Memory = {
      content: { text: "Satoshi reasoning test" },
    } as Memory;

    const state = {
      values: {
        philosophy: {
          corePrinciples: ["Verification: Truth is verified, not argued"],
          satoshiQuotes: [],
          responseFramework: ["Bitcoin-first perspective"],
          style: "Deadpan clarity, spartan efficiency, proof-driven language."
        }
      }
    } as unknown as State;

    const mockCallback = vi.fn();

    await satoshiReasoningAction.handler(
      mockRuntime,
      message,
      state,
      {},
      mockCallback,
      []
    );

    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.text).toContain("Satoshi Reasoning");
    expect(callArgs.text).toMatch(/Truth is verified, not argued/);
    expect(callArgs.text).toMatch(/data unavailable/);
    expect(callArgs.text).toMatch(/Stay focused on first principles/);
  });
}); 