import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from "@elizaos/core";
import fs from "fs/promises";
import path from "path";

const FEEDBACK_FILE = path.resolve(process.cwd(), "plugin-bitcoin-ltl/feedback.json");

/**
 * Feedback Action
 * Allows users to submit feedback (rating, comment) on agent outputs
 */
export const feedbackAction: Action = {
  name: "FEEDBACK",
  similes: ["USER_FEEDBACK", "RATE_OUTPUT", "COMMENT_ON_ACTION"],
  description: "Submit feedback (rating, comment) on agent outputs for continuous improvement.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || "";
    return text.includes("feedback") || text.includes("rate") || text.includes("comment");
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      // Parse feedback from message
      const text = message.content?.text || "";
      const ratingMatch = text.match(/([1-5])\s*stars?/i);
      const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : undefined;
      const commentMatch = text.match(/comment:?\s*(.*)$/i);
      const comment = commentMatch ? commentMatch[1] : undefined;
      const actionNameMatch = text.match(/for\s+([A-Z_]+)/i);
      const actionName = actionNameMatch ? actionNameMatch[1] : undefined;
      let userId = "anonymous";
      if ("userId" in message && typeof (message as any).userId === "string") {
        userId = (message as any).userId;
      } else if (message.content && typeof (message.content as any).userId === "string") {
        userId = (message.content as any).userId;
      }
      const context = message.content?.context || {};

      if (!rating) {
        const errorContent: Content = {
          text: "❌ Please provide a rating (1-5 stars) in your feedback.",
          actions: ["FEEDBACK"],
          source: "feedback-action",
        };
        await callback(errorContent);
        return errorContent;
      }

      // Prepare feedback entry
      const feedbackEntry = {
        timestamp: new Date().toISOString(),
        userId,
        actionName: actionName || "unknown",
        rating,
        comment: comment || "",
        context,
      };

      // Read, append, and write feedback
      let feedbackData: any[] = [];
      try {
        const file = await fs.readFile(FEEDBACK_FILE, "utf-8");
        feedbackData = JSON.parse(file);
      } catch (e) {
        // File may not exist yet
        feedbackData = [];
      }
      feedbackData.push(feedbackEntry);
      await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackData, null, 2), "utf-8");

      const responseContent: Content = {
        text: `✅ Thank you for your feedback!\nRating: ${rating} star(s)${comment ? `\nComment: ${comment}` : ""}`,
        actions: ["FEEDBACK"],
        source: "feedback-action",
      };
      await callback(responseContent);
      return responseContent;
    } catch (error) {
      const errorContent: Content = {
        text: "❌ Failed to record feedback. Please try again.",
        actions: ["FEEDBACK"],
        source: "feedback-action",
      };
      await callback(errorContent);
      return errorContent;
    }
  },
}; 