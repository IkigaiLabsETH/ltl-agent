import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { LiveAlertService } from "../services/LiveAlertService";
import { AlertType, AlertSeverity, Alert } from "../types/alertTypes";

const SEVERITY_KEYWORDS: Record<string, AlertSeverity> = {
  critical: "critical",
  warning: "warning",
  info: "info",
};

const TYPE_KEYWORDS: Record<string, AlertType> = {
  price: "PRICE",
  network: "NETWORK",
  opportunity: "OPPORTUNITY",
  risk: "RISK",
  anomaly: "ANOMALY",
  cycle: "CYCLE",
  macro: "MACRO",
  etf: "ETF",
  onchain: "ONCHAIN",
  custom: "CUSTOM",
};

export const viewAlertsAction: Action = {
  name: "VIEW_ALERTS",
  similes: ["SHOW_ALERTS", "ALERTS", "RECENT_ALERTS", "FILTERED_ALERTS"],
  description: "View recent live alerts, filterable by severity or type (e.g., 'Show only critical alerts', 'Show price alerts').",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return text.includes("alert");
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state: State, _params, callback) => {
    const text = message.content.text.toLowerCase();
    let severity: AlertSeverity | undefined;
    let type: AlertType | undefined;

    // Parse for severity
    for (const [keyword, sev] of Object.entries(SEVERITY_KEYWORDS)) {
      if (text.includes(keyword)) {
        severity = sev;
        break;
      }
    }
    // Parse for type
    for (const [keyword, t] of Object.entries(TYPE_KEYWORDS)) {
      if (text.includes(keyword)) {
        type = t;
        break;
      }
    }

    const alertService = runtime.getService<LiveAlertService>("LiveAlertService");
    let alerts: Alert[] = [];
    if (alertService) {
      alerts = alertService.getAlerts({ type, severity });
    }

    if (!alerts.length) {
      callback({
        thought: `No alerts found for${type ? ` type: ${type}` : ""}${severity ? ` severity: ${severity}` : ""}.`,
        text: `No alerts found matching your criteria.`,
        actions: ["VIEW_ALERTS"],
      });
      return;
    }

    // Format alerts for display
    const formatted = alerts.slice(0, 10).map(a =>
      `• [${a.severity.toUpperCase()}] [${a.type}] ${a.message} (Confidence: ${(a.confidence * 100).toFixed(0)}%, Source: ${a.source}, Time: ${new Date(a.timestamp).toLocaleString()})`
    ).join("\n");

    callback({
      thought: `Returned ${alerts.length} alert(s)${type ? ` of type ${type}` : ""}${severity ? ` with severity ${severity}` : ""}.`,
      text: `🔔 **Recent Alerts**\n${formatted}`,
      actions: ["VIEW_ALERTS"],
    });
  },
}; 