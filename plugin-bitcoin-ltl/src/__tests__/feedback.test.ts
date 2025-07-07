import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { feedbackProvider } from "../providers/feedbackProvider";
import { feedbackStatsAction } from "../actions/feedbackStatsAction";
import { IAgentRuntime, Memory, State } from "@elizaos/core";
import fs from "fs/promises";
import path from "path";

// Mock runtime
const mockRuntime = {
  getSetting: vi.fn(),
  log: vi.fn(),
} as unknown as IAgentRuntime;

// Mock message
const mockMessage: Memory = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  content: { text: "Show me feedback statistics" },
  entityId: "123e4567-e89b-12d3-a456-426614174001",
  agentId: "123e4567-e89b-12d3-a456-426614174002",
  roomId: "123e4567-e89b-12d3-a456-426614174003",
  createdAt: Date.now(),
};

// Mock state
const mockState: State = {
  values: {},
  data: {},
  text: "",
};

describe("Feedback System", () => {
  const testFeedbackFile = path.resolve(process.cwd(), "test-feedback.json");
  
  beforeEach(async () => {
    // Clean up test file if it exists
    try {
      await fs.unlink(testFeedbackFile);
    } catch (e) {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFeedbackFile);
    } catch (e) {
      // File doesn't exist, that's fine
    }
  });

  describe("Feedback Provider", () => {
    it("should handle empty feedback data", async () => {
      const result = await feedbackProvider.get(mockRuntime, mockMessage, mockState);
      
      expect(result.values?.feedbackStats).toBeDefined();
      expect(result.values.feedbackStats.totalCount).toBe(0);
      expect(result.values.feedbackStats.averageRating).toBe(0);
      expect(result.values.feedbackStats.message).toBe("No feedback data available yet.");
    });

    it("should calculate feedback statistics correctly", async () => {
      // Create test feedback data
      const testFeedback = [
        {
          timestamp: "2024-01-01T10:00:00Z",
          userId: "user1",
          actionName: "BITCOIN_ANALYSIS",
          rating: 5,
          comment: "Excellent analysis",
          context: {}
        },
        {
          timestamp: "2024-01-02T10:00:00Z",
          userId: "user2",
          actionName: "MARKET_BRIEFING",
          rating: 4,
          comment: "Very helpful",
          context: {}
        },
        {
          timestamp: "2024-01-03T10:00:00Z",
          userId: "user3",
          actionName: "BITCOIN_ANALYSIS",
          rating: 2,
          comment: "Could be better",
          context: {}
        }
      ];

      // Mock the file read to return our test data
      vi.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify(testFeedback));

      const result = await feedbackProvider.get(mockRuntime, mockMessage, mockState);
      
      expect(result.values?.feedbackStats).toBeDefined();
      expect(result.values.feedbackStats.totalCount).toBe(3);
      expect(result.values.feedbackStats.averageRating).toBe(3.67);
      expect(result.values.feedbackStats.ratingDistribution[5]).toBe(1);
      expect(result.values.feedbackStats.ratingDistribution[4]).toBe(1);
      expect(result.values.feedbackStats.ratingDistribution[2]).toBe(1);
      expect(result.values.feedbackStats.commonComments).toContain("Excellent analysis");
      expect(result.values.feedbackStats.commonComments).toContain("Very helpful");
      expect(result.values.feedbackStats.commonComments).toContain("Could be better");
      expect(result.values.feedbackStats.lowRatingFlags).toHaveLength(1);
      expect(result.values.feedbackStats.lowRatingFlags[0].rating).toBe(2);
      expect(result.values.feedbackStats.topActions).toHaveLength(2);
      expect(result.values.feedbackStats.topActions[0].actionName).toBe("BITCOIN_ANALYSIS");
      expect(result.values.feedbackStats.topActions[0].count).toBe(2);
    });

    it("should handle file read errors gracefully", async () => {
      // Mock fs.readFile to throw an error (file not found)
      vi.spyOn(fs, "readFile").mockRejectedValueOnce(new Error("File not found"));

      const result = await feedbackProvider.get(mockRuntime, mockMessage, mockState);
      
      expect(result.values?.feedbackStats).toBeDefined();
      expect(result.values.feedbackStats.message).toBe("No feedback data available yet.");
    });
  });

  describe("Feedback Stats Action", () => {
    it("should validate correctly for feedback-related queries", async () => {
      const feedbackQuery: Memory = {
        ...mockMessage,
        content: { text: "Show me the feedback statistics" }
      };

      const isValid = await feedbackStatsAction.validate(mockRuntime, feedbackQuery);
      expect(isValid).toBe(true);
    });

    it("should validate correctly for rating-related queries", async () => {
      const ratingQuery: Memory = {
        ...mockMessage,
        content: { text: "What are the user ratings?" }
      };

      const isValid = await feedbackStatsAction.validate(mockRuntime, ratingQuery);
      expect(isValid).toBe(true);
    });

    it("should not validate for unrelated queries", async () => {
      const unrelatedQuery: Memory = {
        ...mockMessage,
        content: { text: "What's the weather like?" }
      };

      const isValid = await feedbackStatsAction.validate(mockRuntime, unrelatedQuery);
      expect(isValid).toBe(false);
    });

    it("should handle missing feedback stats gracefully", async () => {
      const callback = vi.fn();
      
      await feedbackStatsAction.handler(mockRuntime, mockMessage, mockState, {}, callback);
      
      expect(callback).toHaveBeenCalledWith({
        thought: expect.stringContaining("No feedback data available"),
        text: expect.stringContaining("don't have access to feedback statistics"),
        actions: ["FEEDBACK_STATS"],
      });
    });

    it("should format feedback statistics correctly", async () => {
      const callback = vi.fn();
      const stateWithFeedback: State = {
        values: {
          feedbackStats: {
            totalCount: 5,
            averageRating: 4.2,
            ratingDistribution: { 5: 3, 4: 1, 3: 1, 2: 0, 1: 0 },
            mostRecent: {
              timestamp: "2024-01-03T10:00:00Z",
              userId: "user1",
              actionName: "BITCOIN_ANALYSIS",
              rating: 5,
              comment: "Great analysis",
              context: {}
            },
            commonComments: ["Great analysis", "Very helpful"],
            lowRatingFlags: [],
            topActions: [
              { actionName: "BITCOIN_ANALYSIS", count: 3, avgRating: 4.5 },
              { actionName: "MARKET_BRIEFING", count: 2, avgRating: 3.5 }
            ]
          }
        },
        data: {},
        text: ""
      };

      await feedbackStatsAction.handler(mockRuntime, mockMessage, stateWithFeedback, {}, callback);
      
      expect(callback).toHaveBeenCalledWith({
        thought: expect.stringContaining("Successfully retrieved and formatted feedback statistics"),
        text: expect.stringContaining("📊 **Feedback Statistics Report**"),
        actions: ["FEEDBACK_STATS"],
      });

      const responseText = callback.mock.calls[0][0].text;
      expect(responseText).toContain("Total Feedback: 5");
      expect(responseText).toContain("Average Rating: 4.2/5 ⭐");
      expect(responseText).toContain("✅ Excellent performance!");
    });

    it("should handle low ratings correctly", async () => {
      const callback = vi.fn();
      const stateWithLowRatings: State = {
        values: {
          feedbackStats: {
            totalCount: 3,
            averageRating: 2.3,
            ratingDistribution: { 5: 0, 4: 0, 3: 1, 2: 1, 1: 1 },
            mostRecent: null,
            commonComments: ["Needs improvement"],
            lowRatingFlags: [
              {
                timestamp: "2024-01-03T10:00:00Z",
                userId: "user1",
                actionName: "BITCOIN_ANALYSIS",
                rating: 1,
                comment: "Not helpful",
                context: {}
              }
            ],
            topActions: []
          }
        },
        data: {},
        text: ""
      };

      await feedbackStatsAction.handler(mockRuntime, mockMessage, stateWithLowRatings, {}, callback);
      
      const responseText = callback.mock.calls[0][0].text;
      expect(responseText).toContain("❌ Performance needs attention");
      expect(responseText).toContain("🚨 **Low Rating Alerts");
      expect(responseText).toContain("🔍 **Recommendation:** Review the flagged low ratings");
    });
  });
}); 