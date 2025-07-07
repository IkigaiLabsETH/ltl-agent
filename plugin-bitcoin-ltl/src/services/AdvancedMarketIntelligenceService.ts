import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { BitcoinIntelligenceService } from "./BitcoinIntelligenceService";
import { MarketIntelligenceService } from "./MarketIntelligenceService";
import { LiveAlertService } from "./LiveAlertService";

export interface MarketCondition {
  type: 'BULL' | 'BEAR' | 'NEUTRAL' | 'ACCUMULATION' | 'DISTRIBUTION' | 'ROTATION';
  confidence: number;
  signals: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  opportunities: Opportunity[];
}

export interface Opportunity {
  id: string;
  type: 'ACCUMULATION' | 'DISTRIBUTION' | 'ROTATION' | 'HEDGE' | 'LEVERAGE';
  asset: string;
  description: string;
  riskRewardRatio: number;
  confidence: number;
  timeframe: 'SHORT' | 'MEDIUM' | 'LONG';
  signals: string[];
  action: string;
}

export interface RiskAssessment {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  marketRisk: number;
  volatilityRisk: number;
  correlationRisk: number;
  liquidityRisk: number;
  recommendations: string[];
}

/**
 * Advanced Market Intelligence Service
 * Provides sophisticated market analysis, opportunity detection, and risk assessment
 */
export class AdvancedMarketIntelligenceService extends BaseDataService {
  static serviceType = "advanced-market-intelligence";
  capabilityDescription = "Advanced market intelligence with opportunity detection and risk assessment.";

