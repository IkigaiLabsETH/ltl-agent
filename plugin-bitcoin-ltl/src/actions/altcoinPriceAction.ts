import { Action, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';

// Coin data interface
interface CoinData {
  usd?: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
}

// Coin ID mapping for common altcoins
const COIN_ID_MAP: Record<string, string> = {
  'eth': 'ethereum',
  'ethereum': 'ethereum',
  'sol': 'solana',
  'solana': 'solana',
  'sui': 'sui',
  'hype': 'hyperliquid',
  'hyperliquid': 'hyperliquid',
  'pepe': 'pepe',
  'wif': 'dogwifhat',
  'dogwifhat': 'dogwifhat',
  'bonk': 'bonk',
  'jup': 'jupiter',
  'jupiter': 'jupiter',
  'ray': 'raydium',
  'raydium': 'raydium',
  'uni': 'uniswap',
  'uniswap': 'uniswap',
  'aave': 'aave',
  'comp': 'compound',
  'compound': 'compound',
  'link': 'chainlink',
  'chainlink': 'chainlink',
  'matic': 'polygon',
  'polygon': 'polygon',
  'avax': 'avalanche-2',
  'avalanche': 'avalanche-2',
  'ada': 'cardano',
  'cardano': 'cardano',
  'dot': 'polkadot',
  'polkadot': 'polkadot',
  'atom': 'cosmos',
  'cosmos': 'cosmos',
  'near': 'near',
  'apt': 'aptos',
  'aptos': 'aptos'
};

/**
 * Altcoin Price Action - Get specific altcoin prices
 * Supports individual coin queries and portfolio overview
 */
export const altcoinPriceAction: Action = {
  name: 'GET_ALTCOIN_PRICE',
  similes: ['ALTCOIN_PRICE', 'COIN_PRICE', 'CRYPTO_PRICE', 'TOKEN_PRICE', 'CHECK_ALTCOIN'],
  description: 'Get current prices for specific altcoins or curated portfolio overview',
  
  validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    
    // Check for specific coin mentions
    const mentionedCoins = Object.keys(COIN_ID_MAP).filter(coin => 
      text.includes(coin.toLowerCase())
    );
    
    // Check for general altcoin/crypto terms
    const generalTerms = ['altcoin', 'crypto', 'token', 'coin', 'price', 'how much', 'worth'];
    const hasGeneralTerms = generalTerms.some(term => text.includes(term));
    
    return mentionedCoins.length > 0 || hasGeneralTerms;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ) => {
    try {
      const text = message.content.text.toLowerCase();
      
      // Extract mentioned coins
      const mentionedCoins = Object.keys(COIN_ID_MAP).filter(coin => 
        text.includes(coin.toLowerCase())
      );
      
      let coinIds: string[] = [];
      
      if (mentionedCoins.length > 0) {
        // Get specific mentioned coins
        coinIds = [...new Set(mentionedCoins.map(coin => COIN_ID_MAP[coin]))];
      } else {
        // Default to major coins if no specific coins mentioned
        coinIds = ['ethereum', 'solana', 'sui', 'hyperliquid'];
      }
      
      // Limit to 10 coins to avoid rate limiting
      coinIds = coinIds.slice(0, 10);
      
      console.log(`[AltcoinPriceAction] Fetching prices for: ${coinIds.join(', ')}`);
      
      // Fetch prices from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ElizaOS-Bitcoin-LTL/1.0'
          },
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as Record<string, CoinData>;
      
      // Format response based on number of coins
      let responseText: string;
      let thought: string;
      
      if (coinIds.length === 1) {
        // Single coin response
        const coinId = coinIds[0];
        const coinData = data[coinId];
        const symbol = getCoinSymbol(coinId);
        
        if (coinData && coinData.usd) {
          const price = coinData.usd;
          const change24h = coinData.usd_24h_change || 0;
          const marketCap = coinData.usd_market_cap || 0;
          const volume24h = coinData.usd_24h_vol || 0;
          
          responseText = `${symbol}: $${price.toLocaleString()} (${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}% 24h). Market cap: $${(marketCap / 1000000000).toFixed(1)}B. Volume: $${(volume24h / 1000000000).toFixed(1)}B.`;
          thought = `User asked about ${symbol} price. Retrieved current price: $${price.toLocaleString()} with ${change24h.toFixed(2)}% 24h change.`;
        } else {
          responseText = `${symbol} price data temporarily unavailable.`;
          thought = `Failed to get ${symbol} price data.`;
        }
      } else {
        // Multiple coins response
        const coinSummaries = Object.entries(data)
          .filter(([_, coinData]) => coinData && coinData.usd)
          .map(([coinId, coinData]) => {
            const symbol = getCoinSymbol(coinId);
            const price = coinData.usd;
            const change24h = coinData.usd_24h_change || 0;
            return `${symbol}: $${price.toLocaleString()} (${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%)`;
          });
        
        responseText = coinSummaries.join('. ') + '.';
        thought = `User asked about altcoin prices. Retrieved prices for ${coinSummaries.length} coins.`;
      }
      
      const responseContent = {
        thought,
        text: responseText,
        actions: ['GET_ALTCOIN_PRICE'],
      };

      if (callback) {
        await callback(responseContent);
      }

      return true;
    } catch (error) {
      console.error('[AltcoinPriceAction] Error:', error);
      
      const errorResponse = {
        thought: 'Failed to get altcoin price data, providing fallback information.',
        text: 'Altcoin price data temporarily unavailable. Markets continue trading.',
        actions: ['GET_ALTCOIN_PRICE'],
      };

      if (callback) {
        await callback(errorResponse);
      }

      return false;
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: { text: 'What is the price of Ethereum?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'ETH: $3,420 (+2.15% 24h). Market cap: $411.2B. Volume: $12.8B.',
          thought: 'User asked about Ethereum price. Retrieved current price: $3,420 with +2.15% 24h change.',
          actions: ['GET_ALTCOIN_PRICE'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'How much is Solana worth?' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'SOL: $198.45 (-1.23% 24h). Market cap: $89.1B. Volume: $2.3B.',
          thought: 'User asked about Solana price. Retrieved current price: $198.45 with -1.23% 24h change.',
          actions: ['GET_ALTCOIN_PRICE'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: { text: 'Show me ETH and SOL prices' },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'ETH: $3,420 (+2.15%). SOL: $198.45 (-1.23%).',
          thought: 'User asked about ETH and SOL prices. Retrieved prices for 2 coins.',
          actions: ['GET_ALTCOIN_PRICE'],
        },
      },
    ],
  ],
};

/**
 * Get coin symbol from coin ID
 */
function getCoinSymbol(coinId: string): string {
  const symbolMap: Record<string, string> = {
    'ethereum': 'ETH',
    'solana': 'SOL',
    'sui': 'SUI',
    'hyperliquid': 'HYPE',
    'pepe': 'PEPE',
    'dogwifhat': 'WIF',
    'bonk': 'BONK',
    'jupiter': 'JUP',
    'raydium': 'RAY',
    'uniswap': 'UNI',
    'aave': 'AAVE',
    'compound': 'COMP',
    'chainlink': 'LINK',
    'polygon': 'MATIC',
    'avalanche-2': 'AVAX',
    'cardano': 'ADA',
    'polkadot': 'DOT',
    'cosmos': 'ATOM',
    'near': 'NEAR',
    'aptos': 'APT'
  };
  
  return symbolMap[coinId] || coinId.toUpperCase();
} 