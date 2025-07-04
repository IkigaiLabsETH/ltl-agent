import { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { OpportunityAlertService } from '../services/OpportunityAlertService';
import { SchedulerService } from '../services/SchedulerService';

export const opportunityAlertsAction: Action = {
  name: "OPPORTUNITY_ALERTS",
  similes: [
    "CHECK_ALERTS",
    "SHOW_ALERTS",
    "OPPORTUNITIES",
    "INVESTMENT_ALERTS",
    "MARKET_ALERTS"
  ],
  description: "Check current opportunity alerts and investment signals",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    
    const alertTriggers = [
      'alerts',
      'opportunities',
      'opportunity alerts',
      'check alerts',
      'show alerts',
      'any alerts',
      'investment alerts',
      'market alerts',
      'what opportunities',
      'any opportunities',
      'signals',
      'market signals',
      'investment signals',
      'what should i watch',
      'watchlist',
      'immediate opportunities'
    ];
    
    return alertTriggers.some(trigger => text.includes(trigger));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ) => {
    try {
      // Try to get the alert service
      const alertService = runtime.getService('opportunity-alert') as unknown as OpportunityAlertService;
      
      if (!alertService) {
        const errorResponse = {
          text: "Opportunity alert service is not available. The proactive intelligence system may still be initializing.",
          content: {
            text: "Opportunity alert service is not available. The proactive intelligence system may still be initializing.",
            action: "OPPORTUNITY_ALERTS",
            source: "system",
            error: "Service unavailable"
          }
        };
        
        if (callback) {
          callback(errorResponse);
          return true;
        }
        return false;
      }
      
      // Get active alerts
      const activeAlerts = await alertService.getActiveAlerts();
      const metrics = await alertService.getMetrics();
      
      if (activeAlerts.length === 0) {
        const noAlertsResponse = {
          text: "No active opportunity alerts. Markets consolidating. Continue monitoring for entry signals.",
          content: {
            text: "No active opportunity alerts. Markets consolidating. Continue monitoring for entry signals.",
            action: "OPPORTUNITY_ALERTS",
            source: "alert_service",
            alertCount: 0,
            systemStatus: "monitoring"
          }
        };
        
        if (callback) {
          callback(noAlertsResponse);
          return true;
        }
        return false;
      }
      
      // Categorize alerts by type
      const immediateAlerts = activeAlerts.filter(alert => alert.type === 'immediate');
      const upcomingAlerts = activeAlerts.filter(alert => alert.type === 'upcoming');
      const watchlistAlerts = activeAlerts.filter(alert => alert.type === 'watchlist');
      
      // Format alerts for delivery
      const alertSections = [];
      
      alertSections.push("🚨 **Active Opportunity Alerts**");
      alertSections.push("");
      
      if (immediateAlerts.length > 0) {
        alertSections.push("⚡ **Immediate Opportunities:**");
        immediateAlerts.slice(0, 3).forEach(alert => {
          const confidencePercent = (alert.confidence * 100).toFixed(0);
          alertSections.push(`• **${alert.asset.toUpperCase()}**: ${alert.signal}`);
          alertSections.push(`  Confidence: ${confidencePercent}% | Action: ${alert.action}`);
          alertSections.push(`  Reason: ${alert.reason}`);
        });
        alertSections.push("");
      }
      
      if (upcomingAlerts.length > 0) {
        alertSections.push("📅 **Upcoming Opportunities:**");
        upcomingAlerts.slice(0, 3).forEach(alert => {
          alertSections.push(`• **${alert.asset.toUpperCase()}**: ${alert.signal}`);
          alertSections.push(`  Timeframe: ${alert.timeframe} | Action: ${alert.action}`);
        });
        alertSections.push("");
      }
      
      if (watchlistAlerts.length > 0) {
        alertSections.push("👀 **Watchlist Items:**");
        watchlistAlerts.slice(0, 3).forEach(alert => {
          alertSections.push(`• **${alert.asset.toUpperCase()}**: ${alert.signal}`);
          alertSections.push(`  Monitor: ${alert.reason.split(':')[1] || alert.reason}`);
        });
        alertSections.push("");
      }
      
      // Add summary
      alertSections.push("📊 **Alert Summary:**");
      alertSections.push(`• Total Active: ${activeAlerts.length}`);
      alertSections.push(`• High Priority: ${immediateAlerts.length}`);
      alertSections.push(`• Medium Priority: ${upcomingAlerts.length}`);
      alertSections.push(`• Watchlist: ${watchlistAlerts.length}`);
      alertSections.push("");
      alertSections.push("Opportunities are seized, not wished for. Truth is verified through action.");
      
      const formattedAlerts = alertSections.join("\n");
      
      const response = {
        text: formattedAlerts,
        content: {
          text: formattedAlerts,
          action: "OPPORTUNITY_ALERTS",
          source: "alert_service",
          alertCount: activeAlerts.length,
          immediateCount: immediateAlerts.length,
          upcomingCount: upcomingAlerts.length,
          watchlistCount: watchlistAlerts.length,
          metrics: {
            totalAlerts: metrics.totalAlerts,
            successRate: metrics.accuracyRate
          },
          alerts: activeAlerts.map(alert => ({
            asset: alert.asset,
            signal: alert.signal,
            confidence: alert.confidence,
            type: alert.type,
            timeframe: alert.timeframe
          }))
        }
      };
      
      if (callback) {
        callback(response);
        return true;
      }
      
      return true;
    } catch (error) {
      const errorMessage = `Opportunity alerts check failed: ${(error as Error).message}`;
      
      const errorResponse = {
        text: errorMessage,
        content: {
          text: errorMessage,
          action: "OPPORTUNITY_ALERTS",
          source: "system",
          error: (error as Error).message
        }
      };
      
      if (callback) {
        callback(errorResponse);
        return true;
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "Check for opportunity alerts" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "🚨 **Active Opportunity Alerts**\n\n⚡ **Immediate Opportunities:**\n• **BITCOIN**: Institutional adoption signals detected\n  Confidence: 85% | Action: Monitor for entry opportunities\n  Reason: Bitcoin Thesis Momentum: Asset relevance: bitcoin, Keyword match: institutional\n\n📊 **Alert Summary:**\n• Total Active: 3\n• High Priority: 1\n• Medium Priority: 1\n• Watchlist: 1\n\nOpportunities are seized, not wished for. Truth is verified through action."
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Any opportunities right now?" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "🚨 **Active Opportunity Alerts**\n\n📅 **Upcoming Opportunities:**\n• **METAPLANET**: Japanese Bitcoin strategy validation signals\n  Timeframe: 6-12 months | Action: Assess position sizing\n\n👀 **Watchlist Items:**\n• **ETHEREUM**: Altcoin season momentum building\n  Monitor: Outperforming Bitcoin, Social sentiment shift\n\n📊 **Alert Summary:**\n• Total Active: 2\n• High Priority: 0\n• Medium Priority: 1\n• Watchlist: 1\n\nMarkets are patient. Preparation meets opportunity."
        }
      }
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "Show me the watchlist" }
      },
      {
        name: "{{agentName}}",
        content: {
          text: "No active opportunity alerts. Markets consolidating. Continue monitoring for entry signals."
        }
      }
    ]
  ]
};

export default opportunityAlertsAction; 