  private bitcoinService: BitcoinIntelligenceService | null = null;
  private marketService: MarketIntelligenceService | null = null;
  private alertService: LiveAlertService | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
  }

  async init() {
    logger.info("AdvancedMarketIntelligenceService initializing...");
    this.bitcoinService = this.runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
    this.marketService = this.runtime.getService<MarketIntelligenceService>("market-intelligence");
    this.alertService = this.runtime.getService<LiveAlertService>("LiveAlertService");
    logger.info("AdvancedMarketIntelligenceService initialized successfully.");
  }

  async updateData(): Promise<void> {
    // Real-time updates handled by individual services
  }

  async forceUpdate(): Promise<void> {
    // Force refresh of all underlying data
  }

  /**
   * Analyze current market conditions with sophisticated reasoning
   */
  async analyzeMarketConditions(): Promise<MarketCondition> {
    try {
      const bitcoinData = this.bitcoinService ? await this.bitcoinService.getComprehensiveIntelligence() : null;
      const marketData = this.marketService ? await this.marketService.getMarketIntelligence() : null;

      if (!bitcoinData) {
        return this.getDefaultCondition();
      }

      const { price, dominance, marketCap } = bitcoinData.network;
      const signals: string[] = [];
      let type: MarketCondition['type'] = 'NEUTRAL';
      let confidence = 0.5;
      let riskLevel: MarketCondition['riskLevel'] = 'MEDIUM';

      // Price-based analysis
      if (price > 100000) {
        signals.push("Price above $100K - potential euphoria phase");
        if (dominance > 60) {
          type = 'BULL';
          confidence = 0.8;
          riskLevel = 'HIGH';
        }
      } else if (price < 50000) {
        signals.push("Price below $50K - potential accumulation zone");
        if (dominance < 50) {
          type = 'ACCUMULATION';
          confidence = 0.7;
          riskLevel = 'LOW';
        }
      } else if (price === 0) {
        // No valid price data
        return this.getDefaultCondition();
      }

      // Market cap analysis
      if (marketCap > 2e12) {
        signals.push("Market cap > $2T - Bitcoin entering major league");
        confidence = Math.min(confidence + 0.1, 0.9);
      }

      // Dominance analysis
      if (dominance > 65) {
        signals.push("High Bitcoin dominance - altcoin season unlikely");
        if (type === 'BULL') confidence += 0.1;
      } else if (dominance < 40) {
        signals.push("Low Bitcoin dominance - altcoin rotation possible");
        type = 'ROTATION';
        riskLevel = 'HIGH';
      }

          // Generate opportunities based on conditions
    const opportunities = await this.generateOpportunities(bitcoinData, marketData);

    // Generate alerts for high-confidence opportunities and risks
    if (this.alertService) {
      // Alert for high-confidence opportunities
      if (opportunities.length > 0) {
        const bestOpportunity = opportunities[0];
        if (bestOpportunity.confidence > 0.7) {
          this.alertService.addOpportunityAlert(
            `High-confidence opportunity detected: ${bestOpportunity.description}`,
            bestOpportunity.confidence,
            { opportunity: bestOpportunity, marketCondition: type }
          );
        }
      }

      // Alert for extreme risk conditions
      // if (riskLevel === 'EXTREME') {
      //   this.alertService.addRiskAlert(
      //     `Extreme market risk detected: ${signals.join(', ')}`,
      //     "critical",
      //     0.9,
      //     { riskLevel, signals, marketCondition: type }
      //   );
      // }
    }

    return {
      type,
      confidence: Math.min(confidence, 0.95),
      signals,
      riskLevel,
      opportunities
    };

    } catch (error) {
      logger.error("Error analyzing market conditions:", error);
      return this.getDefaultCondition();
    }
  }

  /**
   * Generate opportunities based on current market conditions
   */
  private async generateOpportunities(bitcoinData: any, marketData: any): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    const { price, dominance, marketCap } = bitcoinData.network;

    // Accumulation opportunities
    if (price < 60000 && dominance > 55) {
      opportunities.push({
        id: "acc_btc_001",
        type: "ACCUMULATION",
        asset: "BTC",
        description: "Bitcoin price below $60K with high dominance - strong accumulation signal",
        riskRewardRatio: 3.5,
        confidence: 0.8,
        timeframe: "LONG",
        signals: ["Price below $60K", "High dominance", "Strong fundamentals"],
        action: "Consider DCA strategy with 60-70% portfolio allocation"
      });
    }

    // Risk management opportunities
    if (price > 100000 && dominance > 60) {
      opportunities.push({
        id: "risk_mgmt_001",
        type: "DISTRIBUTION",
        asset: "BTC",
        description: "High price and dominance - consider risk management",
        riskRewardRatio: 2.0,
        confidence: 0.7,
        timeframe: "MEDIUM",
        signals: ["Price above $100K", "High dominance", "Potential euphoria"],
        action: "Consider trimming 10-20% of holdings, maintain core position"
      });
    }

    // Rotation opportunities
    if (dominance < 45) {
      opportunities.push({
        id: "rotation_alt_001",
        type: "ROTATION",
        asset: "ALTCOINS",
        description: "Low Bitcoin dominance - potential altcoin season",
        riskRewardRatio: 4.0,
        confidence: 0.6,
        timeframe: "SHORT",
        signals: ["Low Bitcoin dominance", "Altcoin momentum", "Risk appetite"],
        action: "Consider 10-15% allocation to proven altcoins, maintain BTC core"
      });
    }

    return opportunities;
  }

  /**
   * Comprehensive risk assessment
   */
  async assessRisk(): Promise<RiskAssessment> {
    try {
      const bitcoinData = this.bitcoinService ? await this.bitcoinService.getComprehensiveIntelligence() : null;
      
      if (!bitcoinData) {
        return this.getDefaultRiskAssessment();
      }

      const { price, dominance, marketCap } = bitcoinData.network;
      
      // Calculate risk metrics
      const marketRisk = this.calculateMarketRisk(price, marketCap);
      const volatilityRisk = this.calculateVolatilityRisk(price);
      const correlationRisk = this.calculateCorrelationRisk(dominance);
      const liquidityRisk = this.calculateLiquidityRisk(marketCap);

      const overallRisk = this.determineOverallRisk([marketRisk, volatilityRisk, correlationRisk, liquidityRisk]);
      
      const recommendations = this.generateRiskRecommendations(overallRisk, {
        marketRisk,
        volatilityRisk,
        correlationRisk,
        liquidityRisk
      });

      return {
        overallRisk,
        marketRisk,
        volatilityRisk,
        correlationRisk,
        liquidityRisk,
        recommendations
      };

    } catch (error) {
      logger.error("Error assessing risk:", error);
      return this.getDefaultRiskAssessment();
    }
  }

  private calculateMarketRisk(price: number, marketCap: number): number {
    // Higher price and market cap = higher risk
    const priceRisk = Math.min(price / 100000, 1);
    const marketCapRisk = Math.min(marketCap / 2e12, 1);
    return (priceRisk + marketCapRisk) / 2;
  }

  private calculateVolatilityRisk(price: number): number {
    // Simplified volatility risk based on price level
    return Math.min(price / 150000, 1);
  }

  private calculateCorrelationRisk(dominance: number): number {
    // Lower dominance = higher correlation risk with altcoins
    return Math.max(0, (50 - dominance) / 50);
  }

  private calculateLiquidityRisk(marketCap: number): number {
    // Higher market cap = lower liquidity risk
    return Math.max(0, 1 - (marketCap / 2e12));
  }

  private determineOverallRisk(risks: number[]): RiskAssessment['overallRisk'] {
    const avgRisk = risks.reduce((a, b) => a + b, 0) / risks.length;
    if (avgRisk < 0.25) return 'LOW';
    if (avgRisk < 0.5) return 'MEDIUM';
    if (avgRisk < 0.75) return 'HIGH';
    return 'EXTREME';
  }

  private generateRiskRecommendations(overallRisk: RiskAssessment['overallRisk'], risks: any): string[] {
    const recommendations: string[] = [];

    switch (overallRisk) {
      case 'LOW':
        recommendations.push("Market conditions favorable for accumulation");
        recommendations.push("Consider increasing Bitcoin allocation");
        break;
      case 'MEDIUM':
        recommendations.push("Maintain balanced portfolio allocation");
        recommendations.push("Monitor for changing market conditions");
        break;
      case 'HIGH':
        recommendations.push("Consider risk management strategies");
        recommendations.push("Reduce leverage and speculative positions");
        break;
      case 'EXTREME':
        recommendations.push("Implement defensive positioning");
        recommendations.push("Consider hedging strategies");
        recommendations.push("Maintain high cash reserves");
        break;
    }

    return recommendations;
  }

  private getDefaultCondition(): MarketCondition {
    return {
      type: 'NEUTRAL',
      confidence: 0.5,
      signals: ["Insufficient data for analysis"],
      riskLevel: 'MEDIUM',
      opportunities: []
    };
  }

  private getDefaultRiskAssessment(): RiskAssessment {
    return {
      overallRisk: 'MEDIUM',
      marketRisk: 0.5,
      volatilityRisk: 0.5,
      correlationRisk: 0.5,
      liquidityRisk: 0.5,
      recommendations: ["Insufficient data for risk assessment"]
    };
  }
} 