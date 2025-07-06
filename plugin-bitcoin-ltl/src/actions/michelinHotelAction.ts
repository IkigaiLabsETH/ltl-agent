import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { MichelinGuideService } from '../services/MichelinGuideService';

export const michelinHotelAction: Action = {
  name: 'MICHELIN_HOTEL_RECOMMENDATION',
  similes: ['FOODIE_HOTEL', 'MICHELIN_HOTEL', 'GOURMET_STAY'],
  description: 'Recommends a Michelin-starred hotel with foodie culture and Bitcoin lifestyle context.',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => true,
  handler: async (runtime, message, state, _options, callback: HandlerCallback) => {
    const service = runtime.getService('michelin-guide') as MichelinGuideService;
    if (!service) {
      await callback({
        text: 'Michelin hotel recommendation service is unavailable. Please try again later.',
        thought: 'MichelinGuideService not found.',
        actions: ['MICHELIN_HOTEL_RECOMMENDATION']
      });
      return false;
    }
    try {
      const hotels = await service.getMichelinStarredHotels();
      if (!hotels || hotels.length === 0) {
        await callback({
          text: 'No Michelin-starred hotels found for your criteria.',
          thought: 'No hotels returned.',
          actions: ['MICHELIN_HOTEL_RECOMMENDATION']
        });
        return false;
      }
      const hotel = hotels[0];
      await callback({
        text: `🏨 MICHELIN HOTEL: ${hotel.name}\n⭐ Michelin Restaurants: ${hotel.michelinRestaurants.map(r => r.name + ' (' + r.stars + '★)').join(', ')}\n🍽️ Foodie Culture: ${hotel.foodieCulture.join(', ')}\n🍽️ Room Service: ${hotel.roomServiceQuality}\n🥗 Bistro Quality: ${hotel.bistroQuality}\n💎 Culinary Heritage: ${hotel.culinaryPhilosophy}\n${hotel.bitcoinLifestyle.join(' | ')}`,
        thought: 'Provided Michelin hotel recommendation.',
        actions: ['MICHELIN_HOTEL_RECOMMENDATION']
      });
      return true;
    } catch (err) {
      await callback({
        text: 'Unable to fetch Michelin hotel recommendation at this time.',
        thought: String(err),
        actions: ['MICHELIN_HOTEL_RECOMMENDATION']
      });
      return false;
    }
  },
  examples: [
    [
      { name: 'User', content: { text: 'Recommend a Michelin-starred hotel.' } },
      { name: 'Agent', content: { text: '🏨 MICHELIN HOTEL: ... (see above for format)' } }
    ]
  ]
}; 