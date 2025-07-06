import { IAgentRuntime, elizaLogger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import { LoggerWithContext, generateCorrelationId } from "../utils/helpers";
import {
  handleError,
  ErrorCategory,
} from "../utils/comprehensive-error-handling";
import { WebSocket, WebSocketServer } from "ws";

/**
 * Stream event types
 */
export type StreamEventType =
  | "price_update"
  | "prediction_update"
  | "sentiment_update"
  | "trend_update"
  | "alert"
  | "performance_update"
  | "system_status";

/**
 * Stream event interface
 */
export interface StreamEvent {
  id: string;
  type: StreamEventType;
  timestamp: number;
  data: any;
  metadata?: {
    source: string;
    priority: "low" | "medium" | "high" | "critical";
    ttl?: number;
  };
}

/**
 * Client connection interface
 */
export interface ClientConnection {
  id: string;
  ws: WebSocket;
  subscriptions: Set<StreamEventType>;
  lastPing: number;
  isAlive: boolean;
  metadata: {
    userAgent?: string;
    ip?: string;
    connectedAt: number;
  };
}

/**
 * Stream configuration
 */
export interface StreamConfig {
  port: number;
  maxConnections: number;
  heartbeatInterval: number;
  maxMessageSize: number;
  enableCompression: boolean;
  rateLimit: {
    enabled: boolean;
    maxMessagesPerMinute: number;
    maxConnectionsPerIp: number;
  };
  security: {
    enableAuth: boolean;
    allowedOrigins: string[];
    apiKeyRequired: boolean;
  };
}

/**
 * Stream statistics
 */
export interface StreamStats {
  totalConnections: number;
  activeConnections: number;
  totalEventsSent: number;
  eventsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
}

/**
 * Real-Time Streaming Service
 * Provides WebSocket-based real-time data streaming for Bitcoin market data
 */
export class RealTimeStreamingService extends BaseDataService {
  static serviceType = "real-time-streaming";

  private contextLogger: LoggerWithContext;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private eventQueue: StreamEvent[] = [];
  private streamConfig: StreamConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventProcessingInterval: NodeJS.Timeout | null = null;
  private stats: {
    totalConnections: number;
    totalEventsSent: number;
    startTime: number;
    lastEventTime: number;
  };

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData");
    this.contextLogger = new LoggerWithContext(
      generateCorrelationId(),
      "RealTimeStreaming",
    );
    this.streamConfig = this.getDefaultConfig();
    this.stats = {
      totalConnections: 0,
      totalEventsSent: 0,
      startTime: Date.now(),
      lastEventTime: Date.now(),
    };
  }

  public get capabilityDescription(): string {
    return "Real-time WebSocket streaming service for live Bitcoin market data, predictions, and alerts";
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info("Starting RealTimeStreamingService...");
    return new RealTimeStreamingService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info("Stopping RealTimeStreamingService...");
    const service = runtime.getService(
      "real-time-streaming",
    ) as unknown as RealTimeStreamingService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info("RealTimeStreamingService starting...");
    await this.initializeWebSocketServer();
    this.startHeartbeat();
    this.startEventProcessing();
  }

  async init() {
    this.contextLogger.info("RealTimeStreamingService initialized");
  }

  async stop() {
    this.contextLogger.info("RealTimeStreamingService stopping...");
    this.stopHeartbeat();
    this.stopEventProcessing();
    await this.closeAllConnections();
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  /**
   * Get default configuration
   */
  protected getDefaultConfig(): StreamConfig {
    return {
      port: parseInt(this.getSetting("STREAM_PORT", "8080")),
      maxConnections: parseInt(
        this.getSetting("STREAM_MAX_CONNECTIONS", "1000"),
      ),
      heartbeatInterval: parseInt(
        this.getSetting("STREAM_HEARTBEAT_INTERVAL", "30000"),
      ),
      maxMessageSize: parseInt(
        this.getSetting("STREAM_MAX_MESSAGE_SIZE", "1048576"),
      ), // 1MB
      enableCompression:
        this.getSetting("STREAM_ENABLE_COMPRESSION", "true") === "true",
      rateLimit: {
        enabled:
          this.getSetting("STREAM_RATE_LIMIT_ENABLED", "true") === "true",
        maxMessagesPerMinute: parseInt(
          this.getSetting("STREAM_MAX_MESSAGES_PER_MINUTE", "100"),
        ),
        maxConnectionsPerIp: parseInt(
          this.getSetting("STREAM_MAX_CONNECTIONS_PER_IP", "10"),
        ),
      },
      security: {
        enableAuth: this.getSetting("STREAM_ENABLE_AUTH", "false") === "true",
        allowedOrigins: this.getSetting("STREAM_ALLOWED_ORIGINS", "*").split(
          ",",
        ),
        apiKeyRequired:
          this.getSetting("STREAM_API_KEY_REQUIRED", "false") === "true",
      },
    };
  }

  /**
   * Initialize WebSocket server
   */
  private async initializeWebSocketServer(): Promise<void> {
    try {
      this.wss = new WebSocketServer({
        port: this.streamConfig.port,
        maxPayload: this.streamConfig.maxMessageSize,
        perMessageDeflate: this.streamConfig.enableCompression,
      });

      this.wss.on("connection", (ws: WebSocket, request: any) => {
        this.handleConnection(ws, request);
      });

      this.wss.on("error", (error: Error) => {
        this.contextLogger.error("WebSocket server error", {
          error: error.message,
        });
      });

      this.contextLogger.info("WebSocket server started", {
        port: this.streamConfig.port,
        maxConnections: this.streamConfig.maxConnections,
      });
    } catch (error) {
      await handleError(
        error instanceof Error
          ? error
          : new Error("WebSocket server initialization failed"),
        {
          correlationId: this.correlationId,
          component: "RealTimeStreamingService",
          operation: "initializeWebSocketServer",
        },
      );

      this.contextLogger.error("Failed to initialize WebSocket server", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: WebSocket, request: any): void {
    try {
      // Check connection limits
      if (this.clients.size >= this.streamConfig.maxConnections) {
        this.sendError(ws, "Maximum connections reached");
        ws.close(1013, "Maximum connections reached");
        return;
      }

      // Validate origin
      if (!this.validateOrigin(request)) {
        this.sendError(ws, "Origin not allowed");
        ws.close(1008, "Origin not allowed");
        return;
      }

      // Create client connection
      const clientId = this.generateClientId();
      const client: ClientConnection = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        lastPing: Date.now(),
        isAlive: true,
        metadata: {
          userAgent: request.headers["user-agent"],
          ip: this.getClientIp(request),
          connectedAt: Date.now(),
        },
      };

      this.clients.set(clientId, client);
      this.stats.totalConnections++;

      // Set up event handlers
      ws.on("message", (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      ws.on("close", (code: number, reason: Buffer) => {
        this.handleDisconnection(clientId, code, reason.toString());
      });

      ws.on("error", (error: Error) => {
        this.handleClientError(clientId, error);
      });

      ws.on("pong", () => {
        this.handlePong(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: "connection_established",
        data: {
          clientId,
          timestamp: Date.now(),
          config: {
            heartbeatInterval: this.streamConfig.heartbeatInterval,
            maxMessageSize: this.streamConfig.maxMessageSize,
          },
        },
      });

      this.contextLogger.info("Client connected", {
        clientId,
        ip: client.metadata.ip,
        totalConnections: this.clients.size,
      });
    } catch (error) {
      this.contextLogger.error("Failed to handle connection", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      ws.close(1011, "Internal server error");
    }
  }

  /**
   * Handle client message
   */
  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) {
        return;
      }

      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(clientId, message.channels);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(clientId, message.channels);
          break;
        case "ping":
          this.handlePing(clientId);
          break;
        case "auth":
          this.handleAuth(clientId, message.apiKey);
          break;
        default:
          this.sendError(clientId, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.contextLogger.error("Failed to handle message", {
        clientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.sendError(clientId, "Invalid message format");
    }
  }

  /**
   * Handle client subscription
   */
  private handleSubscribe(clientId: string, channels: StreamEventType[]): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    for (const channel of channels) {
      client.subscriptions.add(channel);
    }

    this.sendToClient(clientId, {
      type: "subscription_confirmed",
      data: {
        channels,
        timestamp: Date.now(),
      },
    });

    this.contextLogger.debug("Client subscribed", {
      clientId,
      channels,
      totalSubscriptions: client.subscriptions.size,
    });
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscribe(
    clientId: string,
    channels: StreamEventType[],
  ): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    for (const channel of channels) {
      client.subscriptions.delete(channel);
    }

    this.sendToClient(clientId, {
      type: "unsubscription_confirmed",
      data: {
        channels,
        timestamp: Date.now(),
      },
    });

    this.contextLogger.debug("Client unsubscribed", {
      clientId,
      channels,
      totalSubscriptions: client.subscriptions.size,
    });
  }

  /**
   * Handle client ping
   */
  private handlePing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    client.lastPing = Date.now();
    client.isAlive = true;

    this.sendToClient(clientId, {
      type: "pong",
      data: {
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Handle client pong
   */
  private handlePong(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    client.isAlive = true;
  }

  /**
   * Handle client authentication
   */
  private handleAuth(clientId: string, apiKey: string): void {
    if (!this.streamConfig.security.apiKeyRequired) {
      this.sendToClient(clientId, {
        type: "auth_success",
        data: {
          timestamp: Date.now(),
        },
      });
      return;
    }

    // In a real implementation, validate the API key
    const isValid = this.validateApiKey(apiKey);

    if (isValid) {
      this.sendToClient(clientId, {
        type: "auth_success",
        data: {
          timestamp: Date.now(),
        },
      });
    } else {
      this.sendError(clientId, "Invalid API key");
      this.disconnectClient(clientId, 1008, "Authentication failed");
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(
    clientId: string,
    code: number,
    reason: string,
  ): void {
    this.clients.delete(clientId);

    this.contextLogger.info("Client disconnected", {
      clientId,
      code,
      reason,
      totalConnections: this.clients.size,
    });
  }

  /**
   * Handle client error
   */
  private handleClientError(clientId: string, error: Error): void {
    this.contextLogger.error("Client error", {
      clientId,
      error: error.message,
    });

    this.disconnectClient(clientId, 1011, "Internal error");
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, this.streamConfig.heartbeatInterval);

    this.contextLogger.info("Heartbeat mechanism started", {
      interval: this.streamConfig.heartbeatInterval,
    });
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.contextLogger.info("Heartbeat mechanism stopped");
  }

  /**
   * Perform heartbeat check
   */
  private performHeartbeat(): void {
    const now = Date.now();
    const deadClients: string[] = [];

    for (const [clientId, client] of this.clients) {
      if (now - client.lastPing > this.streamConfig.heartbeatInterval * 2) {
        deadClients.push(clientId);
      } else {
        client.ws.ping();
      }
    }

    // Remove dead clients
    for (const clientId of deadClients) {
      this.disconnectClient(clientId, 1000, "Heartbeat timeout");
    }

    if (deadClients.length > 0) {
      this.contextLogger.warn("Removed dead clients", {
        count: deadClients.length,
        clientIds: deadClients,
      });
    }
  }

  /**
   * Start event processing
   */
  private startEventProcessing(): void {
    this.eventProcessingInterval = setInterval(() => {
      this.processEventQueue();
    }, 100); // Process events every 100ms

    this.contextLogger.info("Event processing started");
  }

  /**
   * Stop event processing
   */
  private stopEventProcessing(): void {
    if (this.eventProcessingInterval) {
      clearInterval(this.eventProcessingInterval);
      this.eventProcessingInterval = null;
    }
    this.contextLogger.info("Event processing stopped");
  }

  /**
   * Process event queue
   */
  private processEventQueue(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = this.eventQueue.splice(0, 100); // Process up to 100 events at a time
    const now = Date.now();

    for (const event of events) {
      // Filter out expired events
      if (event.metadata?.ttl && now - event.timestamp > event.metadata.ttl) {
        continue;
      }

      this.broadcastEvent(event);
    }

    this.stats.lastEventTime = now;
  }

  /**
   * Broadcast event to subscribed clients
   */
  private broadcastEvent(event: StreamEvent): void {
    const subscribedClients = Array.from(this.clients.values()).filter(
      (client) => client.subscriptions.has(event.type),
    );

    for (const client of subscribedClients) {
      try {
        this.sendToClient(client.id, {
          type: event.type,
          data: event.data,
          metadata: event.metadata,
        });
      } catch (error) {
        this.contextLogger.error("Failed to send event to client", {
          clientId: client.id,
          eventType: event.type,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    this.stats.totalEventsSent += subscribedClients.length;
  }

  /**
   * Send event to specific client
   */
  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client || !client.isAlive) {
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      client.ws.send(messageStr);
    } catch (error) {
      this.contextLogger.error("Failed to send message to client", {
        clientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.disconnectClient(clientId, 1011, "Send error");
    }
  }

  /**
   * Send error to client
   */
  private sendError(clientId: string, message: string): void {
    this.sendToClient(clientId, {
      type: "error",
      data: {
        message,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Disconnect client
   */
  private disconnectClient(
    clientId: string,
    code: number,
    reason: string,
  ): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    try {
      client.ws.close(code, reason);
    } catch (error) {
      this.contextLogger.error("Failed to disconnect client", {
        clientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    this.clients.delete(clientId);
  }

  /**
   * Close all connections
   */
  private async closeAllConnections(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.keys()).map((clientId) =>
      this.disconnectClient(clientId, 1000, "Server shutdown"),
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
  }

  /**
   * Publish event to stream
   */
  publishEvent(
    type: StreamEventType,
    data: any,
    metadata?: StreamEvent["metadata"],
  ): void {
    const event: StreamEvent = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      data,
      metadata,
    };

    this.eventQueue.push(event);

    // Limit queue size
    if (this.eventQueue.length > 10000) {
      this.eventQueue = this.eventQueue.slice(-5000);
      this.contextLogger.warn("Event queue size limit reached, trimming");
    }
  }

  /**
   * Utility methods
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateOrigin(request: any): boolean {
    if (this.streamConfig.security.allowedOrigins.includes("*")) {
      return true;
    }

    const origin = request.headers.origin;
    return origin && this.streamConfig.security.allowedOrigins.includes(origin);
  }

  private getClientIp(request: any): string {
    return (
      request.headers["x-forwarded-for"]?.split(",")[0] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      "unknown"
    );
  }

  private validateApiKey(apiKey: string): boolean {
    // In a real implementation, validate against stored API keys
    return apiKey && apiKey.length > 0;
  }

  /**
   * Get stream statistics
   */
  getStats(): StreamStats {
    const now = Date.now();
    const uptime = now - this.stats.startTime;
    const eventsPerSecond =
      uptime > 0 ? this.stats.totalEventsSent / (uptime / 1000) : 0;

    return {
      totalConnections: this.stats.totalConnections,
      activeConnections: this.clients.size,
      totalEventsSent: this.stats.totalEventsSent,
      eventsPerSecond,
      averageLatency: 0, // Would need to be calculated from actual measurements
      errorRate: 0, // Would need to be calculated from error tracking
      uptime,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Get client information
   */
  getClientInfo(clientId: string): ClientConnection | null {
    return this.clients.get(clientId) || null;
  }

  /**
   * Get all connected clients
   */
  getAllClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): Record<StreamEventType, number> {
    const stats: Record<StreamEventType, number> = {
      price_update: 0,
      prediction_update: 0,
      sentiment_update: 0,
      trend_update: 0,
      alert: 0,
      performance_update: 0,
      system_status: 0,
    };

    for (const client of this.clients.values()) {
      for (const subscription of client.subscriptions) {
        stats[subscription]++;
      }
    }

    return stats;
  }

  async updateData(): Promise<void> {
    // Send system status update
    this.publishEvent("system_status", {
      timestamp: Date.now(),
      stats: this.getStats(),
      subscriptions: this.getSubscriptionStats(),
    });
  }

  async forceUpdate(): Promise<any> {
    return {
      stats: this.getStats(),
      clients: this.getAllClients().map((client) => ({
        id: client.id,
        subscriptions: Array.from(client.subscriptions),
        connectedAt: client.metadata.connectedAt,
        isAlive: client.isAlive,
      })),
      subscriptions: this.getSubscriptionStats(),
    };
  }
}
