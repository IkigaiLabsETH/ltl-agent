import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import { BitcoinDataService } from '../services/BitcoinDataService';

/**
 * Market Context Provider - Advanced market analysis
 * Following ElizaOS documentation patterns
 * Private provider: Must be explicitly requested
 */
export const marketContextProvider: Provider = {
  name: 'marketContext',
  description: 'Provides advanced market context and Bitcoin thesis analysis',
  private: true, // Must be explicitly requested
  position: 10, // After other market data
  
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      const bitcoinService = runtime.getService('bitcoin-data') as BitcoinDataService;
      
      if (!bitcoinService) {
        return {
          text: 'Market context service not available',
          values: { marketContextError: true },
        };
      }
      
      // Get current Bitcoin price from state or service
      const currentPrice = state?.values?.bitcoinPrice || await bitcoinService.getBitcoinPrice();
      
      if (!currentPrice) {
        return {
          text: 'Bitcoin price data required for market context analysis',
          values: { marketContextError: true },
        };
      }
      
      // Get advanced market analysis
      const thesisMetrics = await bitcoinService.calculateThesisMetrics(currentPrice);
      const institutionalTrends = await bitcoinService.analyzeInstitutionalTrends();
      const freedomMath = await bitcoinService.calculateFreedomMathematics();
      
      // Format advanced context
      const thesisProgress = thesisMetrics.progressPercentage;
      const adoptionScore = institutionalTrends.adoptionScore;
      const btcNeeded = freedomMath.btcNeeded;
      
      let context = `Advanced Bitcoin Analysis: `;
      context += `Thesis Progress: ${thesisProgress.toFixed(1)}% complete. `;
      context += `Institutional Adoption Score: ${adoptionScore}/100. `;
      context += `Freedom Math: ${btcNeeded.toFixed(2)} BTC needed for $10M target. `;
      
      // Add multiplier context
      if (thesisMetrics.multiplierNeeded > 1) {
        context += `Price needs ${thesisMetrics.multiplierNeeded.toFixed(1)}x increase to reach target. `;
      }
      
      // Add adoption context
      if (adoptionScore > 70) {
        context += `Strong institutional adoption detected. `;
      } else if (adoptionScore > 40) {
        context += `Moderate institutional adoption. `;
      } else {
        context += `Early stage institutional adoption. `;
      }
      
      // Add timeframe context
      if (thesisMetrics.requiredCAGR.fiveYear < 25) {
        context += `Conservative growth required (${thesisMetrics.requiredCAGR.fiveYear.toFixed(1)}% CAGR). `;
      } else if (thesisMetrics.requiredCAGR.fiveYear < 50) {
        context += `Moderate growth required (${thesisMetrics.requiredCAGR.fiveYear.toFixed(1)}% CAGR). `;
      } else {
        context += `Aggressive growth required (${thesisMetrics.requiredCAGR.fiveYear.toFixed(1)}% CAGR). `;
      }
      
      return {
        text: context,
        values: {
          // Thesis metrics
          thesisProgress: thesisMetrics.progressPercentage,
          thesisTargetPrice: thesisMetrics.targetPrice,
          thesisCurrentPrice: thesisMetrics.currentPrice,
          multiplierNeeded: thesisMetrics.multiplierNeeded,
          estimatedHolders: thesisMetrics.estimatedHolders,
          targetHolders: thesisMetrics.targetHolders,
          holdersProgress: thesisMetrics.holdersProgress,
          
          // Growth requirements
          requiredCAGR5Year: thesisMetrics.requiredCAGR.fiveYear,
          requiredCAGR10Year: thesisMetrics.requiredCAGR.tenYear,
          growthCategory: thesisMetrics.requiredCAGR.fiveYear < 25 ? 'conservative' : 
                         thesisMetrics.requiredCAGR.fiveYear < 50 ? 'moderate' : 'aggressive',
          
          // Institutional adoption
          institutionalAdoptionScore: institutionalTrends.adoptionScore,
          adoptionCategory: adoptionScore > 70 ? 'strong' : adoptionScore > 40 ? 'moderate' : 'early',
          corporateAdoptionCount: institutionalTrends.corporateAdoption?.length || 0,
          bankingIntegrationCount: institutionalTrends.bankingIntegration?.length || 0,
          sovereignActivityCount: institutionalTrends.sovereignActivity?.length || 0,
          
          // Freedom mathematics
          freedomMathBtcNeeded: freedomMath.btcNeeded,
          freedomMathCurrentPrice: freedomMath.currentPrice,
          freedomMathTarget: 10000000, // $10M target
          
          // Scenarios
          conservativeScenario: freedomMath.scenarios?.conservative || null,
          moderateScenario: freedomMath.scenarios?.moderate || null,
          aggressiveScenario: freedomMath.scenarios?.aggressive || null,
          
          // Safe levels
          conservativeSafeLevel: freedomMath.safeLevels?.conservative || null,
          moderateSafeLevel: freedomMath.safeLevels?.moderate || null,
          aggressiveSafeLevel: freedomMath.safeLevels?.aggressive || null,
          
          // Catalysts
          catalysts: thesisMetrics.catalysts || [],
          catalystsCount: thesisMetrics.catalysts?.length || 0,
          
          // Timing
          lastUpdated: new Date().toISOString(),
        },
        data: {
          thesisMetrics: thesisMetrics,
          institutionalTrends: institutionalTrends,
          freedomMath: freedomMath,
        },
      };
    } catch (error) {
      return {
        text: `Market context analysis temporarily unavailable: ${error.message}`,
        values: { marketContextError: true },
      };
    }
  },
}; 