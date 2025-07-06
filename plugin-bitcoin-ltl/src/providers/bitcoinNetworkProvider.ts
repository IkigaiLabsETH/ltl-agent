import { Provider, type IAgentRuntime, type Memory, type State } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";

/**
 * Bitcoin Network Provider
 * Provides comprehensive Bitcoin network health and metrics
 */
export const bitcoinNetworkProvider: Provider = {
  name: 'BITCOIN_NETWORK',
  description: 'Real-time Bitcoin network health and metrics including price, hash rate, mempool, fees, and network security',
  position: -10, // High priority, runs early

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      // Get the Bitcoin Intelligence Service
      const bitcoinService = runtime.getService("bitcoin-intelligence") as unknown as BitcoinIntelligenceService;
      
      if (!bitcoinService) {
        return {
          text: '⚠️ Bitcoin Intelligence Service not available',
          values: { bitcoinNetworkAvailable: false },
          data: { error: 'Service not found' }
        };
      }

      // Get comprehensive network data
      const networkData = await bitcoinService.getNetworkHealth();
      
      if (!networkData) {
        return {
          text: '⚠️ Bitcoin network data not available',
          values: { bitcoinNetworkAvailable: false },
          data: { error: 'No network data' }
        };
      }

      // Format network status
      const networkStatus = formatNetworkStatus(networkData);
      
      // Determine network health summary
      const healthSummary = getNetworkHealthSummary(networkData);
      
      // Format mempool status
      const mempoolStatus = formatMempoolStatus(networkData);
      
      // Format fee status
      const feeStatus = formatFeeStatus(networkData);

      const providerText = `🟠 BITCOIN NETWORK STATUS - [Live]

💰 Price: $${networkData.price.toLocaleString()} 
📊 Market Cap: $${(networkData.marketCap / 1e9).toFixed(2)}B
🎯 Dominance: ${networkData.dominance.toFixed(2)}%

🔒 Network Security: ${networkData.networkSecurity}
⚡ Hash Rate: ${(networkData.hashRate / 1e18).toFixed(2)} EH/s
📦 Mempool: ${(networkData.mempoolSize / 1e6).toFixed(1)}MB (${networkData.mempoolStatus})
💸 Fee Rate: ${networkData.feeRate.fastest} sat/vB (${networkData.feeStatus})

⚡ Lightning Network: ${networkData.lightningCapacity.toLocaleString()} BTC capacity
👥 Active Addresses: ${networkData.activeAddresses.toLocaleString()} (24h)
💎 Long-Term Holders: ${networkData.longTermHolders.toFixed(1)}% of supply
📈 MVRV Ratio: ${networkData.mvrvRatio.toFixed(1)} (${getMVRVStatus(networkData.mvrvRatio)})

🔄 Exchange Flows: ${formatExchangeFlows(networkData.exchangeFlows)}
📊 Realized Cap: $${(networkData.realizedCap / 1e9).toFixed(1)}B

${healthSummary}

${mempoolStatus}

${feeStatus}

🎯 Next Halving: ${networkData.nextHalving.blocks.toLocaleString()} blocks (${networkData.nextHalving.daysRemaining} days)`;

      return {
        text: providerText,
        values: {
          bitcoinNetworkAvailable: true,
          bitcoinPrice: networkData.price,
          bitcoinMarketCap: networkData.marketCap,
          bitcoinDominance: networkData.dominance,
          bitcoinHashRate: networkData.hashRate,
          bitcoinNetworkSecurity: networkData.networkSecurity,
          bitcoinMempoolStatus: networkData.mempoolStatus,
          bitcoinFeeStatus: networkData.feeStatus,
          bitcoinMVRVRatio: networkData.mvrvRatio,
          bitcoinExchangeFlows: networkData.exchangeFlows,
          bitcoinRealizedCap: networkData.realizedCap,
          bitcoinNextHalvingBlocks: networkData.nextHalving.blocks,
          bitcoinNextHalvingDays: networkData.nextHalving.daysRemaining
        },
        data: {
          networkData: networkData,
          healthSummary: healthSummary,
          mempoolStatus: mempoolStatus,
          feeStatus: feeStatus,
          lastUpdated: new Date()
        }
      };

    } catch (error) {
      console.error('Error in bitcoinNetworkProvider:', error);
      return {
        text: '❌ Error fetching Bitcoin network data',
        values: { bitcoinNetworkAvailable: false },
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
};

/**
 * Format network status with emojis and status indicators
 */
function formatNetworkStatus(networkData: any): string {
  const status = networkData.networkSecurity;
  const statusEmoji = {
    'EXCELLENT': '🟢',
    'GOOD': '🟡',
    'WARNING': '🟠',
    'CRITICAL': '🔴'
  }[status] || '⚪';

  return `${statusEmoji} Network Status: ${status}`;
}

/**
 * Get network health summary based on key metrics
 */
function getNetworkHealthSummary(networkData: any): string {
  const indicators = [];
  
  // Hash rate analysis
  if (networkData.hashRate > 800) {
    indicators.push('⚡ Hash rate at all-time high - network security excellent');
  } else if (networkData.hashRate > 600) {
    indicators.push('⚡ Hash rate strong - network security good');
  } else if (networkData.hashRate < 400) {
    indicators.push('⚠️ Hash rate below optimal - monitor network security');
  }

  // MVRV analysis
  if (networkData.mvrvRatio > 3.5) {
    indicators.push('📈 MVRV ratio high - potential overvaluation');
  } else if (networkData.mvrvRatio < 1.5) {
    indicators.push('📉 MVRV ratio low - potential undervaluation');
  } else {
    indicators.push('📊 MVRV ratio healthy - fair valuation');
  }

  // Exchange flows analysis
  if (networkData.exchangeFlows < 0) {
    indicators.push('🟢 Net exchange outflow - bullish accumulation');
  } else if (networkData.exchangeFlows > 1000) {
    indicators.push('🔴 Significant exchange inflow - monitor for selling pressure');
  } else {
    indicators.push('⚪ Exchange flows neutral');
  }

  return indicators.length > 0 ? `\n🔍 NETWORK HEALTH INSIGHTS:\n${indicators.map(i => `• ${i}`).join('\n')}` : '';
}

/**
 * Format mempool status with detailed information
 */
function formatMempoolStatus(networkData: any): string {
  const mempoolSize = networkData.mempoolSize / 1e6; // Convert to MB
  const mempoolTxs = networkData.mempoolTxs;
  
  let status = '';
  
  if (networkData.mempoolStatus === 'OPTIMAL') {
    status = '🟢 Optimal - transactions processing quickly';
  } else if (networkData.mempoolStatus === 'NORMAL') {
    status = '🟡 Normal - standard processing times';
  } else if (networkData.mempoolStatus === 'CONGESTED') {
    status = '🟠 Congested - increased processing times';
  } else if (networkData.mempoolStatus === 'OVERFLOW') {
    status = '🔴 Overflow - significant delays expected';
  }

  return `\n📦 MEMPOOL STATUS:\n• Size: ${mempoolSize.toFixed(1)}MB\n• Transactions: ${mempoolTxs.toLocaleString()}\n• Status: ${status}`;
}

/**
 * Format fee status with recommendations
 */
function formatFeeStatus(networkData: any): string {
  const fastestFee = networkData.feeRate.fastest;
  const halfHourFee = networkData.feeRate.halfHour;
  const economyFee = networkData.feeRate.economy;
  
  let recommendation = '';
  
  if (networkData.feeStatus === 'LOW') {
    recommendation = '💡 Great time for on-chain transactions';
  } else if (networkData.feeStatus === 'NORMAL') {
    recommendation = '💡 Standard fee environment';
  } else if (networkData.feeStatus === 'HIGH') {
    recommendation = '⚠️ Consider batching transactions or using Lightning';
  } else if (networkData.feeStatus === 'EXTREME') {
    recommendation = '🚨 High fees - consider Lightning Network or waiting';
  }

  return `\n💸 FEE STATUS:\n• Fastest: ${fastestFee} sat/vB\n• 30 min: ${halfHourFee} sat/vB\n• Economy: ${economyFee} sat/vB\n• Recommendation: ${recommendation}`;
}

/**
 * Get MVRV status description
 */
function getMVRVStatus(mvrvRatio: number): string {
  if (mvrvRatio > 3.5) return 'Overvalued';
  if (mvrvRatio > 2.5) return 'Fairly Valued';
  if (mvrvRatio > 1.5) return 'Undervalued';
  return 'Deep Value';
}

/**
 * Format exchange flows with direction and sentiment
 */
function formatExchangeFlows(exchangeFlows: number): string {
  if (exchangeFlows < 0) {
    return `${Math.abs(exchangeFlows).toLocaleString()} BTC (Net outflow - BULLISH)`;
  } else if (exchangeFlows > 0) {
    return `${exchangeFlows.toLocaleString()} BTC (Net inflow - BEARISH)`;
  } else {
    return '0 BTC (Neutral)';
  }
} 