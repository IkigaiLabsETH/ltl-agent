import { 
  Action,
  IAgentRuntime,
  Memory, 
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { RealTimeDataService } from '../services/RealTimeDataService';

export const bitcoinNetworkHealthAction: Action = {
  name: 'BITCOIN_NETWORK_HEALTH',
  similes: [
    'BITCOIN_STATUS',
    'BITCOIN_NETWORK_STATUS', 
    'BITCOIN_METRICS',
    'BITCOIN_HEALTH_CHECK',
    'BITCOIN_STATS',
    'BITCOIN_NETWORK_STATS',
    'BTC_HEALTH',
    'BTC_STATUS',
    'BTC_METRICS',
    'BTC_STATS',
    'BITCOIN_OVERVIEW',
    'BITCOIN_DASHBOARD',
    'BITCOIN_NETWORK_OVERVIEW'
  ],
  description: 'Provides comprehensive Bitcoin network health metrics including price, hash rate, difficulty, mempool status, and sentiment analysis',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    
    // Trigger on Bitcoin network health queries
    const triggers = [
      'bitcoin health', 'bitcoin network', 'btc health', 'btc network',
      'bitcoin status', 'bitcoin stats', 'bitcoin metrics', 'bitcoin overview',
      'bitcoin dashboard', 'network health', 'bitcoin security', 'bitcoin mining',
      'bitcoin price', 'bitcoin hash rate', 'bitcoin difficulty', 'bitcoin mempool',
      'bitcoin sentiment', 'bitcoin fear greed', 'bitcoin halving', 'bitcoin supply',
      'bitcoin block', 'bitcoin fees', 'bitcoin miner', 'bitcoin node',
      'how is bitcoin', 'bitcoin network stats', 'bitcoin performance',
      'bitcoin fundamentals', 'bitcoin on chain', 'bitcoin analysis'
    ];
    
    return triggers.some(trigger => text.includes(trigger));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback
  ) => {
    try {
      const realTimeDataService = runtime.getService('real-time-data') as RealTimeDataService;
      
      if (!realTimeDataService) {
        callback({
          text: "Bitcoin network monitoring unavailable. The timechain continues regardless - 21 million coins, immutable monetary policy, proof of work security.",
          action: 'BITCOIN_NETWORK_HEALTH'
        });
        return;
      }

      // Get comprehensive Bitcoin data
      const bitcoinData = realTimeDataService.getComprehensiveBitcoinData();
      
      if (!bitcoinData) {
        callback({
          text: "Bitcoin network data temporarily unavailable. The protocol runs independently - no central authority, no single point of failure. 21 million coins maximum, forever.",
          action: 'BITCOIN_NETWORK_HEALTH'
        });
        return;
      }

      // Extract key metrics
      const price = bitcoinData.price.usd;
      const change24h = bitcoinData.price.change24h;
      const blockHeight = bitcoinData.network.blockHeight;
      const hashRate = bitcoinData.network.hashRate;
      const difficulty = bitcoinData.network.difficulty;
      const avgBlockTime = bitcoinData.network.avgBlockTime;
      const nextHalvingBlocks = bitcoinData.network.nextHalving?.blocks;
      const nextHalvingDate = bitcoinData.network.nextHalving?.estimatedDate;
      const mempoolSize = bitcoinData.network.mempoolSize;
      const mempoolTxs = bitcoinData.network.mempoolTxs;
      const fastestFee = bitcoinData.network.mempoolFees?.fastestFee;
      const economyFee = bitcoinData.network.mempoolFees?.economyFee;
      const fearGreed = bitcoinData.sentiment.fearGreedIndex;
      const fearGreedValue = bitcoinData.sentiment.fearGreedValue;
      const totalBTC = bitcoinData.network.totalBTC;

      // Calculate network security metrics
      const hashRateEH = hashRate ? (hashRate / 1e18).toFixed(2) : 'N/A';
      const difficultyT = difficulty ? (difficulty / 1e12).toFixed(2) : 'N/A';
      const mempoolSizeMB = mempoolSize ? (mempoolSize / 1e6).toFixed(2) : 'N/A';
      const circulatingSupply = totalBTC ? (totalBTC / 1e6).toFixed(2) : '19.7';
      const supplyProgress = totalBTC ? ((totalBTC / 21000000) * 100).toFixed(2) : '93.8';

      // Calculate halving progress
      const halvingProgress = nextHalvingBlocks ? (((210000 - nextHalvingBlocks) / 210000) * 100).toFixed(1) : 'N/A';
      const halvingDateStr = nextHalvingDate ? new Date(nextHalvingDate).toLocaleDateString() : 'N/A';

      // Price analysis
      const priceDirection = change24h > 0 ? '📈' : change24h < 0 ? '📉' : '➡️';
      const priceChangeStr = change24h > 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;

      // Network security status
      const networkSecurityStatus = hashRate > 5e20 ? 'FORTRESS' : hashRate > 3e20 ? 'STRONG' : 'MODERATE';
      
      // Sentiment analysis
      const sentimentEmoji = fearGreed > 75 ? '🔥' : fearGreed > 50 ? '💚' : fearGreed > 25 ? '😐' : '😰';
      
      // Mempool congestion level
      const mempoolStatus = mempoolTxs > 100000 ? 'HIGH' : mempoolTxs > 50000 ? 'MODERATE' : 'LOW';
      
      const responseText = `🟠 BITCOIN NETWORK HEALTH REPORT

💰 PRICE & MARKET
├─ Current Price: $${price?.toLocaleString()} ${priceDirection} (${priceChangeStr})
├─ Market Sentiment: ${sentimentEmoji} ${fearGreed}/100 (${fearGreedValue})
└─ Supply: ${circulatingSupply}M BTC of 21M max (${supplyProgress}% mined)

🛡️ NETWORK SECURITY
├─ Hash Rate: ${hashRateEH} EH/s (${networkSecurityStatus})
├─ Difficulty: ${difficultyT}T
├─ Block Height: ${blockHeight?.toLocaleString()}
└─ Avg Block Time: ${avgBlockTime?.toFixed(1)} minutes

⛏️ MINING & HALVING
├─ Next Halving: ${nextHalvingBlocks?.toLocaleString()} blocks
├─ Estimated Date: ${halvingDateStr}
└─ Cycle Progress: ${halvingProgress}%

📊 MEMPOOL STATUS
├─ Congestion: ${mempoolStatus}
├─ Size: ${mempoolSizeMB} MB
├─ Transactions: ${mempoolTxs?.toLocaleString()}
├─ Fastest Fee: ${fastestFee} sat/vB
└─ Economy Fee: ${economyFee} sat/vB

🟠 ASSESSMENT: Bitcoin network operating as designed. ${networkSecurityStatus} security through proof of work. No central authority, no single point of failure. 21 million coin limit immutable. Sound money for the digital age.`;

      callback({
        text: responseText,
        action: 'BITCOIN_NETWORK_HEALTH'
      });

    } catch (error) {
      console.error('Error in bitcoin network health action:', error);
      callback({
        text: "Bitcoin network monitoring error. Remember: Bitcoin operates independently of any centralized service. The protocol guarantees 21 million coins, proof of work consensus, and permissionless transactions.",
        action: 'BITCOIN_NETWORK_HEALTH'
      });
    }
  },
  examples: []
}; 