import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { RealTimeDataService } from "../services/RealTimeDataService";
import { ETFDataService } from "../services/ETFDataService";

/**
 * Economic Indicators Provider - Macro economic context
 * Following ElizaOS documentation patterns
 * Position: 1 (after basic market data)
 */
export const economicIndicatorsProvider: Provider = {
  name: "economicIndicators",
  description: "Provides macro economic indicators and ETF flow data",
  position: 1, // After basic market data

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      const realTimeService = runtime.getService(
        "real-time-data",
      ) as RealTimeDataService;
      const etfService = runtime.getService("etf-data") as ETFDataService;

      if (!realTimeService) {
        return {
          text: "Economic indicators service not available",
          values: { economicDataError: true },
        };
      }

      // Get economic data
      const economicIndicators = realTimeService.getEconomicIndicators();

      // Get ETF data if available
      let etfContext = "";
      let etfData = null;

      if (etfService) {
        try {
          // Try to get ETF data - this would need to be implemented in ETFDataService
          // For now, we'll provide a placeholder structure
          etfContext = "Bitcoin ETF data available. ";
          etfData = {
            hasETFData: true,
            message:
              "ETF service available but data methods need implementation",
          };
        } catch (error) {
          etfContext = "ETF data temporarily unavailable. ";
        }
      }

      // Format economic context
      let context = "Economic indicators: ";

      if (economicIndicators?.length > 0) {
        const recentIndicators = economicIndicators.slice(0, 3);
        const indicatorSummary = recentIndicators
          .map((indicator) => {
            const trend =
              indicator.change > 0 ? "↑" : indicator.change < 0 ? "↓" : "→";
            return `${indicator.name}: ${indicator.value}${indicator.unit || ""} ${trend}`;
          })
          .join(", ");
        context += indicatorSummary + ". ";
      } else {
        context += "Loading economic data. ";
      }

      context += etfContext;

      // Get Bitcoin price context from state if available
      const btcPrice = state?.values?.bitcoinPrice;
      if (btcPrice && economicIndicators?.length > 0) {
        context += `Bitcoin trading at $${btcPrice.toLocaleString()} amid current economic conditions. `;
      }

      return {
        text: context,
        values: {
          economicIndicatorsCount: economicIndicators?.length || 0,
          hasETFData: !!etfService,
          economicDataLastUpdate: economicIndicators?.[0]?.releaseDate || null,

          // Economic indicator summaries
          indicators:
            economicIndicators?.slice(0, 5)?.map((indicator) => ({
              name: indicator.name,
              value: indicator.value,
              unit: indicator.unit,
              change: indicator.change,
              previousValue: indicator.previousValue,
              releaseDate: indicator.releaseDate,
              trend:
                indicator.change > 0
                  ? "up"
                  : indicator.change < 0
                    ? "down"
                    : "flat",
            })) || [],

          // ETF context
          etfServiceAvailable: !!etfService,

          // Context timing
          lastUpdated: new Date().toISOString(),
        },
        data: {
          economicIndicators: economicIndicators,
          etfData: etfData,
          etfService: !!etfService,
        },
      };
    } catch (error) {
      return {
        text: `Economic indicators temporarily unavailable: ${error.message}`,
        values: { economicDataError: true },
      };
    }
  },
};
