import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { LifestyleDataService } from '../services/LifestyleDataService';

export const restaurantRecommendationAction: Action = {
  name: 'RESTAURANT_RECOMMENDATION',
  similes: ['RESTAURANT_SUGGESTION', 'FINE_DINING', 'FOODIE_RECOMMENDATION'],
  description: 'Recommends a curated restaurant with cultural, luxury, and Bitcoin context.',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => true,
  handler: async (runtime, message, state, _options, callback: HandlerCallback) => {
    const service = runtime.getService('lifestyle-data') as LifestyleDataService;
    if (!service) {
      await callback({
        text: 'Restaurant recommendation service is unavailable. Please try again later.',
        thought: 'LifestyleDataService not found.',
        actions: ['RESTAURANT_RECOMMENDATION']
      });
      return false;
    }
    try {
      const suggestion = await service.getDailyRestaurantSuggestion();
      await callback({
        text: `🍴 RESTAURANT: ${suggestion.restaurant.name}\n🏛️ Cultural Heritage: ${suggestion.culturalSignificance}\n💎 Signature Dishes: ${suggestion.recommendedDishes.join(', ')}\n🍷 Wine Pairing: ${suggestion.winePairing}\n${suggestion.googleVerificationAvailable ? `✅ GOOGLE VERIFIED: ${suggestion.googleStatus?.isOpen ? 'Currently OPEN' : 'Currently CLOSED'}${suggestion.googleStatus?.todayHours ? ' (' + suggestion.googleStatus.todayHours + ')' : ''}` : 'ℹ️ STATUS: Hours verification unavailable - please check directly'}\n\n${suggestion.bitcoinLifestyle.join(' | ')}`,
        thought: 'Provided restaurant recommendation with context.',
        actions: ['RESTAURANT_RECOMMENDATION']
      });
      return true;
    } catch (err) {
      await callback({
        text: 'Unable to fetch restaurant recommendation at this time.',
        thought: String(err),
        actions: ['RESTAURANT_RECOMMENDATION']
      });
      return false;
    }
  },
  examples: [
    [
      { name: 'User', content: { text: 'Suggest a restaurant for tonight.' } },
      { name: 'Agent', content: { text: '🍴 RESTAURANT: ... (see above for format)' } }
    ]
  ]
}; 