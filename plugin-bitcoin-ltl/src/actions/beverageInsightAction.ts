import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { BeverageKnowledgeService } from '../services/BeverageKnowledgeService';

export const beverageInsightAction: Action = {
  name: 'BEVERAGE_INSIGHT',
  similes: ['TEA_TIP', 'COFFEE_INSIGHT', 'WINE_KNOWLEDGE'],
  description: 'Provides daily tea, coffee, and wine insights with cultural and Bitcoin context.',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => true,
  handler: async (runtime, message, state, _options, callback: HandlerCallback) => {
    const service = runtime.getService('beverage-knowledge') as BeverageKnowledgeService;
    if (!service) {
      await callback({
        text: 'Beverage knowledge service is unavailable. Please try again later.',
        thought: 'BeverageKnowledgeService not found.',
        actions: ['BEVERAGE_INSIGHT']
      });
      return false;
    }
    try {
      const tea = await service.getDailyTeaTip();
      const coffee = await service.getDailyCoffeeTip();
      const wine = await service.getDailyWineTip();
      await callback({
        text: `☕ TEA: ${tea.teaType} from ${tea.region} - ${tea.dailyTip}\n🍫 COFFEE: ${coffee.coffeeType} from ${coffee.region} - ${coffee.dailyTip}\n🍷 WINE: ${wine.wineType} from ${wine.region} - ${wine.investmentPotential}\n\n💎 Bitcoin Lifestyle: ${[...tea.bitcoinLifestyle, ...coffee.bitcoinLifestyle, ...wine.bitcoinLifestyle].join(', ')}`,
        thought: 'Provided beverage insights.',
        actions: ['BEVERAGE_INSIGHT']
      });
      return true;
    } catch (err) {
      await callback({
        text: 'Unable to fetch beverage insights at this time.',
        thought: String(err),
        actions: ['BEVERAGE_INSIGHT']
      });
      return false;
    }
  },
  examples: [
    [
      { name: 'User', content: { text: 'Give me today\'s beverage insights.' } },
      { name: 'Agent', content: { text: '☕ TEA: ... (see above for format)' } }
    ]
  ]
}; 