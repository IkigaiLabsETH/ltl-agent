import {
  type Action,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
  type ActionExample,
  logger,
} from '@elizaos/core';
import { RealTimeDataService, type CuratedAltcoinsData } from '../services/RealTimeDataService';

export const curatedAltcoinsAction: Action = {
  name: 'CURATED_ALTCOINS',
  similes: [
    'ALTCOIN_ANALYSIS',
    'CURATED_COINS',
    'ALTCOIN_PERFORMANCE',
    'PORTFOLIO_COINS',
    'SELECTED_ALTCOINS'
  ],
  description: 'Analyzes performance of curated altcoins from LiveTheLifeTV portfolio including ETH, SOL, SUI, HYPE, and memecoins',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const triggers = [
      'altcoin', 'altcoins', 'eth', 'ethereum', 'solana', 'sol', 'sui', 'hyperliquid', 'hype',
      'chainlink', 'link', 'uniswap', 'uni', 'aave', 'ondo', 'ethena', 'ena', 
      'berachain', 'bera', 'avalanche', 'avax', 'stacks', 'stx', 'dogecoin', 'doge',
      'pepe', 'mog', 'bittensor', 'tao', 'render', 'rndr', 'fartcoin', 'railgun',
      'portfolio', 'curated', 'performance', 'gains', 'pumping', 'mooning'
    ];
    
    const content = message.content.text.toLowerCase();
    return triggers.some(trigger => content.includes(trigger));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const service = runtime.getService('real-time-data') as RealTimeDataService;
      
      if (!service) {
        logger.error('RealTimeDataService not available for curated altcoins action');
        return false;
      }

      const curatedData = service.getCuratedAltcoinsData();
      
      if (!curatedData) {
        if (callback) {
          callback({
            text: "Curated altcoins data not available right now. Markets updating every minute.",
            content: { error: "Data unavailable" }
          });
        }
        return false;
      }

      // Analyze the curated data
      const analysis = analyzeCuratedAltcoins(curatedData);
      
      const responseText = formatCuratedAnalysis(analysis, curatedData);

      if (callback) {
        callback({
          text: responseText,
          content: {
            analysis,
            timestamp: new Date().toISOString(),
            source: 'curated-altcoins'
          }
        });
      }

      return true;
    } catch (error) {
      logger.error('Error in curated altcoins action:', error);
      if (callback) {
        callback({
          text: "Error analyzing curated altcoins. Markets are volatile beasts.",
          content: { error: error.message }
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are the altcoins performing?" }
      },
      {
        name: "Satoshi",
        content: { 
          text: "ETH: $3,420 (+2.1%). SOL: $198 (+5.7%). SUI: $4.32 (+12.3%). HYPE: $28.91 (+8.4%). The degenerates are pumping while Bitcoin consolidates. DeFi season building momentum.",
          actions: ["CURATED_ALTCOINS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's pumping in our portfolio?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "PEPE: +15.7%, MOG: +23.1%, FARTCOIN: +89.4%. Meme season in full swing. ETH and SOL holding steady while the casino coins print. Risk accordingly.",
          actions: ["CURATED_ALTCOINS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Show me Hyperliquid performance" }
      },
      {
        name: "Satoshi",
        content: {
          text: "HYPE: $28.91 (+8.4% 24h). Volume: $45M. Market cap: $9.7B. The Hyperliquid thesis playing out - decentralized perps exchange capturing market share from centralized casinos.",
          actions: ["CURATED_ALTCOINS"]
        }
      }
    ]
  ]
};

interface CuratedAnalysis {
  topPerformers: Array<{ symbol: string; price: number; change24h: number }>;
  worstPerformers: Array<{ symbol: string; price: number; change24h: number }>;
  totalPositive: number;
  totalNegative: number;
  avgPerformance: number;
  marketSentiment: 'bullish' | 'bearish' | 'mixed' | 'consolidating';
  memecoinsPerformance: number;
  defiPerformance: number;
  layer1Performance: number;
}

function analyzeCuratedAltcoins(data: CuratedAltcoinsData): CuratedAnalysis {
  const coins = Object.entries(data);
  
  // Sort by performance
  const sorted = coins.sort((a, b) => b[1].change24h - a[1].change24h);
  
  const topPerformers = sorted.slice(0, 3).map(([symbol, data]) => ({
    symbol: symbol.toUpperCase(),
    price: data.price,
    change24h: data.change24h
  }));
  
  const worstPerformers = sorted.slice(-3).map(([symbol, data]) => ({
    symbol: symbol.toUpperCase(),  
    price: data.price,
    change24h: data.change24h
  }));
  
  const totalPositive = coins.filter(([, data]) => data.change24h > 0).length;
  const totalNegative = coins.filter(([, data]) => data.change24h < 0).length;
  
  const avgPerformance = coins.reduce((sum, [, data]) => sum + data.change24h, 0) / coins.length;
  
  // Categorize performance
  const memecoins = ['dogecoin', 'pepe', 'mog-coin', 'fartcoin'];
  const defiCoins = ['uniswap', 'aave', 'chainlink', 'ethena', 'ondo-finance'];
  const layer1s = ['ethereum', 'solana', 'sui', 'avalanche-2', 'blockstack'];
  
  const memecoinsPerformance = calculateCategoryPerformance(data, memecoins);
  const defiPerformance = calculateCategoryPerformance(data, defiCoins);
  const layer1Performance = calculateCategoryPerformance(data, layer1s);
  
  let marketSentiment: 'bullish' | 'bearish' | 'mixed' | 'consolidating';
  if (avgPerformance > 5) marketSentiment = 'bullish';
  else if (avgPerformance < -5) marketSentiment = 'bearish';
  else if (Math.abs(avgPerformance) < 2) marketSentiment = 'consolidating';
  else marketSentiment = 'mixed';
  
  return {
    topPerformers,
    worstPerformers,
    totalPositive,
    totalNegative,
    avgPerformance,
    marketSentiment,
    memecoinsPerformance,
    defiPerformance,
    layer1Performance
  };
}

function calculateCategoryPerformance(data: CuratedAltcoinsData, category: string[]): number {
  const categoryCoins = category.filter(coin => data[coin]);
  if (categoryCoins.length === 0) return 0;
  
  return categoryCoins.reduce((sum, coin) => sum + data[coin].change24h, 0) / categoryCoins.length;
}

function formatCuratedAnalysis(analysis: CuratedAnalysis, data: CuratedAltcoinsData): string {
  const { topPerformers, marketSentiment, avgPerformance } = analysis;
  
  // Format top performers
  const topPerformersText = topPerformers
    .map(p => `${getCoinSymbol(p.symbol)}: $${p.price.toFixed(2)} (${p.change24h > 0 ? '+' : ''}${p.change24h.toFixed(1)}%)`)
    .join(', ');
  
  // Market sentiment context
  let sentimentText = '';
  switch (marketSentiment) {
    case 'bullish':
      sentimentText = 'Altcoin season building momentum.';
      break;
    case 'bearish':
      sentimentText = 'Altcoins bleeding. Bitcoin dominance rising.';
      break;
    case 'mixed':
      sentimentText = 'Mixed signals across altcoins.';
      break;
    case 'consolidating':
      sentimentText = 'Altcoins consolidating. Waiting for next move.';
      break;
  }
  
  // Add category insights
  let categoryInsights = '';
  if (analysis.memecoinsPerformance > 10) {
    categoryInsights += ' Memecoins pumping hard - degeneracy in full swing.';
  } else if (analysis.defiPerformance > 5) {
    categoryInsights += ' DeFi showing strength - protocol value accruing.';
  } else if (analysis.layer1Performance > 3) {
    categoryInsights += ' Layer 1s leading - infrastructure adoption.';
  }
  
  return `${topPerformersText}. ${sentimentText}${categoryInsights} Portfolio avg: ${avgPerformance > 0 ? '+' : ''}${avgPerformance.toFixed(1)}%.`;
}

function getCoinSymbol(coinId: string): string {
  const symbolMap: { [key: string]: string } = {
    'ETHEREUM': 'ETH',
    'CHAINLINK': 'LINK', 
    'UNISWAP': 'UNI',
    'AAVE': 'AAVE',
    'ONDO-FINANCE': 'ONDO',
    'ETHENA': 'ENA',
    'SOLANA': 'SOL',
    'SUI': 'SUI',
    'HYPERLIQUID': 'HYPE',
    'BERACHAIN-BERA': 'BERA',
    'INFRAFRED-BGT': 'BGT',
    'AVALANCHE-2': 'AVAX',
    'BLOCKSTACK': 'STX',
    'DOGECOIN': 'DOGE',
    'PEPE': 'PEPE',
    'MOG-COIN': 'MOG',
    'BITTENSOR': 'TAO',
    'RENDER-TOKEN': 'RNDR',
    'FARTCOIN': 'FART',
    'RAILGUN': 'RAIL'
  };
  
  return symbolMap[coinId] || coinId;
} 