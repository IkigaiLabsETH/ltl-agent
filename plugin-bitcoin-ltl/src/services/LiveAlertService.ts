import { Service } from "@elizaos/core";
import { Alert, AlertType, AlertSeverity } from "../types/alertTypes";
import { v4 as uuidv4 } from "uuid";

/**
 * LiveAlertService
 * Aggregates and manages real-time alerts from all intelligence services.
 */
export class LiveAlertService extends Service {
  private alerts: Alert[] = [];
  private maxAlerts = 100;

  /**
   * Add a new alert
   */
  addAlert(params: {
    type: AlertType;
    message: string;
    severity: AlertSeverity;
    confidence: number;
    source: string;
    data?: any;
  }) {
    const alert: Alert = {
      id: uuidv4(),
      type: params.type,
      message: params.message,
      severity: params.severity,
      confidence: params.confidence,
      timestamp: new Date().toISOString(),
      source: params.source,
      data: params.data,
    };
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }
  }

  /**
   * Helper methods for common alert types
   */
  
  // Price alerts
  addPriceAlert(message: string, severity: AlertSeverity, confidence: number, data?: any) {
    this.addAlert({
      type: "PRICE",
      message,
      severity,
      confidence,
      source: "MarketIntelligenceService",
      data,
    });
  }

  // Network alerts
  addNetworkAlert(message: string, severity: AlertSeverity, confidence: number, data?: any) {
    this.addAlert({
      type: "NETWORK",
      message,
      severity,
      confidence,
      source: "BitcoinNetworkDataService",
      data,
    });
  }

  // Opportunity alerts
  addOpportunityAlert(message: string, confidence: number, data?: any) {
    this.addAlert({
      type: "OPPORTUNITY",
      message,
      severity: "info",
      confidence,
      source: "AdvancedMarketIntelligenceService",
      data,
    });
  }

  // Risk alerts
  addRiskAlert(message: string, severity: AlertSeverity, confidence: number, data?: any) {
    this.addAlert({
      type: "RISK",
      message,
      severity,
      confidence,
      source: "AdvancedMarketIntelligenceService",
      data,
    });
  }

  // ETF alerts
  addETFAlert(message: string, severity: AlertSeverity, confidence: number, data?: any) {
    this.addAlert({
      type: "ETF",
      message,
      severity,
      confidence,
      source: "ETFDataService",
      data,
    });
  }

  // On-chain alerts
  addOnChainAlert(message: string, severity: AlertSeverity, confidence: number, data?: any) {
    this.addAlert({
      type: "ONCHAIN",
      message,
      severity,
      confidence,
      source: "BitcoinIntelligenceService",
      data,
    });
  }

  // Macro alerts
  addMacroAlert(message: string, severity: AlertSeverity, confidence: number, data?: any) {
    this.addAlert({
      type: "MACRO",
      message,
      severity,
      confidence,
      source: "MarketIntelligenceService",
      data,
    });
  }

  /**
   * Get recent alerts, optionally filtered by type or severity
   */
  getAlerts(filter?: { type?: AlertType; severity?: AlertSeverity }): Alert[] {
    let result = this.alerts;
    if (filter?.type) {
      result = result.filter(a => a.type === filter.type);
    }
    if (filter?.severity) {
      result = result.filter(a => a.severity === filter.severity);
    }
    return result;
  }

  /**
   * Clear all alerts (for testing or reset)
   */
  clearAlerts() {
    this.alerts = [];
  }

  /**
   * Required by Service base class
   */
  async stop(): Promise<void> {
    // No-op for now
  }

  get capabilityDescription(): string {
    return "Aggregates and manages real-time alerts from all intelligence services.";
  }
} 