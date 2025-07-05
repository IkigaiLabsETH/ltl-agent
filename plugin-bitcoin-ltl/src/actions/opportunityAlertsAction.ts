import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { createActionTemplate, ValidationPatterns, ResponseCreators } from './base/ActionTemplate';
import { OpportunityAlertService } from '../services/OpportunityAlertService';
import { SchedulerService } from '../services/SchedulerService';

export const opportunityAlertsAction: Action = createActionTemplate({
  name: 'OPPORTUNITY_ALERTS',
  description: 'Monitor and report active market opportunity alerts, investment signals, and actionable insights across crypto, stocks, and alternative assets',
  similes: ['ALERTS', 'OPPORTUNITIES', 'INVESTMENT_ALERTS', 'MARKET_ALERTS', 'SIGNALS'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'Check for opportunity alerts' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Active Alerts: 3 opportunities. Immediate: Bitcoin institutional adoption signals detected, confidence 85%. Upcoming: MetaPlanet strategy validation signals, 6-12 month timeframe. Watchlist: Ethereum altcoin season momentum building. Opportunities are seized, not wished for.',
          thought: 'User is requesting current opportunity alerts. I need to check the alert service for active opportunities, categorize them by urgency (immediate, upcoming, watchlist), and present them with confidence levels and actionable insights for informed decision-making.',
          actions: ['OPPORTUNITY_ALERTS'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Any opportunities right now?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Current Opportunities: 2 active. Upcoming: MetaPlanet Japanese Bitcoin strategy validation, timeframe 6-12 months, position sizing assessment recommended. Watchlist: Ethereum outperforming Bitcoin, social sentiment shifting positive. Markets reward patience and preparation.',
          thought: 'User is asking about immediate opportunities. I should focus on the most actionable alerts, highlighting time-sensitive opportunities and providing context for decision-making while noting the importance of patience in market timing.',
          actions: ['OPPORTUNITY_ALERTS'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Show me the watchlist' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'No active opportunity alerts. Markets consolidating. Continue monitoring for entry signals. Patience is the companion of wisdom in markets.',
          thought: 'User is asking about watchlist items. Currently there are no active alerts, so I should communicate this clearly while reassuring them that monitoring systems are active and maintaining the disciplined approach of waiting for quality signals.',
          actions: ['OPPORTUNITY_ALERTS'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isOpportunityAlertsRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('Opportunity alerts action triggered');
    
    // Initial thought process
    const thoughtProcess = 'User is requesting opportunity alerts. I need to check the alert service for active market opportunities, categorize them by urgency and type, analyze confidence levels, and provide actionable insights for investment decisions while emphasizing proper risk management.';
    
    try {
      // Get the alert service
      const alertService = runtime.getService('opportunity-alert') as unknown as OpportunityAlertService;
      
      if (!alertService) {
        logger.warn('Opportunity alert service not available');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'OPPORTUNITY_ALERTS',
          'Alert service unavailable',
          'Opportunity alert service temporarily unavailable. The proactive intelligence system may still be initializing. Manual market monitoring continues. Stay vigilant for signals.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }
      
      // Get active alerts and metrics
      const activeAlerts = await alertService.getActiveAlerts();
      const metrics = await alertService.getMetrics();
      
      if (activeAlerts.length === 0) {
        logger.info('No active opportunity alerts');
        
        const noAlertsResponse = ResponseCreators.createStandardResponse(
          'Currently no active opportunity alerts detected. Markets are in consolidation phase, which is normal. I\'ll continue monitoring for quality entry signals and actionable opportunities.',
          'No active opportunity alerts. Markets consolidating. Continue monitoring for entry signals. Patience is the companion of wisdom in markets.',
          'OPPORTUNITY_ALERTS',
          {
            alertCount: 0,
            systemStatus: 'monitoring',
            lastCheck: new Date().toISOString()
          }
        );
        
        if (callback) {
          await callback(noAlertsResponse);
        }
        return true;
      }
      
      // Categorize alerts by type
      const immediateAlerts = activeAlerts.filter(alert => alert.type === 'immediate');
      const upcomingAlerts = activeAlerts.filter(alert => alert.type === 'upcoming');
      const watchlistAlerts = activeAlerts.filter(alert => alert.type === 'watchlist');
      
      // Format alerts for delivery
      const formattedAlerts = formatAlertsForDelivery(activeAlerts, immediateAlerts, upcomingAlerts, watchlistAlerts);
      
      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        formattedAlerts,
        'OPPORTUNITY_ALERTS',
        {
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
      );
      
      if (callback) {
        await callback(response);
      }
      
      logger.info('Opportunity alerts delivered successfully');
      return true;
      
    } catch (error) {
      logger.error('Failed to get opportunity alerts:', (error as Error).message);
      
      // Enhanced error handling with context-specific responses
      let errorMessage = 'Alert systems operational. Manual monitoring continues. Market vigilance maintained.';
      
      const errorMsg = (error as Error).message.toLowerCase();
      if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests')) {
        errorMessage = 'Alert data rate limited. Opportunity monitoring paused temporarily. Manual vigilance advised for immediate signals.';
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('fetch')) {
        errorMessage = 'Alert service connectivity issues. Local monitoring systems active. Continue manual market observation.';
      } else if (errorMsg.includes('service') || errorMsg.includes('unavailable')) {
        errorMessage = 'Alert processing service temporarily down. Opportunity monitoring continues via backup systems. Stay alert for signals.';
      }
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'OPPORTUNITY_ALERTS',
        (error as Error).message,
        errorMessage
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

/**
 * Format alerts for conversational delivery
 */
function formatAlertsForDelivery(
  activeAlerts: any[],
  immediateAlerts: any[],
  upcomingAlerts: any[],
  watchlistAlerts: any[]
): string {
  let response = `Active Alerts: ${activeAlerts.length} opportunities.`;
  
  // Add immediate alerts
  if (immediateAlerts.length > 0) {
    const alert = immediateAlerts[0];
    const confidencePercent = (alert.confidence * 100).toFixed(0);
    response += ` Immediate: ${alert.asset.toUpperCase()} ${alert.signal}, confidence ${confidencePercent}%.`;
  }
  
  // Add upcoming alerts
  if (upcomingAlerts.length > 0) {
    const alert = upcomingAlerts[0];
    response += ` Upcoming: ${alert.asset.toUpperCase()} ${alert.signal}, ${alert.timeframe} timeframe.`;
  }
  
  // Add watchlist alerts
  if (watchlistAlerts.length > 0) {
    const alert = watchlistAlerts[0];
    response += ` Watchlist: ${alert.asset.toUpperCase()} ${alert.signal}.`;
  }
  
  // Add philosophical note
  response += ' Opportunities are seized, not wished for.';
  
  return response;
}

export default opportunityAlertsAction; 