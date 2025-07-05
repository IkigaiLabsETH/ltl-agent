import { 
  Action,
  IAgentRuntime,
  Memory, 
  State,
  HandlerCallback,
  ActionExample
} from '@elizaos/core';
import { ETFDataService } from '../services/ETFDataService';
import { ETFMarketData } from '../types';

export const etfFlowAction: Action = {
  name: 'ETF_FLOW_TRACKING',
  similes: [
    'BITCOIN_ETF_FLOWS',
    'ETF_FLOWS',
    'BITCOIN_ETF_TRACKING',
    'ETF_INFLOWS',
    'ETF_OUTFLOWS',
    'BTC_ETF_FLOWS',
    'BITCOIN_ETF_DATA',
    'ETF_MARKET_DATA',
    'INSTITUTIONAL_FLOWS',
    'ETF_ANALYSIS',
    'BITCOIN_ETF_METRICS',
    'ETF_FLOW_SUMMARY',
    'ETF_HOLDINGS',
    'BITCOIN_ETF_VOLUME',
    'ETF_PREMIUM_DISCOUNT'
  ],
  description: 'Provides comprehensive Bitcoin ETF flow tracking including inflows, outflows, holdings, premiums, and institutional adoption metrics across all major Bitcoin ETFs',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    
    // Trigger on Bitcoin ETF flow queries
    const triggers = [
      'etf flow', 'etf flows', 'bitcoin etf', 'btc etf', 'etf inflow', 'etf outflow',
      'etf tracking', 'etf data', 'etf market', 'etf holdings', 'etf premium',
      'etf volume', 'etf analysis', 'institutional flow', 'institutional flows',
      'ibit', 'fbtc', 'arkb', 'bitb', 'gbtc', 'hodl', 'ezbc', 'brrr', 'btco', 'defi',
      'blackrock bitcoin', 'fidelity bitcoin', 'grayscale bitcoin', 'ark bitcoin',
      'bitwise bitcoin', 'vaneck bitcoin', 'franklin bitcoin', 'invesco bitcoin',
      'bitcoin etf performance', 'bitcoin etf comparison', 'bitcoin etf metrics',
      'bitcoin etf adoption', 'bitcoin etf demand', 'bitcoin etf supply',
      'bitcoin institutional', 'bitcoin institutions', 'bitcoin wall street',
      'bitcoin demand', 'bitcoin supply shortage', 'bitcoin accumulation',
      'etf creation', 'etf redemption', 'etf nav', 'etf discount', 'etf premium',
      'bitcoin buying pressure', 'bitcoin selling pressure', 'bitcoin flow',
      'bitcoin fund', 'bitcoin funds', 'bitcoin trust', 'bitcoin trusts'
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
      const etfDataService = runtime.getService('etf-data') as ETFDataService;
      
      if (!etfDataService) {
        callback({
          text: "🟠 ETF tracking unavailable. Bitcoin ETFs represent institutional adoption - a critical signal for Bitcoin's maturation as a store of value. Major institutions like BlackRock, Fidelity, and others are providing easier access to Bitcoin for traditional investors.",
          action: 'ETF_FLOW_TRACKING'
        });
        return;
      }

      // Get comprehensive ETF market data
      const etfMarketData = await etfDataService.getETFMarketData();
      
      if (!etfMarketData) {
        callback({
          text: "🟠 ETF data temporarily unavailable. Bitcoin ETFs continue to drive institutional adoption - they're the bridge between traditional finance and Bitcoin. Over $100B in combined assets under management represents unprecedented institutional interest.",
          action: 'ETF_FLOW_TRACKING'
        });
        return;
      }

      // Format the comprehensive ETF report
      const responseText = formatETFReport(etfMarketData);

      callback({
        text: responseText,
        action: 'ETF_FLOW_TRACKING'
      });

    } catch (error) {
      console.error('Error in ETF flow action:', error);
      callback({
        text: "🟠 ETF tracking error. Bitcoin ETFs are revolutionizing institutional access to Bitcoin. Since January 2024, these vehicles have absorbed unprecedented amounts of Bitcoin, creating structural demand that outpaces new supply. The ETF wrapper removes technical barriers for institutions.",
        action: 'ETF_FLOW_TRACKING'
      });
    }
  },
  examples: []
};

