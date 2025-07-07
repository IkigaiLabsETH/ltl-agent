import { IAgentRuntime, logger } from "@elizaos/core";
import { BaseDataService } from "./BaseDataService";
import fs from "fs/promises";
import path from "path";

/**
 * KnowledgeBaseService
 * Loads and indexes all markdown files from the global '@/knowledge' directory.
 * Provides topic listing, file retrieval, search, and summarization methods.
 */
export class KnowledgeBaseService extends BaseDataService {
  static serviceType = "knowledge-base";
  capabilityDescription = "Knowledge base service for Bitcoin intelligence, loading markdown files from global knowledge directory.";

  private knowledgeDir: string;
  private cache: Map<string, { content: string; data: any; headings: string[] }>; // topic -> { content, data, headings }

  constructor(runtime: IAgentRuntime) {
    super(runtime, "bitcoinData"); // Use a valid service name
    // Use the global knowledge directory
    this.knowledgeDir = path.resolve(process.cwd(), "../knowledge");
    this.cache = new Map();
  }

  async init() {
    logger.info("KnowledgeBaseService initializing...");
    await this.loadKnowledgeBase();
    logger.info(`KnowledgeBaseService loaded ${this.cache.size} topics.`);
  }

  async updateData(): Promise<void> {
    await this.loadKnowledgeBase();
  }

  async forceUpdate(): Promise<void> {
    await this.loadKnowledgeBase();
  }

  /**
   * Loads and indexes all markdown files from the knowledge directory
   */
  async loadKnowledgeBase() {
    this.cache.clear();
    const files = await this.getMarkdownFiles(this.knowledgeDir);
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      const headings = this.extractHeadings(content);
      const topic = path.basename(file, ".md");
      this.cache.set(topic, { content, data: {}, headings });
    }
  }

  /**
   * Recursively get all markdown files in a directory
   */
  private async getMarkdownFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await this.getMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  /**
   * Extracts all markdown headings from content
   */
  private extractHeadings(content: string): string[] {
    return content.split("\n").filter(line => /^#+ /.test(line)).map(line => line.replace(/^#+ /, "").trim());
  }

  /**
   * List all topics (filenames without extension)
   */
  getAllTopics(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get file content by topic
   */
  getFileByTopic(topic: string): { content: string; data: any; headings: string[] } | undefined {
    return this.cache.get(topic);
  }

  /**
   * Search for a query string in all files (case-insensitive)
   */
  search(query: string): Array<{ topic: string; snippet: string }> {
    const results: Array<{ topic: string; snippet: string }> = [];
    const q = query.toLowerCase();
    for (const [topic, { content }] of this.cache.entries()) {
      const idx = content.toLowerCase().indexOf(q);
      if (idx !== -1) {
        // Get a snippet around the match
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + 40);
        results.push({ topic, snippet: content.slice(start, end) });
      }
    }
    return results;
  }

  /**
   * Summarize a topic (returns first paragraph or first 300 chars)
   */
  summarize(topic: string): string | undefined {
    const file = this.cache.get(topic);
    if (!file) return undefined;
    const firstPara = file.content.split(/\n\n+/)[0];
    return firstPara.length > 300 ? firstPara.slice(0, 300) + "..." : firstPara;
  }
} 