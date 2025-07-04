import { logger, type IAgentRuntime } from '@elizaos/core';
import { ContentIngestionService, ContentItem } from './ContentIngestionService';
import { ElizaOSErrorHandler } from '../utils';

export interface SlackChannelConfig {
  channelId: string;
  channelName: string;
  type: 'research' | 'tweets' | 'alerts' | 'general';
  priority: 'high' | 'medium' | 'low';
  keywords?: string[]; // Filter messages containing these keywords
}

export interface SlackMessage {
  ts: string;
  channel: string;
  user: string;
  text: string;
  attachments?: any[];
  files?: any[];
  reactions?: any[];
  replies?: any[];
  thread_ts?: string;
  blocks?: any[];
}

export class SlackIngestionService extends ContentIngestionService {
  static serviceType = 'slack-ingestion';
  capabilityDescription = 'Monitors Slack channels for curated content and research updates';
  
  private channels: SlackChannelConfig[] = [];
  private slackToken: string | null = null;
  private lastChecked: Date = new Date();
  
  constructor(runtime: IAgentRuntime) {
    super(runtime, 'SlackIngestionService');
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('SlackIngestionService starting...');
    const service = new SlackIngestionService(runtime);
    await service.init();
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('SlackIngestionService stopping...');
    const service = runtime.getService('slack-ingestion');
    if (service && service.stop) {
      await service.stop();
    }
  }

  async init() {
    await super.init();
    
    // Get Slack token from environment
    this.slackToken = this.runtime.getSetting('SLACK_BOT_TOKEN');
    
    if (!this.slackToken) {
      this.contextLogger.warn('SLACK_BOT_TOKEN not configured. Slack ingestion disabled.');
      return;
    }

    // Load default channel configurations
    this.loadDefaultChannels();
    
    // Start monitoring channels
    this.startChannelMonitoring();
    
    this.contextLogger.info(`SlackIngestionService initialized with ${this.channels.length} channels`);
  }

  private loadDefaultChannels() {
    // Default channels based on LiveTheLifeTV workflow
    this.channels = [
      {
        channelId: 'research',
        channelName: 'research',
        type: 'research',
        priority: 'high',
        keywords: ['metaplanet', 'hyperliquid', 'msty', 'bitcoin', 'analysis', 'prediction']
      },
      {
        channelId: 'curated-tweets',
        channelName: 'curated-tweets',
        type: 'tweets',
        priority: 'high',
        keywords: ['bitcoin', 'crypto', 'stocks', 'market', 'breaking']
      },
      {
        channelId: 'market-alerts',
        channelName: 'market-alerts',
        type: 'alerts',
        priority: 'high',
        keywords: ['alert', 'breaking', 'urgent', 'major']
      },
      {
        channelId: 'general',
        channelName: 'general',
        type: 'general',
        priority: 'medium',
        keywords: ['podcast', 'youtube', 'recommendation', 'must watch']
      }
    ];
  }

  private startChannelMonitoring() {
    // Check for new messages every 5 minutes
    const checkInterval = 5 * 60 * 1000; // 5 minutes
    
    setInterval(async () => {
      try {
        await this.checkAllChannels();
      } catch (error) {
        this.contextLogger.error('Error during channel monitoring:', (error as Error).message);
      }
    }, checkInterval);

    // Initial check
    this.checkAllChannels();
  }

  private async checkAllChannels() {
    this.contextLogger.info('Checking all Slack channels for new content...');
    
    for (const channel of this.channels) {
      try {
        await this.checkChannel(channel);
      } catch (error) {
        this.contextLogger.error(`Error checking channel ${channel.channelName}:`, (error as Error).message);
      }
    }
  }

  private async checkChannel(channel: SlackChannelConfig) {
    if (!this.slackToken) {
      return;
    }

    try {
      const messages = await this.fetchChannelMessages(channel);
      const newMessages = messages.filter(msg => 
        new Date(parseFloat(msg.ts) * 1000) > this.lastChecked
      );

      if (newMessages.length > 0) {
        this.contextLogger.info(`Found ${newMessages.length} new messages in ${channel.channelName}`);
        
        const contentItems = await this.convertMessagesToContent(newMessages, channel);
        await this.processAndStoreContent(contentItems);
      }
    } catch (error) {
      this.contextLogger.error(`Failed to check channel ${channel.channelName}:`, (error as Error).message);
    }
  }

  private async fetchChannelMessages(channel: SlackChannelConfig): Promise<SlackMessage[]> {
    // This would make actual Slack API calls
    // For now, we'll simulate with mock data
    return this.mockSlackMessages(channel);
  }

  private mockSlackMessages(channel: SlackChannelConfig): SlackMessage[] {
    // Mock messages for testing - in real implementation this would call Slack API
    const mockMessages: SlackMessage[] = [
      {
        ts: (Date.now() / 1000).toString(),
        channel: channel.channelId,
        user: 'U123456789',
        text: 'Just shared this amazing thread about MetaPlanet\'s bitcoin strategy. Could be the next 50x play. https://twitter.com/user/status/123456789',
      },
      {
        ts: ((Date.now() - 3600000) / 1000).toString(),
        channel: channel.channelId,
        user: 'U123456789',
        text: 'New research: Hyperliquid\'s orderbook model could challenge centralized exchanges. This is exactly what we predicted 6 months ago.',
      },
      {
        ts: ((Date.now() - 7200000) / 1000).toString(),
        channel: channel.channelId,
        user: 'U123456789',
        text: 'MSTY options strategy is printing. Up 15% this week. Freedom calculator looking good.',
      }
    ];

    return mockMessages;
  }

