import {
  type Action,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from '@elizaos/core';
import { createActionTemplate, ValidationPatterns, ResponseCreators } from './base/ActionTemplate';
import { ETFDataService } from '../services/ETFDataService';
import { ETFMarketData } from '../types';

export const etfFlowAction: Action = createActionTemplate({
  name: 'ETF_FLOW_TRACKING',
  description: 'Comprehensive Bitcoin ETF flow tracking including inflows, outflows, holdings, premiums, and institutional adoption metrics across all major Bitcoin ETFs',
  similes: ['BITCOIN_ETF_FLOWS', 'ETF_FLOWS', 'BITCOIN_ETF_TRACKING', 'ETF_INFLOWS', 'ETF_OUTFLOWS', 'BTC_ETF_FLOWS', 'BITCOIN_ETF_DATA', 'ETF_MARKET_DATA', 'INSTITUTIONAL_FLOWS', 'ETF_ANALYSIS', 'BITCOIN_ETF_METRICS', 'ETF_FLOW_SUMMARY', 'ETF_HOLDINGS', 'BITCOIN_ETF_VOLUME', 'ETF_PREMIUM_DISCOUNT'],
  
  examples: [
    [
      {
        name: '{{user}}',
        content: { text: 'Show me the latest Bitcoin ETF flows' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Bitcoin ETF flows: IBIT +$450M, FBTC +$320M, GBTC -$180M (5d net). Total AUM: $95.2B holding 1.2M BTC (5.8% of supply). Weekly absorption: 8.2K BTC vs 4.5K mined. ETFs aggressively absorbing Bitcoin supply - Wall Street coming to Bitcoin.',
          thought: 'User wants current Bitcoin ETF flow data. I need to analyze institutional flows, supply dynamics, and assess the impact on Bitcoin supply-demand balance.',
          actions: ['ETF_FLOW_TRACKING'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'How much Bitcoin do ETFs hold?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Bitcoin ETFs hold 1.24M BTC ($62.1B at current prices), representing 5.91% of total supply. IBIT leads with 385K BTC. Weekly absorption rate: 2.1x mining. ETFs creating structural demand floor - permanent Bitcoin removal from circulation.',
          thought: 'User asking about ETF Bitcoin holdings. I should provide total holdings, percentage of supply, and context about the structural impact on Bitcoin scarcity.',
          actions: ['ETF_FLOW_TRACKING'],
        },
      },
    ],
    [
      {
        name: '{{user}}',
        content: { text: 'Are ETFs still buying Bitcoin?' },
      },
      {
        name: 'Satoshi',
        content: {
          text: 'Yes. 5d net flows: +$1.2B across all ETFs. IBIT +$680M, FBTC +$420M leading inflows. Only 2 outflows vs 8 inflows. Absorption ratio: 3.1x weekly mining. Institutional demand exceeding supply - Bitcoin financialization accelerating.',
          thought: 'User wants to know about current ETF buying activity. I need to analyze recent flows, identify which ETFs are seeing inflows vs outflows, and contextualize versus Bitcoin mining supply.',
          actions: ['ETF_FLOW_TRACKING'],
        },
      },
    ],
  ],
  
  validateFn: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return ValidationPatterns.isETFRequest(text);
  },

  handlerFn: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    logger.info('ETF flow tracking action triggered');
    
    const thoughtProcess = 'User is requesting Bitcoin ETF flow analysis. I need to analyze institutional flows, Bitcoin holdings, supply dynamics, and assess the impact on Bitcoin scarcity and adoption.';
    
    try {
      const etfDataService = runtime.getService('etf-data') as ETFDataService;
      
      if (!etfDataService) {
        logger.warn('ETFDataService not available');
        
        const fallbackResponse = ResponseCreators.createErrorResponse(
          'ETF_FLOW_TRACKING',
          'ETF tracking unavailable',
          'ETF tracking unavailable. Bitcoin ETFs represent institutional adoption - a critical signal for Bitcoin\'s maturation as a store of value. Major institutions like BlackRock, Fidelity, and others are providing easier access to Bitcoin for traditional investors.'
        );
        
        if (callback) {
          await callback(fallbackResponse);
        }
        return false;
      }

      // Get comprehensive ETF market data
      const etfMarketData = await etfDataService.getETFMarketData();
      
      if (!etfMarketData) {
        logger.warn('No ETF market data available');
        
        const noDataResponse = ResponseCreators.createErrorResponse(
          'ETF_FLOW_TRACKING',
          'ETF data temporarily unavailable',
          'ETF data temporarily unavailable. Bitcoin ETFs continue to drive institutional adoption - they\'re the bridge between traditional finance and Bitcoin. Over $100B in combined assets under management represents unprecedented institutional interest.'
        );
        
        if (callback) {
          await callback(noDataResponse);
        }
        return false;
      }

      // Format the comprehensive ETF report
      const responseText = formatETFReport(etfMarketData);

      const response = ResponseCreators.createStandardResponse(
        thoughtProcess,
        responseText,
        'ETF_FLOW_TRACKING',
        {
          totalAUM: etfMarketData.marketMetrics.totalMarketAUM,
          totalBitcoinHeld: etfMarketData.marketMetrics.totalBitcoinHeld,
          percentOfSupply: etfMarketData.marketMetrics.percentOfSupply,
          netFlow: etfMarketData.flowSummary.totalNetFlow,
          averagePremium: etfMarketData.flowSummary.averagePremium,
          marketLeader: etfMarketData.marketMetrics.marketLeader,
          etfCount: etfMarketData.etfs.length
        }
      );

      if (callback) {
        await callback(response);
      }

      logger.info('ETF flow analysis delivered successfully');
      return true;

    } catch (error) {
      logger.error('Failed to analyze ETF flows:', (error as Error).message);
      
      const errorResponse = ResponseCreators.createErrorResponse(
        'ETF_FLOW_TRACKING',
        (error as Error).message,
        'ETF tracking error. Bitcoin ETFs are revolutionizing institutional access to Bitcoin. Since January 2024, these vehicles have absorbed unprecedented amounts of Bitcoin, creating structural demand that outpaces new supply.'
      );
      
      if (callback) {
        await callback(errorResponse);
      }
      
      return false;
    }
  },
});

