import { describe, it, expect, vi } from "vitest";
import { advancedSatoshiReasoningAction } from "./advancedSatoshiReasoningAction";
import { IAgentRuntime, Memory, State } from "@elizaos/core";

const mockAdvancedService = {
  analyzeMarketConditions: vi.fn(() => Promise.resolve({
    type: 'BULL',
    confidence: 0.85,
    signals: ['Price above $100K', 'High dominance'],
    riskLevel: 'HIGH',
    opportunities: [{
      id: 'risk_mgmt_001',
      type: 'DISTRIBUTION',
      asset: 'BTC',
      description: 'High price and dominance - consider risk management',
      riskRewardRatio: 2.0,
      confidence: 0.7,
      timeframe: 'MEDIUM',
      signals: ['Price above $100K', 'High dominance'],
      action: 'Consider trimming 10-20% of holdings'
    }]
  })),
  assessRisk: vi.fn(() => Promise.resolve({
    overallRisk: 'HIGH',
    marketRisk: 0.8,
    volatilityRisk: 0.7,
    correlationRisk: 0.3,
    liquidityRisk: 0.2,
    recommendations: ['Consider risk management strategies', 'Reduce leverage']
  }))
};

const mockKnowledgeService = {
  getAllTopics: vi.fn(() => ['bitcoin-thesis', 'market-cycles', 'bull-market-analysis']),
  summarize: vi.fn((topic: string) => `${topic} summary content...`),
};

describe("advancedSatoshiReasoningAction", () => {
  it("should produce sophisticated market analysis with opportunities", async () => {
    const mockRuntime = {
      getService: vi.fn((serviceName: string) => {
        if (serviceName === "advanced-market-intelligence") return mockAdvancedService;
        if (serviceName === "knowledge-base") return mockKnowledgeService;
        return null;
      }),
    } as unknown as IAgentRuntime;

    const message: Memory = {
      content: { text: "Give me advanced analysis of current market conditions" },
    } as Memory;

    const state = {
      values: {
        philosophy: {
          corePrinciples: ["Sound Money: 21 million fixed supply"],
          satoshiQuotes: ["Bitcoin is the exit strategy from fiat currency"],
          responseFramework: ["Bitcoin-first perspective"],
          style: "Deadpan clarity"
        }
      }
    } as unknown as State;

    const mockCallback = vi.fn();

    await advancedSatoshiReasoningAction.handler(
      mockRuntime,
      message,
      state,
      {},
      mockCallback,
      []
    );

    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.text).toContain("Advanced Satoshi Intelligence");
    expect(callArgs.text).toContain("Market Condition:");
    expect(callArgs.text).toContain("BULL");
    expect(callArgs.text).toContain("Overall Risk:");
    expect(callArgs.text).toContain("HIGH");
    expect(callArgs.text).toContain("Opportunities:");
    expect(callArgs.text).toContain("Risk Recommendations:");
  });

  it("should handle missing services gracefully", async () => {
    const mockRuntime = {
      getService: vi.fn(() => null),
    } as unknown as IAgentRuntime;

    const message: Memory = {
      content: { text: "Advanced analysis test" },
    } as Memory;

    const state = {
      values: {
        philosophy: {
          corePrinciples: ["Verification: Truth is verified, not argued"],
          satoshiQuotes: [],
          responseFramework: ["Bitcoin-first perspective"],
          style: "Deadpan clarity"
        }
      }
    } as unknown as State;

    const mockCallback = vi.fn();

    await advancedSatoshiReasoningAction.handler(
      mockRuntime,
      message,
      state,
      {},
      mockCallback,
      []
    );

    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.text).toContain("Advanced Satoshi Intelligence");
    expect(callArgs.text).toContain("Market data unavailable");
    expect(callArgs.text).toContain("Risk assessment unavailable");
  });
}); 