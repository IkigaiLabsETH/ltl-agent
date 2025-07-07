import { Provider, type IAgentRuntime, type Memory, type State } from "@elizaos/core";
import { MarketIntelligenceService } from "../services/MarketIntelligenceService";

/**
 * Market Context Provider
 * Provides comprehensive market context including altcoins, stocks, macro, and ETFs
 */
export const marketContextProvider: Provider = {
  name: 'MARKET_CONTEXT',
  description: 'Market context intelligence including altcoin performance, stock correlations, macro indicators, and ETF flows',
  position: -5, // Medium-high priority

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      // Get unified BTC performance data if available
      let btcPerformanceData = null;
      try {
        const btcPerformanceService = runtime.getService("btc-performance") as any;
        if (btcPerformanceService && typeof btcPerformanceService.getBenchmarkData === 'function') {
          btcPerformanceData = await btcPerformanceService.getBenchmarkData();
        }
      } catch (error) {
        console.debug("Unified BTC performance data not available, using fallback");
      }

      // Get the Market Intelligence Service
      const marketService = runtime.getService("market-intelligence") as unknown as MarketIntelligenceService;
      
      if (!marketService) {
        return {
          text: '⚠️ Market Intelligence Service not available',
          values: { marketContextAvailable: false },
          data: { error: 'Service not found' }
        };
      }

      // Get comprehensive market data
      const marketData = await marketService.getMarketIntelligence();
      
      if (!marketData) {
        return {
          text: '⚠️ Market context data not available',
          values: { marketContextAvailable: false },
          data: { error: 'No market data' }
        };
      }

      // Format altcoin season analysis
      const altcoinSeasonAnalysis = formatAltcoinSeasonAnalysis(marketData);
      
      // Format stock correlations using unified BTC performance data
      const stockCorrelations = formatStockCorrelations(marketData, btcPerformanceData);
      
      // Format macro environment
      const macroEnvironment = formatMacroEnvironment(marketData);
      
      // Format ETF intelligence
      const etfIntelligence = formatETFIntelligence(marketData.spotBitcoinETFs);

      const providerText = `📈 MARKET CONTEXT - [Live]

🎯 Bitcoin vs Altcoins:
• Altcoin Season Index: ${marketData.altcoinSeasonIndex} (${getAltcoinSeasonStatus(marketData.altcoinSeasonIndex)})
• Bitcoin Relative Performance: ${marketData.bitcoinRelativePerformance > 0 ? '+' : ''}${marketData.bitcoinRelativePerformance.toFixed(1)}% vs top 100

${altcoinSeasonAnalysis}

📊 Bitcoin vs Stocks:
• Tesla (TSLA): BTC ${marketData.teslaVsBitcoin > 0 ? '+' : ''}${marketData.teslaVsBitcoin.toFixed(1)}% YTD
• MicroStrategy (MSTR): BTC ${marketData.microstrategyPerformance > 0 ? '+' : ''}${marketData.microstrategyPerformance.toFixed(1)}% YTD
• Magnificent 7: BTC ${marketData.mag7VsBitcoin > 0 ? '+' : ''}${marketData.mag7VsBitcoin.toFixed(1)}% YTD
• S&P 500: BTC ${marketData.sp500VsBitcoin > 0 ? '+' : ''}${marketData.sp500VsBitcoin.toFixed(1)}% YTD
• Gold: BTC ${marketData.goldVsBitcoin > 0 ? '+' : ''}${marketData.goldVsBitcoin.toFixed(1)}% YTD

${stockCorrelations}

🌍 Macro Environment:
• Dollar Index (DXY): ${marketData.dollarIndex.toFixed(1)} (${getDXYTrend(marketData.dollarIndex)})
• 10Y Treasury: ${marketData.treasuryYields.toFixed(2)}% (${getYieldTrend(marketData.treasuryYields)})
• Fed Policy: ${marketData.fedPolicy} (${getFedPolicyDescription(marketData.fedPolicy)})
• Inflation: ${marketData.inflationRate.toFixed(1)}% (${getInflationTrend(marketData.inflationRate)})

${macroEnvironment}

💼 ETF Intelligence:
• Total AUM: $${(marketData.spotBitcoinETFs.totalAUM / 1e9).toFixed(1)}B
• Daily Flows: ${marketData.spotBitcoinETFs.dailyFlows > 0 ? '+' : ''}$${(marketData.spotBitcoinETFs.dailyFlows / 1e6).toFixed(0)}M
• Institutional Adoption: ${marketData.spotBitcoinETFs.institutionalAdoption.toFixed(1)}% of ETF market

${etfIntelligence}

😨 Market Sentiment:
• Fear & Greed Index: ${marketData.fearGreedIndex} (${marketData.fearGreedValue})`;

      return {
        text: providerText,
        values: {
          marketContextAvailable: true,
          altcoinSeasonIndex: marketData.altcoinSeasonIndex,
          bitcoinRelativePerformance: marketData.bitcoinRelativePerformance,
          teslaVsBitcoin: marketData.teslaVsBitcoin,
          microstrategyPerformance: marketData.microstrategyPerformance,
          mag7VsBitcoin: marketData.mag7VsBitcoin,
          sp500VsBitcoin: marketData.sp500VsBitcoin,
          goldVsBitcoin: marketData.goldVsBitcoin,
          dollarIndex: marketData.dollarIndex,
          treasuryYields: marketData.treasuryYields,
          fedPolicy: marketData.fedPolicy,
          inflationRate: marketData.inflationRate,
          etfAUM: marketData.spotBitcoinETFs.totalAUM,
          etfDailyFlows: marketData.spotBitcoinETFs.dailyFlows,
          fearGreedIndex: marketData.fearGreedIndex,
          fearGreedValue: marketData.fearGreedValue,
          // Include unified BTC performance data
          btcPerformanceData: btcPerformanceData,
        },
        data: {
          marketData: marketData,
          altcoinSeasonAnalysis: altcoinSeasonAnalysis,
          stockCorrelations: stockCorrelations,
          macroEnvironment: macroEnvironment,
          etfIntelligence: etfIntelligence,
          btcPerformanceData: btcPerformanceData,
          lastUpdated: new Date()
        }
      };

    } catch (error) {
      console.error('Error in marketContextProvider:', error);
      return {
        text: '❌ Error fetching market context data',
        values: { marketContextAvailable: false },
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
};

/**
 * Format altcoin season analysis
 */
function formatAltcoinSeasonAnalysis(marketData: any): string {
  const topPerformers = marketData.topPerformers.slice(0, 5);
  const underperformers = marketData.underperformers.slice(0, 3);
  
  let analysis = '\n📈 Top Performers vs Bitcoin:\n';
  
  topPerformers.forEach((coin: any, index: number) => {
    const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
    analysis += `${emoji} ${coin.symbol}: ${coin.btcPerformance24h > 0 ? '+' : ''}${coin.btcPerformance24h.toFixed(2)}% (${coin.narrative})\n`;
  });
  
  if (underperformers.length > 0) {
    analysis += '\n📉 Underperformers vs Bitcoin:\n';
    underperformers.forEach((coin: any) => {
      analysis += `📉 ${coin.symbol}: ${coin.btcPerformance24h.toFixed(2)}% (${coin.narrative})\n`;
    });
  }
  
  return analysis;
}

/**
 * Format stock correlations with insights using unified BTC performance data
 */
function formatStockCorrelations(marketData: any, btcPerformanceData: any): string {
  const insights = [];
  
  if (marketData.teslaVsBitcoin > 10) {
    insights.push('🚗 Tesla significantly underperforming Bitcoin - tech rotation potential');
  } else if (marketData.teslaVsBitcoin < -10) {
    insights.push('🚗 Tesla outperforming Bitcoin - risk-on sentiment');
  }
  
  if (marketData.microstrategyPerformance > 5) {
    insights.push('📊 MicroStrategy underperforming Bitcoin - leverage working against MSTR');
  } else if (marketData.microstrategyPerformance < -5) {
    insights.push('📊 MicroStrategy outperforming Bitcoin - leverage amplifying gains');
  }
  
  if (marketData.mag7VsBitcoin > 15) {
    insights.push('💻 Magnificent 7 underperforming Bitcoin - tech rotation to crypto');
  } else if (marketData.mag7VsBitcoin < -15) {
    insights.push('💻 Magnificent 7 outperforming Bitcoin - risk-on tech sentiment');
  }
  
  return insights.length > 0 ? `\n💡 Stock Correlation Insights:\n${insights.map(i => `• ${i}`).join('\n')}` : '';
}

/**
 * Format macro environment analysis
 */
function formatMacroEnvironment(marketData: any): string {
  const insights = [];
  
  // DXY analysis
  if (marketData.dollarIndex > 105) {
    insights.push('💵 Strong dollar - potential headwind for risk assets');
  } else if (marketData.dollarIndex < 100) {
    insights.push('💵 Weak dollar - potential tailwind for Bitcoin');
  }
  
  // Treasury yields analysis
  if (marketData.treasuryYields > 4.5) {
    insights.push('📈 High yields - competing with risk assets for capital');
  } else if (marketData.treasuryYields < 3.5) {
    insights.push('📉 Low yields - favorable for risk assets');
  }
  
  // Fed policy analysis
  if (marketData.fedPolicy === 'HAWKISH') {
    insights.push('🦅 Hawkish Fed - potential pressure on risk assets');
  } else if (marketData.fedPolicy === 'DOVISH') {
    insights.push('🕊️ Dovish Fed - favorable for Bitcoin as inflation hedge');
  }
  
  // Inflation analysis
  if (marketData.inflationRate > 3.5) {
    insights.push('🔥 High inflation - Bitcoin as store of value attractive');
  } else if (marketData.inflationRate < 2.5) {
    insights.push('❄️ Low inflation - less urgency for inflation hedges');
  }
  
  return insights.length > 0 ? `\n🌍 Macro Insights:\n${insights.map(i => `• ${i}`).join('\n')}` : '';
}

/**
 * Format ETF intelligence
 */
function formatETFIntelligence(etfData: any): string {
  const insights = [];
  
  // Flow analysis
  if (etfData.dailyFlows > 100000000) { // $100M
    insights.push('💰 Strong ETF inflows - institutional adoption accelerating');
  } else if (etfData.dailyFlows < -100000000) { // -$100M
    insights.push('💸 ETF outflows - monitor for institutional selling');
  } else {
    insights.push('⚖️ ETF flows neutral - steady institutional adoption');
  }
  
  // AUM analysis
  if (etfData.totalAUM > 25000000000) { // $25B
    insights.push('📊 Significant ETF AUM - Bitcoin becoming mainstream investment');
  }
  
  // Institutional adoption analysis
  if (etfData.institutionalAdoption > 25) {
    insights.push('🏢 High institutional adoption - Bitcoin legitimized as asset class');
  }
  
  return insights.length > 0 ? `\n💼 ETF Insights:\n${insights.map(i => `• ${i}`).join('\n')}` : '';
}

/**
 * Get altcoin season status
 */
function getAltcoinSeasonStatus(index: number): string {
  if (index < 25) return 'Bitcoin-dominated';
  if (index < 75) return 'Mixed market';
  return 'Altcoin season';
}

/**
 * Get DXY trend
 */
function getDXYTrend(dxy: number): string {
  if (dxy > 105) return 'Strong';
  if (dxy > 100) return 'Moderate';
  return 'Weak';
}

/**
 * Get yield trend
 */
function getYieldTrend(yield_: number): string {
  if (yield_ > 4.5) return 'High';
  if (yield_ > 3.5) return 'Moderate';
  return 'Low';
}

/**
 * Get Fed policy description
 */
function getFedPolicyDescription(policy: string): string {
  switch (policy) {
    case 'HAWKISH': return 'Rate hikes likely';
    case 'DOVISH': return 'Rate cuts likely';
    default: return 'Neutral stance';
  }
}

/**
 * Get inflation trend
 */
function getInflationTrend(inflation: number): string {
  if (inflation > 3.5) return 'Elevated';
  if (inflation > 2.5) return 'Moderate';
  return 'Low';
}