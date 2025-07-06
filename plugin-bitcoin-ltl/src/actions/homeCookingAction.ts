import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { HomeCookingService } from '../services/HomeCookingService';

export const homeCookingAction: Action = {
  name: 'HOME_COOKING',
  similes: ['COOK_AT_HOME', 'BBQ_EXPERIENCE', 'THERMOMIX_RECIPE'],
  description: 'Provides a home cooking experience with Green Egg BBQ or Thermomix, including culinary technique and Bitcoin context.',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => true,
  handler: async (runtime, message, state, _options, callback: HandlerCallback) => {
    const service = runtime.getService('home-cooking') as HomeCookingService;
    if (!service) {
      await callback({
        text: 'Home cooking service is unavailable. Please try again later.',
        thought: 'HomeCookingService not found.',
        actions: ['HOME_COOKING']
      });
      return false;
    }
    try {
      const experience = await service.getDailyCookingExperience();
      await callback({
        text: `🔥 HOME COOKING: ${experience.recipe.name} with ${experience.type === 'green-egg-bbq' ? 'Green Egg BBQ' : 'Thermomix'}\n🌿 Technique Focus: ${experience.techniqueFocus}\n🍽️ Cultural Context: ${experience.culturalContext}\n💎 Bitcoin Lifestyle: ${experience.bitcoinLifestyle.join(', ')}\n🍷 Wine Pairing: ${experience.winePairing}`,
        thought: 'Provided home cooking experience.',
        actions: ['HOME_COOKING']
      });
      return true;
    } catch (err) {
      await callback({
        text: 'Unable to fetch home cooking experience at this time.',
        thought: String(err),
        actions: ['HOME_COOKING']
      });
      return false;
    }
  },
  examples: [
    [
      { name: 'User', content: { text: 'Suggest a home cooking experience.' } },
      { name: 'Agent', content: { text: '🔥 HOME COOKING: ... (see above for format)' } }
    ]
  ]
}; 