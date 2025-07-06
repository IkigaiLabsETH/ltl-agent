import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId } from '../utils/helpers';
import { handleError, ErrorCategory } from '../utils/comprehensive-error-handling';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

/**
 * Alert categories
 */
export type AlertCategory = 
  | 'price_movement'
  | 'volume_spike'
  | 'technical_breakout'
  | 'sentiment_change'
  | 'onchain_activity'
  | 'market_opportunity'
  | 'risk_alert'
  | 'system_status';

/**
 * Alert condition types
 */
export type AlertCondition = 
  | 'price_above'
  | 'price_below'
  | 'price_change_percent'
  | 'volume_above'
  | 'volume_change_percent'
  | 'rsi_oversold'
  | 'rsi_overbought'
  | 'macd_crossover'
  | 'bollinger_breakout'
  | 'support_resistance_break'
  | 'sentiment_threshold'
  | 'onchain_metric_threshold';

/**
 * Alert rule interface
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  condition: AlertCondition;
  parameters: Record<string, any>;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // seconds
  lastTriggered?: number;
  notificationChannels: string[];
  customMessage?: string;
  metadata?: {
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    triggerCount: number;
  };
}

/**
 * Alert instance interface
 */
export interface AlertInstance {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: number;
  data: {
    currentValue: any;
    threshold: any;
    change?: any;
    context?: any;
  };
  metadata: {
    correlationId: string;
    source: string;
    confidence: number;
    actionable: boolean;
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
}

/**
 * Notification channel interface
 */
export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  rateLimit: {
    maxPerHour: number;
    maxPerDay: number;
    currentHour: number;
    currentDay: number;
    lastReset: number;
  };
}

/**
 * Alert template interface
 */
export interface AlertTemplate {
  id: string;
  name: string;
  category: AlertCategory;
  severity: AlertSeverity;
  titleTemplate: string;
  messageTemplate: string;
  variables: string[];
  defaultParameters: Record<string, any>;
}

/**
 * Alert statistics
 */
export interface AlertStats {
  totalRules: number;
  activeRules: number;
  totalAlerts: number;
  alertsToday: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByCategory: Record<AlertCategory, number>;
  averageResponseTime: number;
  resolutionRate: number;
}

/**
 * Advanced Alerting Service
 * Provides intelligent alerts for Bitcoin market conditions and opportunities
 */
export class AdvancedAlertingService extends BaseDataService {
  static serviceType = 'advanced-alerting';
  
