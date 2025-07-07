/**
 * Bitcoin Selective Assets Provider
 * Tracks specific assets with BTC-relative performance and narratives
 * Implements 99% Bitcoin focus with 1% open mind for strategic intelligence
 */

import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { BitcoinIntelligenceService } from "../services/BitcoinIntelligenceService";
import { ElizaOSErrorHandler, LoggerWithContext, generateCorrelationId } from "../utils";

export const bitcoinSelectiveAssetsProvider: Provider = {
  name: "BITCOIN_SELECTIVE_ASSETS",
  description: "Selective asset tracking including MSTR, MTPLF, FARTCOIN, HYPE, CRCL, COIN, NVDA, TSLA, HOOD, MARA, RIOT with BTC-relative performance",
  position: -20, // Medium-high priority provider
  dynamic: false,

  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    const correlationId = generateCorrelationId();
    const logger = new LoggerWithContext("BitcoinSelectiveAssetsProvider", correlationId);
    
    try {
      // Get the Bitcoin Intelligence Service
      const bitcoinIntelService = runtime.getService<BitcoinIntelligenceService>("bitcoin-intelligence");
      if (!bitcoinIntelService) {
        logger.warn("Bitcoin Intelligence Service not available");
        return {
          text: "Bitcoin selective assets service is currently unavailable.",
          values: {
            bitcoinSelectiveAssets: {
              available: false,
              error: "Service not available"
            }
          }
        };
      }

      // Get selective assets data
      const intelligence = await bitcoinIntelService.getIntelligenceData();
      
      if (!intelligence) {
        logger.warn("Failed to retrieve Bitcoin selective assets data");
        return {
          text: "Unable to retrieve Bitcoin selective assets data at this time.",
          values: {
            bitcoinSelectiveAssets: {
              available: false,
              error: "Data retrieval failed"
            }
          }
        };
      }

      // Extract selective assets data
      const { treasuryCompanies, selectiveAltcoins, stablecoinEcosystem, techStocks, miningStocks } = intelligence;
      
      // Format the selective assets data for the agent
      const formattedAssets = formatSelectiveAssets({
        treasuryCompanies,
        selectiveAltcoins,
        stablecoinEcosystem,
        techStocks,
        miningStocks
      });
      
      return {
        text: formattedAssets.text,
        values: {
          bitcoinSelectiveAssets: {
            available: true,
            data: {
              treasuryCompanies,
              selectiveAltcoins,
              stablecoinEcosystem,
              techStocks,
              miningStocks
            },
            summary: formattedAssets.summary
          }
        },
        data: {
          rawSelectiveAssets: {
            treasuryCompanies,
            selectiveAltcoins,
            stablecoinEcosystem,
            techStocks,
            miningStocks
          }
        }
      };

    } catch (error) {
      ElizaOSErrorHandler.logStructuredError(error, logger, {
        context: "Bitcoin Selective Assets Provider",
        operation: "get selective assets"
      });
      
      return {
        text: "Bitcoin selective assets data is temporarily unavailable due to technical issues.",
        values: {
          bitcoinSelectiveAssets: {
            available: false,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        }
      };
    }
  }
};

/**
 * Format selective assets data for agent consumption
 */
