import { IAgentRuntime, logger, Memory, State } from "@elizaos/core";
import type { Action } from "@elizaos/core";
import type { TravelDataService } from "../services/TravelDataService";

export const weeklyHotelSuggestionsAction: Action = {
  name: "weekly_hotel_suggestions",
  description: "Get weekly hotel suggestions with perfect day opportunities based on real-time rates and seasonal patterns",
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('weekly') ||
      text.includes('suggestions') ||
      text.includes('hotel') ||
      text.includes('perfect day') ||
      text.includes('seasonal') ||
      text.includes('opportunities') ||
      text.includes('recommendations')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: (content: any) => Promise<Memory[]>
  ): Promise<boolean> => {
    try {
      const travelService = runtime.getService('travel-data') as TravelDataService;
      const limit = 5;
      const includeSeasonal = true;
      const city = 'all';

      logger.info(`Getting weekly hotel suggestions (limit: ${limit}, city: ${city})`);

      // Get real-time perfect day opportunities
      const perfectDays = await travelService.detectPerfectDays();
      
      // Get weekly suggestions from seasonal service
      const weeklySuggestions = travelService.getWeeklySuggestions(limit * 2); // Get more to filter
      
      // Filter by city if specified
      const filteredSuggestions = city === 'all' 
        ? weeklySuggestions 
        : weeklySuggestions.filter((s: any) => s.city === city);

      // Combine and format results
      const results = {
        realTimeOpportunities: perfectDays.slice(0, 3),
        weeklySuggestions: filteredSuggestions.slice(0, limit),
        seasonalAnalysis: includeSeasonal ? travelService.getCitySeasonalAnalysis(city === 'all' ? 'biarritz' : city) : [],
        summary: {
          totalOpportunities: perfectDays.length,
          weeklySuggestions: filteredSuggestions.length,
          bestSavings: Math.max(...perfectDays.map(p => p.savingsPercentage), ...filteredSuggestions.map((s: any) => s.savingsPercentage)),
          averageSavings: perfectDays.length > 0 ? perfectDays.reduce((sum, p) => sum + p.savingsPercentage, 0) / perfectDays.length : 0
        }
      };

      // Format response
      let response = `🎯 **WEEKLY HOTEL SUGGESTIONS**\n\n`;

      // Real-time opportunities
      if (results.realTimeOpportunities.length > 0) {
        response += `🔥 **REAL-TIME PERFECT DAYS**\n`;
        results.realTimeOpportunities.forEach((day, index) => {
          const urgencyEmoji = day.urgency === 'high' ? '🔥' : day.urgency === 'medium' ? '⚡' : '📅';
          response += `${urgencyEmoji} **${day.hotelName}** - ${day.perfectDate}\n`;
          response += `   💰 €${day.currentRate}/night (vs €${day.averageRate} avg)\n`;
          response += `   💸 **${day.savingsPercentage.toFixed(1)}% savings** | 🎯 ${(day.confidenceScore * 100).toFixed(0)}% confidence\n`;
          response += `   📋 ${day.reasons.join(', ')}\n\n`;
        });
      }

      // Weekly suggestions
      if (results.weeklySuggestions.length > 0) {
        response += `📅 **WEEKLY SUGGESTIONS**\n`;
        results.weeklySuggestions.forEach((suggestion: any, index) => {
          const urgencyEmoji = suggestion.urgency === 'high' ? '🔥' : suggestion.urgency === 'medium' ? '⚡' : '📅';
          response += `${urgencyEmoji} **${suggestion.hotelName}** (${suggestion.city})\n`;
          response += `   📅 ${suggestion.suggestedDate} | 💰 €${suggestion.currentRate}/night\n`;
          response += `   💸 **${suggestion.savingsPercentage.toFixed(1)}% savings** | 🎯 ${(suggestion.confidenceScore * 100).toFixed(0)}% confidence\n`;
          response += `   📋 ${suggestion.reasons.join(', ')}\n`;
          response += `   ⏰ ${suggestion.bookingWindow}\n\n`;
        });
      }

      // Summary
      response += `📊 **SUMMARY**\n`;
      response += `• Total opportunities: ${results.summary.totalOpportunities}\n`;
      response += `• Weekly suggestions: ${results.summary.weeklySuggestions}\n`;
      response += `• Best savings: ${results.summary.bestSavings.toFixed(1)}%\n`;
      response += `• Average savings: ${results.summary.averageSavings.toFixed(1)}%\n\n`;

      // Bitcoin philosophy
      response += `💎 **Bitcoin Philosophy**: Time is money. These opportunities represent asymmetric risk/reward scenarios where you can secure luxury accommodations at significant discounts. Act decisively when perfect days align with your travel plans.\n\n`;

      response += `*Data combines real-time scraping with historical seasonal patterns for maximum accuracy.*`;

      // Add BTC acceptance note
      response += `\n\n⚠️ Currently, none of our curated hotels accept Bitcoin directly, but we're monitoring for future adoption.`;

      if (callback) {
        await callback({
          text: response,
          thought: `Provided comprehensive weekly hotel suggestions combining real-time data (${results.realTimeOpportunities.length} opportunities) with seasonal patterns (${results.weeklySuggestions.length} suggestions). Best savings: ${results.summary.bestSavings.toFixed(1)}%.`,
          actions: ['weekly_hotel_suggestions']
        });
      }

      return true;

    } catch (error) {
      logger.error('Error in weekly hotel suggestions action:', error);
      
      if (callback) {
        await callback({
          text: "❌ Unable to retrieve weekly hotel suggestions at this time. Please try again later.",
          thought: `Failed to get weekly hotel suggestions: ${error.message}`,
          actions: ['weekly_hotel_suggestions']
        });
      }
      
      return false;
    }
  }
}; 