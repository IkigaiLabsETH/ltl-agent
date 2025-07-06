import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { Alert } from "../types/alertTypes";
import { LiveAlertService } from "../services/LiveAlertService";

export const alertProvider: Provider = {
  name: "ALERTS",
  description: "Injects recent live alerts into the agent context for real-time awareness.",
  position: 5, // High priority

  get: async (runtime: IAgentRuntime, _message: Memory, _state: State) => {
    const alertService = runtime.getService<LiveAlertService>("LiveAlertService");
    let alerts: Alert[] = [];
    if (alertService) {
      alerts = alertService.getAlerts();
    }
    return {
      values: {
        alerts,
      },
    };
  },
}; 