function formatSelectiveAssets(assets: any) {
  const { treasuryCompanies, selectiveAltcoins, stablecoinEcosystem, techStocks, miningStocks } = assets;
  
  // Create a comprehensive summary
  const summary = {
    treasuryCompanies: {
      mstr: treasuryCompanies?.mstr?.vsBitcoin || 0,
      mtplf: treasuryCompanies?.mtpfl?.vsBitcoin || 0
    },
    selectiveAltcoins: {
      fartcoin: selectiveAltcoins?.fartcoin?.vsBitcoin || 0,
      hype: selectiveAltcoins?.hype?.vsBitcoin || 0
    },
    stablecoins: {
      crcl: stablecoinEcosystem?.crcl?.vsBitcoin || 0,
      coin: stablecoinEcosystem?.coin?.vsBitcoin || 0
    },
    techStocks: {
      nvda: techStocks?.nvda?.vsBitcoin || 0,
      tsla: techStocks?.tsla?.vsBitcoin || 0,
      hood: techStocks?.hood?.vsBitcoin || 0
    },
    miningStocks: {
      mara: miningStocks?.mara?.vsBitcoin || 0,
      riot: miningStocks?.riot?.vsBitcoin || 0
    }
  };

  // Format text for agent context
  const textParts = [];

  // Treasury Companies (Secondary Focus)
  if (treasuryCompanies) {
    if (treasuryCompanies.mstr) {
      const mstrEmoji = treasuryCompanies.mstr.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`MSTR: $${treasuryCompanies.mstr.price.toLocaleString()} (${mstrEmoji} ${treasuryCompanies.mstr.vsBitcoin > 0 ? '+' : ''}${treasuryCompanies.mstr.vsBitcoin}% vs BTC, ${treasuryCompanies.mstr.btcHoldings.toLocaleString()} BTC)`);
    }
    
    if (treasuryCompanies.mtpfl) {
      const mtplfEmoji = treasuryCompanies.mtpfl.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`MTPLF: $${treasuryCompanies.mtpfl.price.toLocaleString()} (${mtplfEmoji} ${treasuryCompanies.mtpfl.vsBitcoin > 0 ? '+' : ''}${treasuryCompanies.mtpfl.vsBitcoin}% vs BTC, ${treasuryCompanies.mtpfl.btcHoldings.toLocaleString()} BTC)`);
    }
  }

  // Selective Altcoins (Tertiary Focus)
  if (selectiveAltcoins) {
    if (selectiveAltcoins.fartcoin) {
      const fartcoinEmoji = selectiveAltcoins.fartcoin.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`FARTCOIN: $${selectiveAltcoins.fartcoin.price.toLocaleString()} (${fartcoinEmoji} ${selectiveAltcoins.fartcoin.vsBitcoin > 0 ? '+' : ''}${selectiveAltcoins.fartcoin.vsBitcoin}% vs BTC)`);
    }
    
    if (selectiveAltcoins.hype) {
      const hypeEmoji = selectiveAltcoins.hype.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`HYPE: $${selectiveAltcoins.hype.price.toLocaleString()} (${hypeEmoji} ${selectiveAltcoins.hype.vsBitcoin > 0 ? '+' : ''}${selectiveAltcoins.hype.vsBitcoin}% vs BTC, ${selectiveAltcoins.hype.buybackYield}% buyback yield)`);
    }
  }

  // Stablecoin Ecosystem (Context)
  if (stablecoinEcosystem) {
    if (stablecoinEcosystem.crcl) {
      const crclEmoji = stablecoinEcosystem.crcl.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`CRCL: $${stablecoinEcosystem.crcl.price.toLocaleString()} (${crclEmoji} ${stablecoinEcosystem.crcl.vsBitcoin > 0 ? '+' : ''}${stablecoinEcosystem.crcl.vsBitcoin}% vs BTC)`);
    }
    
    if (stablecoinEcosystem.coin) {
      const coinEmoji = stablecoinEcosystem.coin.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`COIN: $${stablecoinEcosystem.coin.price.toLocaleString()} (${coinEmoji} ${stablecoinEcosystem.coin.vsBitcoin > 0 ? '+' : ''}${stablecoinEcosystem.coin.vsBitcoin}% vs BTC)`);
    }
  }

  // Tech Stocks (Context)
  if (techStocks) {
    if (techStocks.nvda) {
      const nvdaEmoji = techStocks.nvda.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`NVDA: $${techStocks.nvda.price.toLocaleString()} (${nvdaEmoji} ${techStocks.nvda.vsBitcoin > 0 ? '+' : ''}${techStocks.nvda.vsBitcoin}% vs BTC)`);
    }
    
    if (techStocks.tsla) {
      const tslaEmoji = techStocks.tsla.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`TSLA: $${techStocks.tsla.price.toLocaleString()} (${tslaEmoji} ${techStocks.tsla.vsBitcoin > 0 ? '+' : ''}${techStocks.tsla.vsBitcoin}% vs BTC, ${techStocks.tsla.btcHoldings.toLocaleString()} BTC)`);
    }
    
    if (techStocks.hood) {
      const hoodEmoji = techStocks.hood.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`HOOD: $${techStocks.hood.price.toLocaleString()} (${hoodEmoji} ${techStocks.hood.vsBitcoin > 0 ? '+' : ''}${techStocks.hood.vsBitcoin}% vs BTC)`);
    }
  }

  // Mining Stocks (Awareness)
  if (miningStocks) {
    if (miningStocks.mara) {
      const maraEmoji = miningStocks.mara.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`MARA: $${miningStocks.mara.price.toLocaleString()} (${maraEmoji} ${miningStocks.mara.vsBitcoin > 0 ? '+' : ''}${miningStocks.mara.vsBitcoin}% vs BTC)`);
    }
    
    if (miningStocks.riot) {
      const riotEmoji = miningStocks.riot.vsBitcoin > 0 ? '📈' : '📉';
      textParts.push(`RIOT: $${miningStocks.riot.price.toLocaleString()} (${riotEmoji} ${miningStocks.riot.vsBitcoin > 0 ? '+' : ''}${miningStocks.riot.vsBitcoin}% vs BTC)`);
    }
  }

  // Altcoin season context
  if (selectiveAltcoins?.altcoinSeasonIndex !== undefined) {
    textParts.push(`Altcoin Season Index: ${selectiveAltcoins.altcoinSeasonIndex} (${getAltcoinSeasonStatus(selectiveAltcoins.altcoinSeasonIndex)})`);
  }

  // Bitcoin dominance context
  if (selectiveAltcoins?.bitcoinDominance !== undefined) {
    textParts.push(`Bitcoin Dominance: ${selectiveAltcoins.bitcoinDominance}%`);
  }

  return {
    text: textParts.join('. ') + '.',
    summary
  };
}

/**
 * Get altcoin season status based on index
 */
function getAltcoinSeasonStatus(index: number): string {
  if (index >= 75) return "Altcoin Season";
  if (index >= 50) return "Transitioning to Altcoin Season";
  if (index >= 25) return "Bitcoin Season";
  return "Strong Bitcoin Season";
} 