function formatETFReport(data: ETFMarketData): string {
  const { etfs, flowSummary, marketMetrics } = data;
  
  // Sort ETFs by AUM
  const sortedETFs = etfs.sort((a, b) => b.aum - a.aum);
  
  // Calculate key metrics
  const totalAUM = marketMetrics.totalMarketAUM;
  const totalBitcoinHeld = marketMetrics.totalBitcoinHeld;
  const percentOfSupply = marketMetrics.percentOfSupply;
  const netFlow = flowSummary.totalNetFlow;
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
  const flowDirection = netFlow > 0 ? '+' : '';
  const flowText = `${flowDirection}${formatLargeNumber(netFlow)}`;
  
  // Market sentiment based on flows
  const marketSentiment = netFlow > 1e9 ? 'BULLISH' : netFlow > 0 ? 'POSITIVE' : netFlow < -1e9 ? 'BEARISH' : 'NEUTRAL';
  
  // Top performing ETFs (by inflows)
  const topPerformers = flowSummary.topInflows.slice(0, 3);
  const topPerformersText = topPerformers.map(etf => 
    `${etf.ticker}: ${etf.inflow > 0 ? '+' : ''}${formatLargeNumber(etf.inflow)}`
  ).join(', ');
  
  // Largest ETFs by AUM
  const largestETFs = sortedETFs.slice(0, 3);
  const largestETFsText = largestETFs.map(etf => 
    `${etf.ticker}: ${formatLargeNumber(etf.aum)} (${formatBTC(etf.bitcoinHoldings)})`
  ).join(', ');
  
  // Calculate weekly Bitcoin absorption vs mining
  const weeklyBitcoinAbsorption = Math.abs(netFlow) / 50000; // Rough estimate based on Bitcoin price
  const weeklyMining = 4500; // Approximate weekly Bitcoin mining
  const absorptionRatio = weeklyBitcoinAbsorption / weeklyMining;
  
  // Premium/discount analysis
  const premiumStatus = averagePremium > 0.5 ? 'PREMIUM' : averagePremium < -0.5 ? 'DISCOUNT' : 'NEUTRAL';
  const premiumText = averagePremium > 0 ? `+${(averagePremium * 100).toFixed(2)}%` : `${(averagePremium * 100).toFixed(2)}%`;
  
  // Market structure analysis
  const marketStructure = percentOfSupply > 5 ? 'DOMINANT' : percentOfSupply > 3 ? 'SIGNIFICANT' : 'EMERGING';
  
  return `Bitcoin ETF flows: Total AUM ${formatLargeNumber(totalAUM)}. Bitcoin held: ${formatBTC(totalBitcoinHeld)} (${percentOfSupply.toFixed(2)}% of supply). Net flows (5d): ${flowText}. Market leader: ${marketMetrics.marketLeader}. Top inflows: ${topPerformersText}. Largest by AUM: ${largestETFsText}. Weekly absorption: ~${weeklyBitcoinAbsorption.toFixed(0)}K BTC vs ${weeklyMining.toFixed(0)} mined (${absorptionRatio.toFixed(1)}x). Premium/discount: ${premiumText} (${premiumStatus}). Sentiment: ${marketSentiment}. ${absorptionRatio > 2 ? 'ETFs aggressively absorbing Bitcoin supply' : 'ETFs steadily accumulating Bitcoin'} - ${percentOfSupply > 5 ? 'dominant institutional presence' : 'growing Wall Street adoption'}.`;
} 