import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { DailyCulinaryService } from '../services/DailyCulinaryService';

export const dailyCulinaryAction: Action = {
  name: 'DAILY_CULINARY',
  similes: ['CULINARY_EXPERIENCE', 'DAILY_FOODIE', 'FOODIE_RITUAL'],
  description: 'Provides a full daily culinary experience: restaurant, home cooking, beverage tips, and Bitcoin lifestyle context.',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => true,
  handler: async (runtime, message, state, _options, callback: HandlerCallback) => {
    const service = runtime.getService('daily-culinary') as DailyCulinaryService;
    if (!service) {
      await callback({
        text: 'Culinary intelligence is temporarily unavailable. Please try again later.',
        thought: 'DailyCulinaryService not found.',
        actions: ['DAILY_CULINARY']
      });
      return false;
    }
    try {
      const experience = await service.getDailyCulinaryExperience();
      await callback({
        text: `🍽️ DAILY CULINARY EXPERIENCE\n\n🍴 RESTAURANT: ${experience.restaurant.restaurant.name} - ${experience.restaurant.culturalSignificance}\n🏨 MICHELIN HOTEL: ${experience.restaurant.restaurant.michelinStars ? experience.restaurant.restaurant.name + ' with ' + experience.restaurant.restaurant.michelinStars + ' Michelin stars' : 'No Michelin hotel today'}\n🔥 HOME COOKING: ${experience.homeCooking.recipe.name} with ${experience.homeCooking.type === 'green-egg-bbq' ? 'Green Egg BBQ' : 'Thermomix'} - ${experience.homeCooking.techniqueFocus}\n☕ TEA: ${experience.teaTip.teaType} from ${experience.teaTip.region} - ${experience.teaTip.dailyTip}\n🍷 WINE: ${experience.wineTip.wineType} from ${experience.wineTip.region} - ${experience.wineTip.investmentPotential}\n\n💎 WEALTH PRESERVATION: ${experience.wealthPreservation.join(', ')}`,
        thought: 'Composed full daily culinary experience.',
        actions: ['DAILY_CULINARY']
      });
      return true;
    } catch (err) {
      await callback({
        text: 'Unable to fetch the full culinary experience. Some data may be missing.',
        thought: String(err),
        actions: ['DAILY_CULINARY']
      });
      return false;
    }
  },
  examples: [
    [
      { name: 'User', content: { text: "What's today's culinary experience?" } },
      { name: 'Agent', content: { text: '🍽️ DAILY CULINARY EXPERIENCE... (see above for format)' } }
    ]
  ]
}; 