  private contextLogger: LoggerWithContext;
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, AlertInstance> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, AlertTemplate> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats: {
    totalAlerts: number;
    alertsToday: number;
    startTime: number;
  };

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'bitcoinData');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'AdvancedAlerting');
    this.stats = {
      totalAlerts: 0,
      alertsToday: 0,
      startTime: Date.now()
    };
  }

  public get capabilityDescription(): string {
    return 'Advanced intelligent alerting system for Bitcoin market conditions, price movements, and trading opportunities';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('Starting AdvancedAlertingService...');
    return new AdvancedAlertingService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('Stopping AdvancedAlertingService...');
    const service = runtime.getService('advanced-alerting') as AdvancedAlertingService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info('AdvancedAlertingService starting...');
    await this.initializeDefaultRules();
    await this.initializeDefaultChannels();
    await this.initializeDefaultTemplates();
    this.startEvaluationLoop();
    this.startCleanupLoop();
  }

  async init() {
    this.contextLogger.info('AdvancedAlertingService initialized');
  }

  async stop() {
    this.contextLogger.info('AdvancedAlertingService stopping...');
    this.stopEvaluationLoop();
    this.stopCleanupLoop();
  }

  /**
   * Initialize default alert rules
   */
  private async initializeDefaultRules(): Promise<void> {
    try {
      const defaultRules: AlertRule[] = [
        {
          id: 'price_drop_10_percent',
          name: 'Bitcoin Price Drop > 10%',
          description: 'Alert when Bitcoin price drops more than 10% in 24 hours',
          category: 'price_movement',
          condition: 'price_change_percent',
          parameters: { threshold: -10, timeframe: '24h' },
          severity: 'critical',
          enabled: true,
          cooldown: 3600, // 1 hour
          notificationChannels: ['email', 'slack'],
          customMessage: 'Bitcoin has dropped significantly. Consider reviewing your position.',
          metadata: {
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0
          }
        },
        {
          id: 'price_surge_15_percent',
          name: 'Bitcoin Price Surge > 15%',
          description: 'Alert when Bitcoin price increases more than 15% in 24 hours',
          category: 'price_movement',
          condition: 'price_change_percent',
          parameters: { threshold: 15, timeframe: '24h' },
          severity: 'warning',
          enabled: true,
          cooldown: 3600,
          notificationChannels: ['slack'],
          metadata: {
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0
          }
        },
        {
          id: 'volume_spike_200_percent',
          name: 'Volume Spike > 200%',
          description: 'Alert when trading volume increases more than 200%',
          category: 'volume_spike',
          condition: 'volume_change_percent',
          parameters: { threshold: 200, timeframe: '1h' },
          severity: 'warning',
          enabled: true,
          cooldown: 1800, // 30 minutes
          notificationChannels: ['slack'],
          metadata: {
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0
          }
        },
        {
          id: 'rsi_oversold',
          name: 'RSI Oversold (< 30)',
          description: 'Alert when RSI goes below 30 indicating oversold conditions',
          category: 'technical_breakout',
          condition: 'rsi_oversold',
          parameters: { threshold: 30 },
          severity: 'info',
          enabled: true,
          cooldown: 7200, // 2 hours
          notificationChannels: ['slack'],
          metadata: {
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0
          }
        },
        {
          id: 'rsi_overbought',
          name: 'RSI Overbought (> 70)',
          description: 'Alert when RSI goes above 70 indicating overbought conditions',
          category: 'technical_breakout',
          condition: 'rsi_overbought',
          parameters: { threshold: 70 },
          severity: 'info',
          enabled: true,
          cooldown: 7200,
          notificationChannels: ['slack'],
          metadata: {
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0
          }
        },
        {
          id: 'sentiment_bearish',
          name: 'Bearish Sentiment',
          description: 'Alert when sentiment becomes significantly bearish',
          category: 'sentiment_change',
          condition: 'sentiment_threshold',
          parameters: { threshold: 0.3, direction: 'below' },
          severity: 'warning',
          enabled: true,
          cooldown: 3600,
          notificationChannels: ['slack'],
          metadata: {
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            triggerCount: 0
          }
        }
      ];

      for (const rule of defaultRules) {
        this.rules.set(rule.id, rule);
      }

      this.contextLogger.info('Default alert rules initialized', {
        count: defaultRules.length
      });
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Failed to initialize default rules'),
        {
          correlationId: this.correlationId,
          component: 'AdvancedAlertingService',
          operation: 'initializeDefaultRules'
        }
      );
      
      this.contextLogger.error('Failed to initialize default rules', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Initialize default notification channels
   */
  private async initializeDefaultChannels(): Promise<void> {
    try {
      const defaultChannels: NotificationChannel[] = [
        {
          id: 'email',
          type: 'email',
          name: 'Email Notifications',
          config: {
            smtp: {
              host: this.getSetting('ALERT_EMAIL_HOST', 'smtp.gmail.com'),
              port: parseInt(this.getSetting('ALERT_EMAIL_PORT', '587')),
              secure: this.getSetting('ALERT_EMAIL_SECURE', 'true') === 'true',
              auth: {
                user: this.getSetting('ALERT_EMAIL_USER', ''),
                pass: this.getSetting('ALERT_EMAIL_PASS', '')
              }
            },
            recipients: this.getSetting('ALERT_EMAIL_RECIPIENTS', '').split(',').filter(Boolean)
          },
          enabled: this.getSetting('ALERT_EMAIL_ENABLED', 'false') === 'true',
          rateLimit: {
            maxPerHour: 10,
            maxPerDay: 100,
            currentHour: 0,
            currentDay: 0,
            lastReset: Date.now()
          }
        },
        {
          id: 'slack',
          type: 'webhook',
          name: 'Slack Notifications',
          config: {
            webhookUrl: this.getSetting('ALERT_SLACK_WEBHOOK', ''),
            channel: this.getSetting('ALERT_SLACK_CHANNEL', '#alerts'),
            username: this.getSetting('ALERT_SLACK_USERNAME', 'Bitcoin Alert Bot')
          },
          enabled: this.getSetting('ALERT_SLACK_ENABLED', 'false') === 'true',
          rateLimit: {
            maxPerHour: 20,
            maxPerDay: 200,
            currentHour: 0,
            currentDay: 0,
            lastReset: Date.now()
          }
        }
      ];

      for (const channel of defaultChannels) {
        this.channels.set(channel.id, channel);
      }

      this.contextLogger.info('Default notification channels initialized', {
        count: defaultChannels.length
      });
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Failed to initialize default channels'),
        {
          correlationId: this.correlationId,
          component: 'AdvancedAlertingService',
          operation: 'initializeDefaultChannels'
        }
      );
      
      this.contextLogger.error('Failed to initialize default channels', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Initialize default alert templates
   */
  private async initializeDefaultTemplates(): Promise<void> {
    try {
      const defaultTemplates: AlertTemplate[] = [
        {
          id: 'price_movement_template',
          name: 'Price Movement Template',
          category: 'price_movement',
          severity: 'warning',
          titleTemplate: 'Bitcoin Price {{direction}} Alert',
          messageTemplate: 'Bitcoin price has {{direction}} by {{change}}% to ${{price}}. This represents a {{magnitude}} movement.',
          variables: ['direction', 'change', 'price', 'magnitude'],
          defaultParameters: {}
        },
        {
          id: 'volume_spike_template',
          name: 'Volume Spike Template',
          category: 'volume_spike',
          severity: 'info',
          titleTemplate: 'High Volume Activity Detected',
          messageTemplate: 'Trading volume has increased by {{change}}% to {{volume}}. This may indicate increased market activity.',
          variables: ['change', 'volume'],
          defaultParameters: {}
        },
        {
          id: 'technical_breakout_template',
          name: 'Technical Breakout Template',
          category: 'technical_breakout',
          severity: 'warning',
          titleTemplate: 'Technical Indicator Alert: {{indicator}}',
          messageTemplate: '{{indicator}} has reached {{value}}, indicating {{condition}} conditions.',
          variables: ['indicator', 'value', 'condition'],
          defaultParameters: {}
        }
      ];

      for (const template of defaultTemplates) {
        this.templates.set(template.id, template);
      }

      this.contextLogger.info('Default alert templates initialized', {
        count: defaultTemplates.length
      });
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Failed to initialize default templates'),
        {
          correlationId: this.correlationId,
          component: 'AdvancedAlertingService',
          operation: 'initializeDefaultTemplates'
        }
      );
      
      this.contextLogger.error('Failed to initialize default templates', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start evaluation loop
   */
  private startEvaluationLoop(): void {
    this.evaluationInterval = setInterval(() => {
      this.evaluateAlertRules();
    }, 30000); // Evaluate every 30 seconds

    this.contextLogger.info('Alert evaluation loop started');
  }

  /**
   * Stop evaluation loop
   */
  private stopEvaluationLoop(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
    this.contextLogger.info('Alert evaluation loop stopped');
  }

  /**
   * Start cleanup loop
   */
  private startCleanupLoop(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredAlerts();
    }, 300000); // Cleanup every 5 minutes

    this.contextLogger.info('Alert cleanup loop started');
  }

  /**
   * Stop cleanup loop
   */
  private stopCleanupLoop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.contextLogger.info('Alert cleanup loop stopped');
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateAlertRules(): Promise<void> {
    try {
      const currentData = await this.getCurrentMarketData();
      
      for (const [ruleId, rule] of this.rules) {
        if (!rule.enabled) {
          continue;
        }

        // Check cooldown
        if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldown * 1000) {
          continue;
        }

        // Evaluate rule condition
        const shouldTrigger = await this.evaluateCondition(rule.condition, rule.parameters, currentData);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule, currentData);
        }
      }
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Alert rule evaluation failed'),
        {
          correlationId: this.correlationId,
          component: 'AdvancedAlertingService',
          operation: 'evaluateAlertRules'
        }
      );
      
      this.contextLogger.error('Failed to evaluate alert rules', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Evaluate a specific condition
   */
  private async evaluateCondition(
    condition: AlertCondition, 
    parameters: Record<string, any>, 
    data: any
  ): Promise<boolean> {
    try {
      switch (condition) {
        case 'price_above':
          return data.price > parameters.threshold;
        
        case 'price_below':
          return data.price < parameters.threshold;
        
        case 'price_change_percent':
          const change = ((data.price - data.price24h) / data.price24h) * 100;
          return Math.abs(change) > Math.abs(parameters.threshold);
        
        case 'volume_above':
          return data.volume > parameters.threshold;
        
        case 'volume_change_percent':
          const volumeChange = ((data.volume - data.volume24h) / data.volume24h) * 100;
          return volumeChange > parameters.threshold;
        
        case 'rsi_oversold':
          return data.rsi < parameters.threshold;
        
        case 'rsi_overbought':
          return data.rsi > parameters.threshold;
        
        case 'sentiment_threshold':
          if (parameters.direction === 'below') {
            return data.sentiment < parameters.threshold;
          } else {
            return data.sentiment > parameters.threshold;
          }
        
        default:
          return false;
      }
    } catch (error) {
      this.contextLogger.error('Failed to evaluate condition', {
        condition,
        parameters,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, data: any): Promise<void> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create alert instance
      const alert: AlertInstance = {
        id: alertId,
        ruleId: rule.id,
        severity: rule.severity,
        category: rule.category,
        title: this.generateAlertTitle(rule, data),
        message: this.generateAlertMessage(rule, data),
        timestamp: Date.now(),
        data: {
          currentValue: this.getCurrentValue(rule.condition, data),
          threshold: this.getThreshold(rule.condition, rule.parameters),
          change: this.getChange(rule.condition, data),
          context: this.getContext(rule.condition, data)
        },
        metadata: {
          correlationId: this.correlationId,
          source: 'market_data',
          confidence: this.calculateConfidence(rule.condition, data),
          actionable: this.isActionable(rule.category)
        },
        status: 'active'
      };

      // Store alert
      this.alerts.set(alertId, alert);
      
      // Update statistics
      this.stats.totalAlerts++;
      this.stats.alertsToday++;
      
      // Update rule metadata
      rule.lastTriggered = Date.now();
      rule.metadata!.triggerCount++;
      rule.metadata!.updatedAt = Date.now();

      // Send notifications
      await this.sendNotifications(alert, rule);

      this.contextLogger.info('Alert triggered', {
        alertId,
        ruleId: rule.id,
        severity: rule.severity,
        category: rule.category
      });
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Alert triggering failed'),
        {
          correlationId: this.correlationId,
          component: 'AdvancedAlertingService',
          operation: 'triggerAlert',
          params: { ruleId: rule.id }
        }
      );
      
      this.contextLogger.error('Failed to trigger alert', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: AlertInstance, rule: AlertRule): Promise<void> {
    try {
      for (const channelId of rule.notificationChannels) {
        const channel = this.channels.get(channelId);
        if (!channel || !channel.enabled) {
          continue;
        }

        // Check rate limits
        if (!this.checkRateLimit(channel)) {
          this.contextLogger.warn('Rate limit exceeded for channel', {
            channelId,
            alertId: alert.id
          });
          continue;
        }

        // Send notification
        await this.sendNotification(channel, alert);
        
        // Update rate limit counters
        this.updateRateLimit(channel);
      }
    } catch (error) {
      this.contextLogger.error('Failed to send notifications', {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send notification through a specific channel
   */
  private async sendNotification(channel: NotificationChannel, alert: AlertInstance): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel, alert);
          break;
        
        case 'webhook':
          await this.sendWebhookNotification(channel, alert);
          break;
        
        default:
          this.contextLogger.warn('Unsupported notification channel type', {
            channelId: channel.id,
            type: channel.type
          });
      }
    } catch (error) {
      this.contextLogger.error('Failed to send notification', {
        channelId: channel.id,
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: NotificationChannel, alert: AlertInstance): Promise<void> {
    // In a real implementation, this would use a proper email library
    this.contextLogger.info('Email notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      recipients: channel.config.recipients
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: NotificationChannel, alert: AlertInstance): Promise<void> {
    // In a real implementation, this would make an HTTP POST request
    this.contextLogger.info('Webhook notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      webhookUrl: channel.config.webhookUrl
    });
  }

  /**
   * Check rate limit for a channel
   */
  private checkRateLimit(channel: NotificationChannel): boolean {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    // Reset counters if needed
    if (now - channel.rateLimit.lastReset > 86400000) {
      channel.rateLimit.currentHour = 0;
      channel.rateLimit.currentDay = 0;
      channel.rateLimit.lastReset = now;
    }

    return channel.rateLimit.currentHour < channel.rateLimit.maxPerHour &&
           channel.rateLimit.currentDay < channel.rateLimit.maxPerDay;
  }

  /**
   * Update rate limit counters
   */
  private updateRateLimit(channel: NotificationChannel): void {
    channel.rateLimit.currentHour++;
    channel.rateLimit.currentDay++;
  }

  /**
   * Cleanup expired alerts
   */
  private cleanupExpiredAlerts(): void {
    const now = Date.now();
    const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiredAlerts: string[] = [];

    for (const [alertId, alert] of this.alerts) {
      if (now - alert.timestamp > expirationTime) {
        expiredAlerts.push(alertId);
      }
    }

    for (const alertId of expiredAlerts) {
      this.alerts.delete(alertId);
    }

    if (expiredAlerts.length > 0) {
      this.contextLogger.info('Cleaned up expired alerts', {
        count: expiredAlerts.length
      });
    }
  }

  /**
   * Utility methods for alert generation
   */
  private generateAlertTitle(rule: AlertRule, data: any): string {
    if (rule.customMessage) {
      return rule.customMessage;
    }

    const template = this.templates.get(`${rule.category}_template`);
    if (template) {
      return this.interpolateTemplate(template.titleTemplate, this.getTemplateVariables(rule, data));
    }

    return `${rule.name} - ${rule.category}`;
  }

  private generateAlertMessage(rule: AlertRule, data: any): string {
    const template = this.templates.get(`${rule.category}_template`);
    if (template) {
      return this.interpolateTemplate(template.messageTemplate, this.getTemplateVariables(rule, data));
    }

    return rule.description;
  }

  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private getTemplateVariables(rule: AlertRule, data: any): Record<string, any> {
    const variables: Record<string, any> = {
      price: data.price?.toFixed(2),
      volume: this.formatVolume(data.volume),
      change: this.getChange(rule.condition, data),
      direction: this.getDirection(rule.condition, data),
      magnitude: this.getMagnitude(rule.condition, data),
      indicator: this.getIndicator(rule.condition),
      value: this.getCurrentValue(rule.condition, data),
      condition: this.getCondition(rule.condition, data)
    };

    return variables;
  }

  private getCurrentValue(condition: AlertCondition, data: any): any {
    switch (condition) {
      case 'price_above':
      case 'price_below':
      case 'price_change_percent':
        return data.price;
      case 'volume_above':
      case 'volume_change_percent':
        return data.volume;
      case 'rsi_oversold':
      case 'rsi_overbought':
        return data.rsi;
      case 'sentiment_threshold':
        return data.sentiment;
      default:
        return null;
    }
  }

  private getThreshold(condition: AlertCondition, parameters: Record<string, any>): any {
    return parameters.threshold;
  }

  private getChange(condition: AlertCondition, data: any): any {
    switch (condition) {
      case 'price_change_percent':
        return ((data.price - data.price24h) / data.price24h * 100).toFixed(2);
      case 'volume_change_percent':
        return ((data.volume - data.volume24h) / data.volume24h * 100).toFixed(2);
      default:
        return null;
    }
  }

  private getDirection(condition: AlertCondition, data: any): string {
    switch (condition) {
      case 'price_change_percent':
        return data.price > data.price24h ? 'increased' : 'decreased';
      default:
        return 'changed';
    }
  }

  private getMagnitude(condition: AlertCondition, data: any): string {
    const change = Math.abs(this.getChange(condition, data));
    if (change > 20) return 'major';
    if (change > 10) return 'significant';
    if (change > 5) return 'moderate';
    return 'minor';
  }

  private getIndicator(condition: AlertCondition): string {
    switch (condition) {
      case 'rsi_oversold':
      case 'rsi_overbought':
        return 'RSI';
      case 'macd_crossover':
        return 'MACD';
      case 'bollinger_breakout':
        return 'Bollinger Bands';
      default:
        return 'Technical Indicator';
    }
  }

  private getCondition(condition: AlertCondition, data: any): string {
    switch (condition) {
      case 'rsi_oversold':
        return 'oversold';
      case 'rsi_overbought':
        return 'overbought';
      default:
        return 'alert';
    }
  }

  private getContext(condition: AlertCondition, data: any): any {
    return {
      marketCap: data.marketCap,
      dominance: data.dominance,
      timestamp: data.timestamp
    };
  }

  private calculateConfidence(condition: AlertCondition, data: any): number {
    // Mock confidence calculation
    return Math.random() * 0.3 + 0.7; // 0.7 to 1.0
  }

  private isActionable(category: AlertCategory): boolean {
    return ['price_movement', 'technical_breakout', 'market_opportunity'].includes(category);
  }

  private formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(2)}B`;
    }
    if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(2)}M`;
    }
    if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(2)}K`;
    }
    return volume.toFixed(2);
  }

  /**
   * Get current market data
   */
  private async getCurrentMarketData(): Promise<any> {
    try {
      // In a real implementation, this would fetch from various data sources
      return {
        price: 50000 + Math.random() * 10000,
        price24h: 50000,
        volume: 1000000000 + Math.random() * 500000000,
        volume24h: 1000000000,
        rsi: 30 + Math.random() * 40,
        sentiment: Math.random(),
        marketCap: 1000000000000,
        dominance: 50 + Math.random() * 10,
        timestamp: Date.now()
      };
    } catch (error) {
      this.contextLogger.error('Failed to get current market data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Public API methods
   */
  
  /**
   * Create a new alert rule
   */
  createRule(rule: Omit<AlertRule, 'id' | 'metadata'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdBy: 'user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        triggerCount: 0
      }
    };

    this.rules.set(newRule.id, newRule);
    this.contextLogger.info('Alert rule created', { ruleId: newRule.id });
    return newRule;
  }

  /**
   * Update an alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): AlertRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return null;
    }

    const updatedRule = { ...rule, ...updates };
    updatedRule.metadata!.updatedAt = Date.now();
    
    this.rules.set(ruleId, updatedRule);
    this.contextLogger.info('Alert rule updated', { ruleId });
    return updatedRule;
  }

  /**
   * Delete an alert rule
   */
  deleteRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.contextLogger.info('Alert rule deleted', { ruleId });
    }
    return deleted;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): AlertInstance | null {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    this.contextLogger.info('Alert acknowledged', { alertId, acknowledgedBy });
    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): AlertInstance | null {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return null;
    }

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();

    this.contextLogger.info('Alert resolved', { alertId });
    return alert;
  }

  /**
   * Get all alert rules
   */
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): AlertInstance[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts by status
   */
  getAlertsByStatus(status: AlertInstance['status']): AlertInstance[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === status);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): AlertInstance[] {
    return Array.from(this.alerts.values()).filter(alert => alert.severity === severity);
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());
    const alertsBySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
      emergency: 0
    };
    const alertsByCategory: Record<AlertCategory, number> = {
      price_movement: 0,
      volume_spike: 0,
      technical_breakout: 0,
      sentiment_change: 0,
      onchain_activity: 0,
      market_opportunity: 0,
      risk_alert: 0,
      system_status: 0
    };

    for (const alert of alerts) {
      alertsBySeverity[alert.severity]++;
      alertsByCategory[alert.category]++;
    }

    const activeRules = Array.from(this.rules.values()).filter(rule => rule.enabled);

    return {
      totalRules: this.rules.size,
      activeRules: activeRules.length,
      totalAlerts: this.stats.totalAlerts,
      alertsToday: this.stats.alertsToday,
      alertsBySeverity,
      alertsByCategory,
      averageResponseTime: 0, // Would need to be calculated from actual data
      resolutionRate: 0 // Would need to be calculated from actual data
    };
  }

  async updateData(): Promise<void> {
    // Trigger evaluation of alert rules
    await this.evaluateAlertRules();
  }

  async forceUpdate(): Promise<any> {
    return {
      rules: this.getAllRules(),
      alerts: this.getAllAlerts(),
      stats: this.getStats(),
      channels: Array.from(this.channels.values()),
      templates: Array.from(this.templates.values())
    };
  }
} 