import { Service, logger, type IAgentRuntime } from '@elizaos/core';
import { ProcessedIntelligence } from './ContentIngestionService';
import { MorningBriefingService } from './MorningBriefingService';
import { KnowledgeDigestService } from './KnowledgeDigestService';
import { OpportunityAlertService } from './OpportunityAlertService';
import { PerformanceTrackingService } from './PerformanceTrackingService';
import { SlackIngestionService } from './SlackIngestionService';
import { LoggerWithContext, generateCorrelationId } from '../utils';

export interface ScheduleConfig {
  morningBriefing: {
    enabled: boolean;
    time: { hour: number; minute: number };
    timezone: string;
    frequency: 'daily' | 'weekdays' | 'custom';
    customDays?: number[]; // 0=Sunday, 1=Monday, etc.
  };
  knowledgeDigest: {
    enabled: boolean;
    time: { hour: number; minute: number };
    frequency: 'daily' | 'weekly' | 'custom';
    minimumContentThreshold: number; // minimum content items needed
  };
  opportunityAlerts: {
    enabled: boolean;
    realTimeMode: boolean;
    batchMode: boolean;
    batchInterval: number; // minutes
    priorityThreshold: 'low' | 'medium' | 'high';
  };
  performanceReports: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: { hour: number; minute: number };
    includePredictions: boolean;
    includeMetrics: boolean;
  };
  contentIngestion: {
    enabled: boolean;
    checkInterval: number; // minutes
    sources: ('slack' | 'twitter' | 'youtube' | 'news')[];
  };
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'morning-briefing' | 'knowledge-digest' | 'opportunity-alert' | 'performance-report' | 'content-check';
  scheduledAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  executedAt?: Date;
  completedAt?: Date;
  result?: ProcessedIntelligence;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SchedulerMetrics {
  totalTasksScheduled: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksRetried: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecutionTimes: { [taskType: string]: Date };
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export class SchedulerService extends Service {
  static serviceType = 'scheduler';
  capabilityDescription = 'Coordinates automated briefings, digests, and alerts across all services';
  
  private contextLogger: LoggerWithContext;
  private correlationId: string;
  private scheduleConfig: ScheduleConfig; // Renamed to avoid conflict with base Service class
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private metrics: SchedulerMetrics;
  private isRunning: boolean = false;

  constructor(runtime: IAgentRuntime) {
    super();
    this.correlationId = generateCorrelationId();
    this.contextLogger = new LoggerWithContext(this.correlationId, 'SchedulerService');
    this.scheduleConfig = this.getDefaultConfig();
    this.metrics = this.initializeMetrics();
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('SchedulerService starting...');
    const service = new SchedulerService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('SchedulerService stopping...');
    const service = runtime.getService('scheduler');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    this.contextLogger.info('SchedulerService initialized');
    await this.validateServiceDependencies();
    this.scheduleAllTasks();
    this.isRunning = true;
  }

  async stop() {
    this.isRunning = false;
    
    // Clear all active timers
    for (const [taskId, timer] of this.activeTimers.entries()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
    
    this.contextLogger.info('SchedulerService stopped');
  }

  private getDefaultConfig(): ScheduleConfig {
    return {
      morningBriefing: {
        enabled: true,
        time: { hour: 7, minute: 0 },
        timezone: 'America/New_York',
        frequency: 'daily'
      },
      knowledgeDigest: {
        enabled: true,
        time: { hour: 18, minute: 0 },
        frequency: 'daily',
        minimumContentThreshold: 5
      },
      opportunityAlerts: {
        enabled: true,
        realTimeMode: true,
        batchMode: false,
        batchInterval: 15,
        priorityThreshold: 'medium'
      },
      performanceReports: {
        enabled: true,
        frequency: 'weekly',
        time: { hour: 9, minute: 0 },
        includePredictions: true,
        includeMetrics: true
      },
      contentIngestion: {
        enabled: true,
        checkInterval: 5,
        sources: ['slack', 'twitter', 'youtube', 'news']
      }
    };
  }

  private initializeMetrics(): SchedulerMetrics {
    return {
      totalTasksScheduled: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksRetried: 0,
      averageExecutionTime: 0,
      successRate: 0,
      lastExecutionTimes: {},
      systemHealth: 'healthy'
    };
  }

  private async validateServiceDependencies(): Promise<void> {
    const requiredServices = [
      'morning-briefing',
      'knowledge-digest',
      'opportunity-alert',
      'performance-tracking',
      'slack-ingestion'
    ];

    const missingServices = [];
    
    for (const serviceName of requiredServices) {
      try {
        const service = (this as any).runtime?.getService(serviceName);
        if (!service) {
          missingServices.push(serviceName);
        }
      } catch (error) {
        missingServices.push(serviceName);
      }
    }

    if (missingServices.length > 0) {
      this.contextLogger.warn(`Missing dependencies: ${missingServices.join(', ')}`);
    } else {
      this.contextLogger.info('All service dependencies validated');
    }
  }

  private scheduleAllTasks(): void {
    if (this.scheduleConfig.morningBriefing.enabled) {
      this.scheduleMorningBriefing();
    }
    
    if (this.scheduleConfig.knowledgeDigest.enabled) {
      this.scheduleKnowledgeDigest();
    }
    
    if (this.scheduleConfig.opportunityAlerts.enabled && this.scheduleConfig.opportunityAlerts.batchMode) {
      this.scheduleOpportunityAlerts();
    }
    
    if (this.scheduleConfig.performanceReports.enabled) {
      this.schedulePerformanceReports();
    }
    
    if (this.scheduleConfig.contentIngestion.enabled) {
      this.scheduleContentIngestion();
    }

    this.contextLogger.info('All scheduled tasks initialized');
  }

  private scheduleMorningBriefing(): void {
    const scheduleNextBriefing = () => {
      if (!this.isRunning) return;

      const now = new Date();
      const next = new Date();
      const config = this.scheduleConfig.morningBriefing;
      
      next.setHours(config.time.hour, config.time.minute, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      // Check if we should skip weekends for weekdays-only mode
      if (config.frequency === 'weekdays') {
        while (next.getDay() === 0 || next.getDay() === 6) {
          next.setDate(next.getDate() + 1);
        }
      }
      
      const taskId = this.scheduleTask({
        name: 'Daily Morning Briefing',
        type: 'morning-briefing',
        scheduledAt: next
      });
      
      const msUntilNext = next.getTime() - now.getTime();
      const timer = setTimeout(async () => {
        await this.executeMorningBriefing(taskId);
        scheduleNextBriefing(); // Schedule the next one
      }, msUntilNext);
      
      this.activeTimers.set(taskId, timer);
      this.contextLogger.info(`Morning briefing scheduled for ${next.toLocaleString()}`);
    };

    scheduleNextBriefing();
  }

  private scheduleKnowledgeDigest(): void {
    const scheduleNextDigest = () => {
      if (!this.isRunning) return;

      const now = new Date();
      const next = new Date();
      const config = this.scheduleConfig.knowledgeDigest;
      
      next.setHours(config.time.hour, config.time.minute, 0, 0);
      
      if (next <= now) {
        if (config.frequency === 'daily') {
          next.setDate(next.getDate() + 1);
        } else if (config.frequency === 'weekly') {
          next.setDate(next.getDate() + 7);
        }
      }
      
      const taskId = this.scheduleTask({
        name: 'Knowledge Digest Generation',
        type: 'knowledge-digest',
        scheduledAt: next
      });
      
      const msUntilNext = next.getTime() - now.getTime();
      const timer = setTimeout(async () => {
        await this.executeKnowledgeDigest(taskId);
        scheduleNextDigest(); // Schedule the next one
      }, msUntilNext);
      
      this.activeTimers.set(taskId, timer);
      this.contextLogger.info(`Knowledge digest scheduled for ${next.toLocaleString()}`);
    };

    scheduleNextDigest();
  }

  private scheduleOpportunityAlerts(): void {
    if (!this.scheduleConfig.opportunityAlerts.batchMode) return;

    const scheduleNextCheck = () => {
      if (!this.isRunning) return;

      const intervalMs = this.scheduleConfig.opportunityAlerts.batchInterval * 60 * 1000;
      const next = new Date(Date.now() + intervalMs);
      
      const taskId = this.scheduleTask({
        name: 'Opportunity Alert Check',
        type: 'opportunity-alert',
        scheduledAt: next
      });
      
      const timer = setTimeout(async () => {
        await this.executeOpportunityAlertCheck(taskId);
        scheduleNextCheck(); // Schedule the next one
      }, intervalMs);
      
      this.activeTimers.set(taskId, timer);
    };

    scheduleNextCheck();
  }

  private schedulePerformanceReports(): void {
    const scheduleNextReport = () => {
      if (!this.isRunning) return;

      const now = new Date();
      const next = new Date();
      const config = this.scheduleConfig.performanceReports;
      
      next.setHours(config.time.hour, config.time.minute, 0, 0);
      
      if (next <= now) {
        switch (config.frequency) {
          case 'daily':
            next.setDate(next.getDate() + 1);
            break;
          case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
          case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        }
      }
      
      const taskId = this.scheduleTask({
        name: 'Performance Report Generation',
        type: 'performance-report',
        scheduledAt: next
      });
      
      const msUntilNext = next.getTime() - now.getTime();
      const timer = setTimeout(async () => {
        await this.executePerformanceReport(taskId);
        scheduleNextReport(); // Schedule the next one
      }, msUntilNext);
      
      this.activeTimers.set(taskId, timer);
      this.contextLogger.info(`Performance report scheduled for ${next.toLocaleString()}`);
    };

    scheduleNextReport();
  }

  private scheduleContentIngestion(): void {
    const scheduleNextCheck = () => {
      if (!this.isRunning) return;

      const intervalMs = this.scheduleConfig.contentIngestion.checkInterval * 60 * 1000;
      const next = new Date(Date.now() + intervalMs);
      
      const taskId = this.scheduleTask({
        name: 'Content Ingestion Check',
        type: 'content-check',
        scheduledAt: next
      });
      
      const timer = setTimeout(async () => {
        await this.executeContentIngestionCheck(taskId);
        scheduleNextCheck(); // Schedule the next one
      }, intervalMs);
      
      this.activeTimers.set(taskId, timer);
    };

    scheduleNextCheck();
  }

  private scheduleTask(taskData: Omit<ScheduledTask, 'id' | 'status' | 'retryCount' | 'maxRetries'>): string {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const task: ScheduledTask = {
      id: taskId,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      ...taskData
    };
    
    this.scheduledTasks.set(taskId, task);
    this.metrics.totalTasksScheduled++;
    
    return taskId;
  }

  private async executeMorningBriefing(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTaskStatus(taskId, 'running');
      
      // Get the morning briefing service and generate briefing
      const briefingService = (this as any).runtime?.getService('morning-briefing') as MorningBriefingService;
      if (briefingService) {
        const briefing = await briefingService.generateOnDemandBriefing();
        await this.updateTaskStatus(taskId, 'completed', briefing);
        
        this.contextLogger.info('Morning briefing generated successfully');
      } else {
        throw new Error('Morning briefing service not available');
      }
    } catch (error) {
      await this.handleTaskError(taskId, error as Error);
    }
  }

  private async executeKnowledgeDigest(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTaskStatus(taskId, 'running');
      
      const digestService = (this as any).runtime?.getService('knowledge-digest') as KnowledgeDigestService;
      if (digestService) {
        const digest = await digestService.generateDailyDigest();
        const intelligence = await digestService.formatDigestForDelivery(digest);
        await this.updateTaskStatus(taskId, 'completed', intelligence);
        
        this.contextLogger.info('Knowledge digest generated successfully');
      } else {
        throw new Error('Knowledge digest service not available');
      }
    } catch (error) {
      await this.handleTaskError(taskId, error as Error);
    }
  }

  private async executeOpportunityAlertCheck(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTaskStatus(taskId, 'running');
      
      const alertService = (this as any).runtime?.getService('opportunity-alert') as OpportunityAlertService;
      if (alertService) {
        const activeAlerts = await alertService.getActiveAlerts();
        
        if (activeAlerts.length > 0) {
          const intelligence = await alertService.formatAlertsForDelivery(activeAlerts);
          await this.updateTaskStatus(taskId, 'completed', intelligence);
          
          this.contextLogger.info(`Processed ${activeAlerts.length} opportunity alerts`);
        } else {
          await this.updateTaskStatus(taskId, 'completed');
          this.contextLogger.info('No active alerts to process');
        }
      } else {
        throw new Error('Opportunity alert service not available');
      }
    } catch (error) {
      await this.handleTaskError(taskId, error as Error);
    }
  }

  private async executePerformanceReport(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTaskStatus(taskId, 'running');
      
      const performanceService = (this as any).runtime?.getService('performance-tracking') as PerformanceTrackingService;
      if (performanceService) {
        const intelligence = await performanceService.formatPerformanceForDelivery();
        await this.updateTaskStatus(taskId, 'completed', intelligence);
        
        this.contextLogger.info('Performance report generated successfully');
      } else {
        throw new Error('Performance tracking service not available');
      }
    } catch (error) {
      await this.handleTaskError(taskId, error as Error);
    }
  }

  private async executeContentIngestionCheck(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTaskStatus(taskId, 'running');
      
      const slackService = (this as any).runtime?.getService('slack-ingestion') as SlackIngestionService;
      if (slackService) {
        await slackService.checkForNewContent();
        await this.updateTaskStatus(taskId, 'completed');
        
        this.contextLogger.info('Content ingestion check completed');
      } else {
        await this.updateTaskStatus(taskId, 'completed');
        this.contextLogger.info('Content ingestion services not available');
      }
    } catch (error) {
      await this.handleTaskError(taskId, error as Error);
    }
  }

  private async updateTaskStatus(
    taskId: string, 
    status: ScheduledTask['status'], 
    result?: ProcessedIntelligence
  ): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    task.status = status;
    
    if (status === 'running' && !task.executedAt) {
      task.executedAt = new Date();
    }
    
    if (status === 'completed') {
      task.completedAt = new Date();
      task.result = result;
      this.metrics.tasksCompleted++;
      this.metrics.lastExecutionTimes[task.type] = new Date();
    }

    this.scheduledTasks.set(taskId, task);
    this.updateMetrics();
  }

  private async handleTaskError(taskId: string, error: Error): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    task.retryCount++;
    task.error = error.message;
    
    this.contextLogger.error(`Task ${task.name} failed (attempt ${task.retryCount}):`, error.message);
    
    if (task.retryCount < task.maxRetries) {
      // Retry after exponential backoff
      const retryDelay = Math.pow(2, task.retryCount) * 1000; // 2s, 4s, 8s...
      
      setTimeout(async () => {
        switch (task.type) {
          case 'morning-briefing':
            await this.executeMorningBriefing(taskId);
            break;
          case 'knowledge-digest':
            await this.executeKnowledgeDigest(taskId);
            break;
          case 'opportunity-alert':
            await this.executeOpportunityAlertCheck(taskId);
            break;
          case 'performance-report':
            await this.executePerformanceReport(taskId);
            break;
          case 'content-check':
            await this.executeContentIngestionCheck(taskId);
            break;
        }
      }, retryDelay);
      
      this.metrics.tasksRetried++;
    } else {
      task.status = 'failed';
      this.metrics.tasksFailed++;
      this.contextLogger.error(`Task ${task.name} failed permanently after ${task.maxRetries} attempts`);
    }
    
    this.scheduledTasks.set(taskId, task);
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const total = this.metrics.tasksCompleted + this.metrics.tasksFailed;
    this.metrics.successRate = total > 0 ? this.metrics.tasksCompleted / total : 0;
    
    // Determine system health
    if (this.metrics.successRate >= 0.95) {
      this.metrics.systemHealth = 'healthy';
    } else if (this.metrics.successRate >= 0.85) {
      this.metrics.systemHealth = 'degraded';
    } else {
      this.metrics.systemHealth = 'critical';
    }
  }

  async updateConfig(newConfig: Partial<ScheduleConfig>): Promise<void> {
    this.scheduleConfig = { ...this.scheduleConfig, ...newConfig };
    
    // Clear existing timers and reschedule
    for (const [taskId, timer] of this.activeTimers.entries()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
    
    // Reschedule with new config
    this.scheduleAllTasks();
    
    this.contextLogger.info('Scheduler configuration updated and tasks rescheduled');
  }

  async getConfig(): Promise<ScheduleConfig> {
    return { ...this.scheduleConfig };
  }

  async getMetrics(): Promise<SchedulerMetrics> {
    return { ...this.metrics };
  }

  async getScheduledTasks(): Promise<ScheduledTask[]> {
    return Array.from(this.scheduledTasks.values())
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
  }

  async getTaskHistory(limit: number = 50): Promise<ScheduledTask[]> {
    return Array.from(this.scheduledTasks.values())
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .sort((a, b) => (b.completedAt || b.executedAt || new Date()).getTime() - 
                     (a.completedAt || a.executedAt || new Date()).getTime())
      .slice(0, limit);
  }

  async triggerManualBriefing(): Promise<ProcessedIntelligence | null> {
    try {
      const taskId = this.scheduleTask({
        name: 'Manual Morning Briefing',
        type: 'morning-briefing',
        scheduledAt: new Date()
      });
      
      await this.executeMorningBriefing(taskId);
      
      const task = this.scheduledTasks.get(taskId);
      return task?.result || null;
    } catch (error) {
      this.contextLogger.error('Failed to trigger manual briefing:', (error as Error).message);
      return null;
    }
  }

  async triggerManualDigest(): Promise<ProcessedIntelligence | null> {
    try {
      const taskId = this.scheduleTask({
        name: 'Manual Knowledge Digest',
        type: 'knowledge-digest',
        scheduledAt: new Date()
      });
      
      await this.executeKnowledgeDigest(taskId);
      
      const task = this.scheduledTasks.get(taskId);
      return task?.result || null;
    } catch (error) {
      this.contextLogger.error('Failed to trigger manual digest:', (error as Error).message);
      return null;
    }
  }
}

export default SchedulerService; 