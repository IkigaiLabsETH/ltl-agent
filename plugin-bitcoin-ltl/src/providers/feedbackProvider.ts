import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import fs from "fs/promises";
import path from "path";

const FEEDBACK_FILE = path.resolve(process.cwd(), "plugin-bitcoin-ltl/feedback.json");

interface FeedbackEntry {
  timestamp: string;
  userId: string;
  actionName: string;
  rating: number;
  comment: string;
  context: any;
}

interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  mostRecent: FeedbackEntry | null;
  commonComments: string[];
  lowRatingFlags: FeedbackEntry[];
  topActions: { actionName: string; count: number; avgRating: number }[];
}

/**
 * Feedback Provider
 * Provides feedback statistics and insights for continuous improvement
 */
export const feedbackProvider: Provider = {
  name: "FEEDBACK_STATS",
  description: "Provides feedback statistics and insights for agent improvement",
  position: 10, // Lower priority, runs after core providers

  get: async (_runtime: IAgentRuntime, _message: Memory, _state: State) => {
    try {
      // Read feedback data
      let feedbackData: FeedbackEntry[] = [];
      try {
        const file = await fs.readFile(FEEDBACK_FILE, "utf-8");
        feedbackData = JSON.parse(file);
      } catch (e) {
        // File may not exist yet
        feedbackData = [];
      }

      if (feedbackData.length === 0) {
        return {
          values: {
            feedbackStats: {
              totalCount: 0,
              averageRating: 0,
              ratingDistribution: {},
              mostRecent: null,
              commonComments: [],
              lowRatingFlags: [],
              topActions: [],
              message: "No feedback data available yet."
            }
          }
        };
      }

      // Calculate overall stats
      const totalCount = feedbackData.length;
      const averageRating = feedbackData.reduce((sum, entry) => sum + entry.rating, 0) / totalCount;
      
      // Rating distribution
      const ratingDistribution: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = feedbackData.filter(entry => entry.rating === i).length;
      }

      // Most recent feedback
      const mostRecent = feedbackData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

      // Common comments (non-empty comments, limit to top 5)
      const comments = feedbackData
        .filter(entry => entry.comment && entry.comment.trim().length > 0)
        .map(entry => entry.comment.trim());
      
      const commentCounts: { [key: string]: number } = {};
      comments.forEach(comment => {
        commentCounts[comment] = (commentCounts[comment] || 0) + 1;
      });
      
      const commonComments = Object.entries(commentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([comment]) => comment);

      // Low rating flags (ratings 1-2)
      const lowRatingFlags = feedbackData
        .filter(entry => entry.rating <= 2)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Top 10 most recent low ratings

      // Top actions by feedback count and rating
      const actionStats: { [key: string]: { count: number; totalRating: number } } = {};
      feedbackData.forEach(entry => {
        if (!actionStats[entry.actionName]) {
          actionStats[entry.actionName] = { count: 0, totalRating: 0 };
        }
        actionStats[entry.actionName].count++;
        actionStats[entry.actionName].totalRating += entry.rating;
      });

      const topActions = Object.entries(actionStats)
        .map(([actionName, stats]) => ({
          actionName,
          count: stats.count,
          avgRating: stats.totalRating / stats.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const feedbackStats: FeedbackStats = {
        totalCount,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingDistribution,
        mostRecent,
        commonComments,
        lowRatingFlags,
        topActions
      };

      return {
        values: {
          feedbackStats
        }
      };

    } catch (error) {
      console.error("Error reading feedback data:", error);
      return {
        values: {
          feedbackStats: {
            totalCount: 0,
            averageRating: 0,
            ratingDistribution: {},
            mostRecent: null,
            commonComments: [],
            lowRatingFlags: [],
            topActions: [],
            message: "Error reading feedback data."
          }
        }
      };
    }
  },
}; 