  private async convertMessagesToContent(messages: SlackMessage[], channel: SlackChannelConfig): Promise<ContentItem[]> {
    const contentItems: ContentItem[] = [];

    for (const message of messages) {
      try {
        const contentItem = await this.convertSlackMessageToContent(message, channel);
        contentItems.push(contentItem);
      } catch (error) {
        this.contextLogger.error(`Failed to convert message ${message.ts}:`, (error as Error).message);
      }
    }

    return contentItems;
  }

  private async convertSlackMessageToContent(message: SlackMessage, channel: SlackChannelConfig): Promise<ContentItem> {
    // Determine content type based on message content
    let contentType: ContentItem['type'] = 'post';
    
    if (message.text.includes('twitter.com') || message.text.includes('x.com')) {
      contentType = 'tweet';
    } else if (message.text.includes('youtube.com') || message.text.includes('podcast')) {
      contentType = 'podcast';
    } else if (channel.type === 'research') {
      contentType = 'research';
    }

    // Extract URLs from message
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.text.match(urlRegex) || [];

    // Extract hashtags and mentions
    const hashtagRegex = /#(\w+)/g;
    const mentionRegex = /@(\w+)/g;
    const hashtags = message.text.match(hashtagRegex) || [];
    const mentions = message.text.match(mentionRegex) || [];

    return {
      id: `slack-${message.channel}-${message.ts}`,
      source: 'slack',
      type: contentType,
      content: message.text,
      metadata: {
        author: message.user,
        timestamp: new Date(parseFloat(message.ts) * 1000),
        url: urls[0], // First URL if available
        tags: [...hashtags, ...mentions],
      },
      processed: false
    };
  }

  private async processAndStoreContent(contentItems: ContentItem[]) {
    try {
      const processedItems = await this.processContent(contentItems);
      await this.storeContent(processedItems);
      
      // Update last checked timestamp
      this.lastChecked = new Date();
      
      this.contextLogger.info(`Processed and stored ${processedItems.length} content items from Slack`);
    } catch (error) {
      const enhancedError = ElizaOSErrorHandler.handleCommonErrors(error as Error, 'SlackContentProcessing');
      this.contextLogger.error('Failed to process Slack content:', enhancedError.message);
    }
  }

  /**
   * Implementation of abstract method from ContentIngestionService
   */
  async ingestContent(): Promise<ContentItem[]> {
    this.contextLogger.info('Manual content ingestion requested');
    
    const allContent: ContentItem[] = [];
    
    for (const channel of this.channels) {
      try {
        const messages = await this.fetchChannelMessages(channel);
        const contentItems = await this.convertMessagesToContent(messages, channel);
        allContent.push(...contentItems);
      } catch (error) {
        this.contextLogger.error(`Failed to ingest from channel ${channel.channelName}:`, (error as Error).message);
      }
    }

    return allContent;
  }

  /**
   * Get recent content from Slack channels
   */
  async getRecentContent(hours: number = 24): Promise<ContentItem[]> {
    const timeRange = {
      start: new Date(Date.now() - hours * 60 * 60 * 1000),
      end: new Date()
    };

    return this.getContent({ 
      source: 'slack', 
      timeRange 
    });
  }

  /**
   * Get content by channel type
   */
  async getContentByChannelType(type: SlackChannelConfig['type']): Promise<ContentItem[]> {
    const channelIds = this.channels
      .filter(channel => channel.type === type)
      .map(channel => channel.channelId);

    return this.processedContent.filter(item => 
      item.source === 'slack' && 
      channelIds.some(id => item.id.includes(id))
    );
  }

  /**
   * Add new channel to monitor
   */
  async addChannel(config: SlackChannelConfig): Promise<void> {
    this.channels.push(config);
    this.contextLogger.info(`Added new channel to monitor: ${config.channelName}`);
  }

  /**
   * Remove channel from monitoring
   */
  async removeChannel(channelId: string): Promise<void> {
    this.channels = this.channels.filter(channel => channel.channelId !== channelId);
    this.contextLogger.info(`Removed channel from monitoring: ${channelId}`);
  }

  /**
   * Check for new content (method expected by SchedulerService)
   */
  async checkForNewContent(): Promise<ContentItem[]> {
    this.contextLogger.info('Checking for new content in Slack channels');
    
    const newContent: ContentItem[] = [];
    
    for (const channel of this.channels) {
      try {
        const messages = await this.fetchChannelMessages(channel);
        const newMessages = messages.filter(msg => 
          new Date(parseFloat(msg.ts) * 1000) > this.lastChecked
        );

        if (newMessages.length > 0) {
          const contentItems = await this.convertMessagesToContent(newMessages, channel);
          newContent.push(...contentItems);
        }
      } catch (error) {
        this.contextLogger.error(`Failed to check channel ${channel.channelName}:`, (error as Error).message);
      }
    }

    if (newContent.length > 0) {
      await this.processAndStoreContent(newContent);
      this.lastChecked = new Date();
    }

    return newContent;
  }

  /**
   * Get monitoring status
   */
  async getMonitoringStatus(): Promise<{
    active: boolean;
    channels: SlackChannelConfig[];
    lastChecked: Date;
    totalProcessed: number;
  }> {
    return {
      active: !!this.slackToken,
      channels: this.channels,
      lastChecked: this.lastChecked,
      totalProcessed: this.processedContent.length
    };
  }
} 