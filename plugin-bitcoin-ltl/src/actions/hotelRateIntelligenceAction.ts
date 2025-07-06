import { Action, IAgentRuntime, Memory, State } from '@elizaos/core';
import { TravelDataService, PerfectDayOpportunity } from '../services/TravelDataService';

export const hotelRateIntelligenceAction: Action = {
  name: 'HOTEL_RATE_INTELLIGENCE',
  similes: ['HOTEL_DEALS', 'PERFECT_DAYS', 'RATE_OPPORTUNITIES', 'HOTEL_INTELLIGENCE'],
  description: 'Analyzes hotel rates and identifies perfect booking opportunities for luxury European destinations',
  
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes('hotel') ||
      text.includes('rate') ||
      text.includes('deal') ||
      text.includes('perfect day') ||
      text.includes('booking') ||
      text.includes('luxury') ||
      text.includes('travel') ||
      text.includes('opportunity')
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
      // Get the travel data service
      const travelService = runtime.getService<TravelDataService>('travel-data');
      if (!travelService) {
        if (callback) {
          await callback({
            thought: 'Travel data service not available, cannot provide hotel rate intelligence',
            text: "I'm sorry, but I don't have access to hotel rate intelligence at the moment. The travel data service isn't available.",
            actions: ['REPLY']
          });
        }
        return false;
      }

      // Detect perfect day opportunities
      const perfectDays = await travelService.getPerfectDayOpportunities();
      
      // Get current travel insights
      const travelInsights = travelService.getTravelInsights();
      
      // Get curated hotels
      const curatedHotels = travelService.getCuratedHotels();

      // Format the response
      let responseText = "🏨 **Hotel Rate Intelligence Report**\n\n";
      
      if (perfectDays.length > 0) {
        responseText += "🎯 **Perfect Day Opportunities**\n\n";
        perfectDays.forEach((opportunity, index) => {
          const urgencyEmoji = opportunity.urgency === 'high' ? '🚨' : 
                              opportunity.urgency === 'medium' ? '⚠️' : '📊';
          
          responseText += `${urgencyEmoji} **${opportunity.hotelName}**\n`;
          responseText += `📅 Perfect Date: ${opportunity.perfectDate}\n`;
          responseText += `💰 Current Rate: €${opportunity.currentRate}\n`;
          responseText += `📈 Average Rate: €${opportunity.averageRate}\n`;
          responseText += `💎 Savings: ${opportunity.savingsPercentage.toFixed(1)}%\n`;
          responseText += `🎯 Confidence: ${(opportunity.confidenceScore * 100).toFixed(0)}%\n`;
          
          if (opportunity.reasons.length > 0) {
            responseText += `📋 Reasons: ${opportunity.reasons.join(', ')}\n`;
          }
          responseText += '\n';
        });
      } else {
        responseText += "📊 No exceptional rate opportunities detected at the moment.\n\n";
      }

      // Add market insights
      if (travelInsights) {
        responseText += "📊 **Market Insights**\n\n";
        responseText += `📈 Trend: ${travelInsights.marketTrends.trend}\n`;
        responseText += `🎯 Confidence: ${(travelInsights.marketTrends.confidence * 100).toFixed(0)}%\n`;
        responseText += `⏰ Timeframe: ${travelInsights.marketTrends.timeframe}\n\n`;
      }

      // Add top luxury destinations
      responseText += "🌟 **Curated Luxury Destinations**\n\n";
      const topHotels = curatedHotels.slice(0, 3);
      topHotels.forEach(hotel => {
        responseText += `🏛️ **${hotel.name}** (${hotel.city})\n`;
        responseText += `⭐ ${hotel.starRating} stars | ${hotel.category}\n`;
        responseText += `💰 Price Range: €${hotel.priceRange.min} - €${hotel.priceRange.max}\n`;
        responseText += `📍 ${hotel.address}\n\n`;
      });

      // Add recommendations
      responseText += "💡 **Recommendations**\n\n";
      if (perfectDays.length > 0) {
        const bestOpportunity = perfectDays[0];
        responseText += `🎯 **Best Opportunity**: ${bestOpportunity.hotelName} on ${bestOpportunity.perfectDate}\n`;
        responseText += `💎 Save ${bestOpportunity.savingsPercentage.toFixed(1)}% compared to average rates\n\n`;
      }
      
      responseText += "📋 **Next Steps**\n";
      responseText += "• Monitor rates daily for new opportunities\n";
      responseText += "• Book early for peak season travel\n";
      responseText += "• Consider flexible dates for better rates\n";
      responseText += "• Sign up for rate alerts on preferred hotels\n";

      if (callback) {
        await callback({
          thought: `Analyzed hotel rate intelligence and found ${perfectDays.length} perfect day opportunities. The best opportunity is ${perfectDays[0]?.hotelName || 'none available'} with ${perfectDays[0]?.savingsPercentage.toFixed(1) || 0}% savings.`,
          text: responseText,
          actions: ['HOTEL_RATE_INTELLIGENCE']
        });
      }

      return true;

    } catch (error) {
      console.error('Error in hotel rate intelligence action:', error);
      
      if (callback) {
        await callback({
          thought: 'Encountered an error while analyzing hotel rates',
          text: "I encountered an issue while analyzing hotel rates. Please try again later or contact support if the problem persists.",
          actions: ['REPLY']
        });
      }
      
      return false;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: { text: 'Show me the best hotel deals for luxury European destinations' },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🏨 **Hotel Rate Intelligence Report**\n\n🎯 **Perfect Day Opportunities**\n\n🚨 **Hôtel du Palais**\n📅 Perfect Date: 2024-03-15\n💰 Current Rate: €450\n📈 Average Rate: €800\n💎 Savings: 43.8%\n🎯 Confidence: 85%\n📋 Reasons: Off-season rates, low occupancy\n\n🌟 **Curated Luxury Destinations**\n\n🏛️ **Hôtel du Palais** (biarritz)\n⭐ 5 stars | palace\n💰 Price Range: €400 - €2000\n📍 1 Avenue de l\'Impératrice, 64200 Biarritz\n\n💡 **Recommendations**\n\n🎯 **Best Opportunity**: Hôtel du Palais on 2024-03-15\n💎 Save 43.8% compared to average rates\n\n📋 **Next Steps**\n• Monitor rates daily for new opportunities\n• Book early for peak season travel\n• Consider flexible dates for better rates\n• Sign up for rate alerts on preferred hotels',
          actions: ['HOTEL_RATE_INTELLIGENCE'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'What are the perfect days for booking luxury hotels?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: '🎯 **Perfect Day Opportunities**\n\n🚨 **Hôtel Villa Eugénie**\n📅 Perfect Date: 2024-04-20\n💰 Current Rate: €380\n📈 Average Rate: €650\n💎 Savings: 41.5%\n🎯 Confidence: 78%\n📋 Reasons: Spring shoulder season, special promotion\n\n⚠️ **Hôtel de Paris Monte-Carlo**\n📅 Perfect Date: 2024-05-10\n💰 Current Rate: €1200\n📈 Average Rate: €1800\n💎 Savings: 33.3%\n🎯 Confidence: 72%\n📋 Reasons: Pre-summer rates, Grand Prix preparation\n\n💡 **Market Insights**\n\n📈 Trend: decreasing\n🎯 Confidence: 65%\n⏰ Timeframe: next 3 months\n\n🎯 **Best Opportunity**: Hôtel Villa Eugénie on 2024-04-20\n💎 Save 41.5% compared to average rates',
          actions: ['HOTEL_RATE_INTELLIGENCE'],
        },
      },
    ],
  ],
}; 