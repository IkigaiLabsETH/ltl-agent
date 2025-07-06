export type AlertSeverity = "info" | "warning" | "critical";

export type AlertType =
  | "OPPORTUNITY"
  | "RISK"
  | "ANOMALY"
  | "CYCLE"
  | "MACRO"
  | "NETWORK"
  | "PRICE"
  | "ETF"
  | "ONCHAIN"
  | "CUSTOM";

export interface Alert {
  id: string; // UUID
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  confidence: number; // 0-1
  timestamp: string; // ISO string
  source: string; // e.g., "MarketIntelligenceService"
  data?: any; // Optional extra data
} 