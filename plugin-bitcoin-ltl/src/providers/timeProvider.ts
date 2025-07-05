import { Provider, IAgentRuntime, Memory } from '@elizaos/core';

/**
 * Time Provider - Fundamental time information
 * Following ElizaOS documentation patterns
 * Position: -10 (runs early to ensure time is available for other providers)
 */
export const timeProvider: Provider = {
  name: 'time',
  description: 'Provides current date and time context for Bitcoin and market operations',
  position: -10, // Run early to ensure time is available for other providers
  
  get: async (_runtime: IAgentRuntime, _message: Memory) => {
    const currentDate = new Date();
    const options = {
      timeZone: 'UTC',
      dateStyle: 'full' as const,
      timeStyle: 'long' as const,
    };
    const humanReadable = new Intl.DateTimeFormat('en-US', options).format(currentDate);
    
    // Market hours context
    const marketHours = getCurrentMarketHours();
    
    return {
      text: `Current time: ${humanReadable}. ${marketHours.status}. ${marketHours.nextEvent}`,
      values: {
        currentDate: currentDate.toISOString(),
        humanReadableDate: humanReadable,
        timestamp: currentDate.getTime(),
        marketHours: marketHours.status,
        nextMarketEvent: marketHours.nextEvent,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        hour: currentDate.getHours(),
        day: currentDate.getDay(),
        utcHour: currentDate.getUTCHours(),
        utcDay: currentDate.getUTCDay(),
      },
    };
  },
};

/**
 * Helper function to determine market hours context
 */
function getCurrentMarketHours(): { status: string; nextEvent: string } {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const day = now.getUTCDay();
  
  // Bitcoin markets are 24/7
  // Traditional markets: Mon-Fri 9:30AM-4:00PM EST (14:30-21:00 UTC)
  const isWeekend = day === 0 || day === 6;
  const isTraditionalMarketHours = !isWeekend && utcHour >= 14 && utcHour < 21;
  
  if (isWeekend) {
    return {
      status: 'Traditional markets closed (weekend). Bitcoin markets active 24/7',
      nextEvent: 'Traditional markets open Monday 9:30AM EST (14:30 UTC)'
    };
  } else if (isTraditionalMarketHours) {
    return {
      status: 'Traditional markets open. Bitcoin markets active 24/7',
      nextEvent: 'Traditional markets close at 4:00PM EST (21:00 UTC)'
    };
  } else {
    return {
      status: 'Traditional markets closed. Bitcoin markets active 24/7',
      nextEvent: 'Traditional markets open at 9:30AM EST (14:30 UTC)'
    };
  }
} 