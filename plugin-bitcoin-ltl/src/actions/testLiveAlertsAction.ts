import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { LiveAlertService } from "../services/LiveAlertService";

/**
 * Test Live Alerts Action
 * Demonstrates the live alerting system by generating sample alerts
 */
export const testLiveAlertsAction: Action = {
  name: "TEST_LIVE_ALERTS",
  similes: ["DEMO_ALERTS", "GENERATE_TEST_ALERTS", "CREATE_SAMPLE_ALERTS"],
  description: "Generates sample alerts to demonstrate the live alerting system",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("test") && text.includes("alert") ||
      text.includes("demo") && text.includes("alert") ||
      text.includes("sample") && text.includes("alert")
    );
  },

  handler: async (runtime: IAgentRuntime, message: Memory, _state: State, _params, callback) => {
    const alertService = runtime.getService<LiveAlertService>("LiveAlertService");
    
    if (!alertService) {
      callback({
        thought: "LiveAlertService not available for testing",
        text: "❌ LiveAlertService not available. Please ensure the service is properly initialized.",
        actions: ["TEST_LIVE_ALERTS"],
      });
      return;
    }

    // Generate sample alerts
    alertService.addPriceAlert(
      "🚨 Bitcoin price surged 8.5% in the last hour!",
      "critical",
      0.95,
      { priceChange: 8.5, currentPrice: 0, previousPrice: 0 } // No fallback prices - will use real data
    );

    alertService.addNetworkAlert(
      "⚡ Bitcoin hash rate reached new all-time high: 900 EH/s",
      "info",
      0.9,
      { hashRate: 900, previousHashRate: 850 }
    );

    alertService.addOpportunityAlert(
      "💡 High-confidence accumulation opportunity: Bitcoin below $60K with strong fundamentals",
      0.85,
      { price: 0, dominance: 65, confidence: 0.85 } // No fallback price - will use real data
    );

    alertService.addRiskAlert(
      "⚠️ High market risk detected: Extreme volatility and low dominance",
      "warning",
      0.8,
      { volatility: "high", dominance: 35, riskFactors: ["low dominance", "high volatility"] }
    );

    alertService.addETFAlert(
      "📈 ETF net inflow hit $300M today - strong institutional demand",
      "info",
      0.9,
      { dailyFlows: 300000000, totalAUM: 28000000000 }
    );

    alertService.addOnChainAlert(
      "🔍 Extreme MVRV ratio detected: 3.8 (potential overvaluation signal)",
      "warning",
      0.9,
      { mvrvRatio: 3.8, threshold: 3.5 }
    );

    callback({
      thought: "Successfully generated 6 sample alerts covering different types and severities",
      text: `✅ **Live Alert System Test Complete**

🔔 Generated 6 sample alerts:
• 🚨 Critical price alert (8.5% surge)
• ⚡ Info network alert (hash rate ATH)
• 💡 Opportunity alert (accumulation signal)
• ⚠️ Warning risk alert (high volatility)
• 📈 Info ETF alert (strong inflows)
• 🔍 Warning on-chain alert (MVRV ratio)

You can now test the alert viewing with:
• "Show all alerts"
• "Show only critical alerts"
• "Show price alerts"
• "Show network alerts"

The alerts are now available in the agent context and can be viewed using the VIEW_ALERTS action.`,
      actions: ["TEST_LIVE_ALERTS", "VIEW_ALERTS"],
    });
  },
}; 