function formatETFReport(data: ETFMarketData): string {
  const { etfs, flowSummary, marketMetrics } = data;
  
  // Sort ETFs by AUM
  const sortedETFs = etfs.sort((a, b) => b.aum - a.aum);
  
  // Calculate key metrics
  const totalAUM = marketMetrics.totalMarketAUM;
  const totalBitcoinHeld = marketMetrics.totalBitcoinHeld;
  const percentOfSupply = marketMetrics.percentOfSupply;
  const netFlow = flowSummary.totalNetFlow;
  const totalInflow = flowSummary.totalInflow;
  const totalOutflow = flowSummary.totalOutflow;
  const averagePremium = flowSummary.averagePremium;
  
  // Format numbers
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    return `$${num.toLocaleString()}`;
  };
  
  const formatBTC = (num: number): string => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M BTC`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K BTC`;
    return `${num.toLocaleString()} BTC`;
  };
  
  // Flow direction indicator
  const flowDirection = netFlow > 0 ? '📈' : netFlow < 0 ? '📉' : '➡️';
  const flowText = netFlow > 0 ? `+${formatLargeNumber(netFlow)}` : formatLargeNumber(netFlow);
  
  // Market sentiment based on flows
  const marketSentiment = netFlow > 1e9 ? 'BULLISH' : netFlow > 0 ? 'POSITIVE' : netFlow < -1e9 ? 'BEARISH' : 'NEUTRAL';
  
  // Top performing ETFs (by inflows)
  const topPerformers = flowSummary.topInflows.slice(0, 4);
  const topPerformersText = topPerformers.map(etf => 
    `├─ ${etf.ticker}: ${etf.inflow > 0 ? '+' : ''}${formatLargeNumber(etf.inflow)} (${etf.priceChange > 0 ? '+' : ''}${etf.priceChange.toFixed(1)}%)`
  ).join('\n');
  
  // Largest ETFs by AUM
  const largestETFs = sortedETFs.slice(0, 5);
  const largestETFsText = largestETFs.map((etf, index) => 
    `├─ ${etf.ticker}: ${formatLargeNumber(etf.aum)} (${formatBTC(etf.bitcoinHoldings)})`
  ).join('\n');
  
  // Calculate weekly Bitcoin absorption vs mining
  const weeklyBitcoinAbsorption = Math.abs(netFlow) / 50000; // Rough estimate based on Bitcoin price
  const weeklyMining = 4500; // Approximate weekly Bitcoin mining
  const absorptionRatio = weeklyBitcoinAbsorption / weeklyMining;
  
  // Premium/discount analysis
  const premiumStatus = averagePremium > 0.5 ? 'PREMIUM' : averagePremium < -0.5 ? 'DISCOUNT' : 'NEUTRAL';
  const premiumText = averagePremium > 0 ? `+${(averagePremium * 100).toFixed(2)}%` : `${(averagePremium * 100).toFixed(2)}%`;
  
  // Market structure analysis
  const marketStructure = percentOfSupply > 5 ? 'DOMINANT' : percentOfSupply > 3 ? 'SIGNIFICANT' : 'EMERGING';
  
  return `🟠 BITCOIN ETF FLOW REPORT

💰 MARKET OVERVIEW
├─ Total AUM: ${formatLargeNumber(totalAUM)}
├─ Bitcoin Held: ${formatBTC(totalBitcoinHeld)} (${percentOfSupply.toFixed(2)}% of supply)
├─ Net Flows (5d): ${flowDirection} ${flowText}
├─ Market Leader: ${marketMetrics.marketLeader}
└─ Structure: ${marketStructure}

📊 FLOW ANALYSIS
├─ Total Inflows: ${formatLargeNumber(totalInflow)}
├─ Total Outflows: ${formatLargeNumber(totalOutflow)}
├─ Net Position: ${flowText}
├─ Average Premium: ${premiumText} (${premiumStatus})
└─ Sentiment: ${marketSentiment}

🏆 TOP PERFORMERS (Recent Flows)
${topPerformersText}

🏛️ LARGEST ETFs (By AUM)
${largestETFsText}

⚡ SUPPLY DYNAMICS
├─ Weekly ETF Absorption: ~${weeklyBitcoinAbsorption.toFixed(0)}K BTC
├─ Weekly Mining Supply: ~${weeklyMining.toFixed(0)} BTC
├─ Absorption Ratio: ${absorptionRatio.toFixed(1)}x mining
└─ Supply Impact: ${absorptionRatio > 5 ? 'EXTREME' : absorptionRatio > 2 ? 'HIGH' : 'MODERATE'}

🎯 INSTITUTIONAL ANALYSIS
├─ Average Expense Ratio: ${(marketMetrics.averageExpenseRatio * 100).toFixed(2)}%
├─ Strongest Inflow: ${marketMetrics.strongestInflow}
├─ Largest Outflow: ${marketMetrics.largestOutflow}
└─ Adoption Phase: ${percentOfSupply > 5 ? 'MAINSTREAM' : percentOfSupply > 3 ? 'GROWTH' : 'EARLY'}

🟠 ASSESSMENT: ${marketSentiment} institutional sentiment. ETFs are ${absorptionRatio > 2 ? 'aggressively' : 'steadily'} absorbing Bitcoin supply, creating structural demand imbalance. This represents the financialization of Bitcoin - bringing Wall Street to Bitcoin rather than Bitcoin to Wall Street.

💡 OUTLOOK: ${percentOfSupply > 5 ? 'ETFs now hold significant Bitcoin supply, creating permanent demand floor.' : 'ETF adoption accelerating, expect continued supply absorption.'} Traditional finance infrastructure enabling Bitcoin access for institutions, pensions, and retail through familiar investment vehicles.`;
} 