import { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { StockDataService } from '../services/StockDataService';

// Helper function to safely format percentage values
const formatPercentage = (value: number): string => {
  if (!isFinite(value)) return '0.00';
  return value.toFixed(2);
};

// Helper function to safely format currency values
const formatCurrency = (value: number): string => {
  if (!isFinite(value)) return '0.00';
  return value.toFixed(2);
};

export const stockMarketAction: Action = {
  name: 'STOCK_MARKET_ANALYSIS',
  similes: [
    'STOCK_PERFORMANCE',
    'EQUITY_ANALYSIS',
    'MAG7_COMPARISON',
    'MARKET_PERFORMANCE'
  ],
  description: 'Provides stock market analysis for curated equities including Bitcoin-related stocks, MAG7 comparison, and S&P 500 performance',
  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const content = message.content.text?.toLowerCase() || '';
    const triggers = [
      'stock', 'stocks', 'tsla', 'tesla', 'mstr', 'microstrategy', 'nvda', 'nvidia',
      'mag7', 'magnificent 7', 's&p 500', 'spy', 'market', 'equity', 'equities',
      'coin', 'coinbase', 'hood', 'robinhood', 'mara', 'riot', 'mining stocks',
      'bitcoin stocks', 'crypto stocks', 'performance', 'outperform'
    ];
    
    return triggers.some(trigger => content.includes(trigger));
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: State, options: any, callback: HandlerCallback) => {
    try {
      const stockDataService = runtime.getService('stock-data') as StockDataService;
      
      if (!stockDataService) {
        callback({
          text: "Stock data temporarily unavailable. Like Bitcoin's price discovery, equity markets require patience during consolidation.",
          action: 'STOCK_MARKET_ANALYSIS'
        });
        return;
      }

      // Check if force refresh is requested
      const forceRefresh = message.content.text?.toLowerCase().includes('refresh') || 
                          message.content.text?.toLowerCase().includes('latest') ||
                          message.content.text?.toLowerCase().includes('current');

      let stockData;
      if (forceRefresh) {
        stockData = await stockDataService.forceStockUpdate();
      } else {
        stockData = stockDataService.getStockData();
      }

      if (!stockData) {
        callback({
          text: "Stock data unavailable. Markets, like Bitcoin, operate in cycles - this too shall pass.",
          action: 'STOCK_MARKET_ANALYSIS'
        });
        return;
      }

      const { stocks, mag7, performance } = stockData;
      
      // Generate comprehensive stock analysis
      let analysis = "**🏛️ SOVEREIGN EQUITY PORTFOLIO STATUS**\n\n";

      // Market overview with safe formatting
      analysis += `**📊 Market Performance:**\n`;
      analysis += `• MAG7 Average: ${performance.mag7Average > 0 ? '+' : ''}${formatPercentage(performance.mag7Average)}%\n`;
      analysis += `• S&P 500: ${performance.sp500Performance > 0 ? '+' : ''}${formatPercentage(performance.sp500Performance)}%\n`;
      analysis += `• Bitcoin Stocks: ${performance.bitcoinRelatedAverage > 0 ? '+' : ''}${formatPercentage(performance.bitcoinRelatedAverage)}%\n`;
      analysis += `• Tech Stocks: ${performance.techStocksAverage > 0 ? '+' : ''}${formatPercentage(performance.techStocksAverage)}%\n\n`;

      // Top performers analysis
      analysis += `**🚀 TOP PERFORMERS:**\n`;
      performance.topPerformers.slice(0, 3).forEach((comp, index) => {
        const { stock, vsMag7, vsSp500 } = comp;
        analysis += `${index + 1}. **${stock.symbol}** (${stock.name})\n`;
        analysis += `   Price: $${formatCurrency(stock.price)} (${stock.changePercent > 0 ? '+' : ''}${formatPercentage(stock.changePercent)}%)\n`;
        analysis += `   vs MAG7: ${vsMag7.outperforming ? '🔥 +' : '❄️ '}${formatPercentage(vsMag7.difference)}pp\n`;
        analysis += `   vs S&P: ${vsSp500.outperforming ? '🔥 +' : '❄️ '}${formatPercentage(vsSp500.difference)}pp\n\n`;
      });

      // Bitcoin-related stocks focus
      const bitcoinStocks = stocks.filter(s => s.sector === 'bitcoin-related');
      if (bitcoinStocks.length > 0) {
        analysis += `**₿ BITCOIN PROXY STOCKS:**\n`;
        bitcoinStocks.slice(0, 4).forEach(stock => {
          const comp = performance.topPerformers.find(p => p.stock.symbol === stock.symbol) ||
                      performance.underperformers.find(p => p.stock.symbol === stock.symbol);
          
          analysis += `• **${stock.symbol}**: $${formatCurrency(stock.price)} (${stock.changePercent > 0 ? '+' : ''}${formatPercentage(stock.changePercent)}%)`;
          if (comp) {
            analysis += ` - ${comp.vsMag7.outperforming ? 'Outperforming' : 'Underperforming'} MAG7`;
          }
          analysis += `\n`;
        });
        analysis += `\n`;
      }

      // MAG7 breakdown
      analysis += `**👑 MAGNIFICENT 7:**\n`;
      mag7.slice(0, 5).forEach(stock => {
        analysis += `• **${stock.symbol}**: $${formatCurrency(stock.price)} (${stock.changePercent > 0 ? '+' : ''}${formatPercentage(stock.changePercent)}%)\n`;
      });
      analysis += `\n`;

      // Satoshi's market philosophy
      analysis += `**🧠 SATOSHI'S MARKET PERSPECTIVE:**\n`;
      
      if (performance.bitcoinRelatedAverage > performance.mag7Average) {
        analysis += "Bitcoin proxy stocks are outperforming traditional tech. The parallel financial system gains strength. ";
      } else {
        analysis += "Traditional tech still leads Bitcoin proxies. The transition to sound money continues its gradual march. ";
      }

      if (performance.mag7Average > performance.sp500Performance) {
        analysis += "Tech concentration drives market performance - centralized power in decentralized times. ";
      } else {
        analysis += "Broader market participation suggests healthy distribution of gains. ";
      }

      analysis += `\n\n**💰 WEALTH PRESERVATION INSIGHTS:**\n`;
      analysis += `• ${performance.topPerformers.length} positions outperforming MAG7 average\n`;
      analysis += `• Bitcoin-related stocks ${performance.bitcoinRelatedAverage > 0 ? 'gaining' : 'consolidating'} - sound money thesis in action\n`;
      analysis += `• Tech innovation continues ${performance.techStocksAverage > 0 ? 'advancing' : 'digesting gains'}\n`;

      analysis += `\n**🎯 SOVEREIGN ALLOCATION REMINDER:**\n`;
      analysis += "Stocks are denominated in fiat. Bitcoin is the ultimate long-term store of value. ";
      analysis += "Trade equities for yield, but stack sats for wealth preservation. ";
      analysis += "These companies may prosper, but Bitcoin is inevitable.";

      callback({
        text: analysis,
        action: 'STOCK_MARKET_ANALYSIS'
      });

    } catch (error) {
      console.error('Error in stockMarketAction:', error);
      callback({
        text: "Market analysis failed. Like network congestion, sometimes data flows require patience and retry mechanisms.",
        action: 'STOCK_MARKET_ANALYSIS'
      });
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "How are our stocks performing vs the market?" }
      },
      {
        name: "Satoshi",
        content: { 
          text: "TSLA: $316.36 (+2.1%) - Outperforming MAG7 by +1.2pp. MSTR: $402.15 (+8.3%) - Bitcoin proxy leading. MAG7 Average: +0.9%. S&P 500: +0.4%. Bitcoin stocks: +4.2% avg. Tech innovation and sound money thesis both advancing. Trade equities for yield, stack sats for wealth.",
          actions: ["STOCK_MARKET_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "What's happening with Tesla and MicroStrategy today?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "TSLA: $316.36 (+2.1%) vs MAG7 +1.2pp advantage. MSTR: $402.15 (+8.3%) vs MAG7 +7.4pp advantage. MicroStrategy's Bitcoin treasury strategy outperforming traditional corporate allocation. Tesla's innovation premium intact. Both beating S&P 500 by significant margins.",
          actions: ["STOCK_MARKET_ANALYSIS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Are Bitcoin mining stocks doing well?" }
      },
      {
        name: "Satoshi",
        content: {
          text: "Bitcoin proxy stocks: +4.2% average. MARA: +6.1%, RIOT: +5.8%, CLSK: +3.2%. Mining stocks reflecting Bitcoin's network strength. Outperforming MAG7 (+0.9%) and S&P 500 (+0.4%). Hash rate security translates to equity performance. Sound money thesis in action.",
          actions: ["STOCK_MARKET_ANALYSIS"]
        }
      }
    ]
  ]
}; 