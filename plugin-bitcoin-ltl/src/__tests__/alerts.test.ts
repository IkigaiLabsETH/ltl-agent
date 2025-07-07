import { describe, it, expect, beforeEach, vi } from "vitest";
import { alertProvider } from "../providers/alertProvider";
import { viewAlertsAction } from "../actions/viewAlertsAction";
import { LiveAlertService } from "../services/LiveAlertService";
import { Alert } from "../types/alertTypes";
import { IAgentRuntime, Memory, State } from "@elizaos/core";

// Demo alerts
const demoAlerts: Alert[] = [
  {
    id: "1",
    type: "PRICE",
    message: "Bitcoin price surged 5% in 1 hour!",
    severity: "critical",
    confidence: 0.98,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    source: "MarketIntelligenceService",
  },
  {
    id: "2",
    type: "NETWORK",
    message: "Hash rate at all-time high.",
    severity: "info",
    confidence: 0.95,
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    source: "BitcoinNetworkDataService",
  },
  {
    id: "3",
    type: "PRICE",
    message: "BTC price dropped 3% in 30 minutes.",
    severity: "warning",
    confidence: 0.85,
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    source: "MarketIntelligenceService",
  },
  {
    id: "4",
    type: "ETF",
    message: "ETF net inflow hit $200M today.",
    severity: "info",
    confidence: 0.9,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    source: "ETFDataService",
  },
];

// Mock runtime
class MockRuntime {
  private alertService: LiveAlertService;
  constructor(alerts: Alert[]) {
    this.alertService = new LiveAlertService();
    // Directly set alerts for test
    (this.alertService as any).alerts = alerts;
  }
  getService<T>(_name: string): T | null {
    return this.alertService as unknown as T;
  }
}

const mockMessage = (text: string): Memory => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  content: { text },
  entityId: "123e4567-e89b-12d3-a456-426614174001",
  agentId: "123e4567-e89b-12d3-a456-426614174002",
  roomId: "123e4567-e89b-12d3-a456-426614174003",
  createdAt: Date.now(),
});

const emptyState: State = { values: {}, data: {}, text: "" };

describe("Alert Provider & Action", () => {
  let runtime: IAgentRuntime;

  beforeEach(() => {
    runtime = new MockRuntime(demoAlerts) as unknown as IAgentRuntime;
  });

  it("injects all alerts into context via provider", async () => {
    const result = await alertProvider.get(runtime, mockMessage("Show alerts"), emptyState);
    expect(result.values.alerts).toHaveLength(demoAlerts.length);
    expect(result.values.alerts[0].message).toBe("Bitcoin price surged 5% in 1 hour!");
  });

  it("returns all alerts with no filter", async () => {
    const callback = vi.fn();
    await viewAlertsAction.handler(runtime, mockMessage("Show all alerts"), emptyState, {}, callback);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Recent Alerts"),
    }));
    const call = callback.mock.calls[0][0];
    expect(call.text).toContain("Bitcoin price surged 5% in 1 hour!");
    expect(call.text).toContain("ETF net inflow hit $200M today.");
  });

  it("filters by severity: critical", async () => {
    const callback = vi.fn();
    await viewAlertsAction.handler(runtime, mockMessage("Show only critical alerts"), emptyState, {}, callback);
    const call = callback.mock.calls[0][0];
    expect(call.text).toContain("Bitcoin price surged 5% in 1 hour!");
    expect(call.text).not.toContain("ETF net inflow hit $200M today.");
    expect(call.text).not.toContain("BTC price dropped 3% in 30 minutes.");
  });

  it("filters by type: price", async () => {
    const callback = vi.fn();
    await viewAlertsAction.handler(runtime, mockMessage("Show price alerts"), emptyState, {}, callback);
    const call = callback.mock.calls[0][0];
    expect(call.text).toContain("Bitcoin price surged 5% in 1 hour!");
    expect(call.text).toContain("BTC price dropped 3% in 30 minutes.");
    expect(call.text).not.toContain("ETF net inflow hit $200M today.");
  });

  it("returns no alerts if filter does not match", async () => {
    const callback = vi.fn();
    await viewAlertsAction.handler(runtime, mockMessage("Show only anomaly alerts"), emptyState, {}, callback);
    const call = callback.mock.calls[0][0];
    expect(call.text).toContain("No alerts found");
  });
}); 