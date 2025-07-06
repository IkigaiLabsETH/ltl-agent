import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
} from "@elizaos/core";
import { StarterService } from "../services/StarterService";

/**
 * Investment Strategy Action
 * Provides Bitcoin-focused investment guidance and portfolio optimization
 */
export const investmentStrategyAction: Action = {
  name: "INVESTMENT_STRATEGY_ADVICE",
  similes: [
    "INVESTMENT_ADVICE",
    "PORTFOLIO_STRATEGY",
    "BITCOIN_STRATEGY",
    "MSTY_STRATEGY",
    "FINANCIAL_ADVICE",
    "PORTFOLIO_ADVICE",
  ],
  description: "Provides Bitcoin-focused investment strategy and portfolio optimization guidance",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<boolean> => {
    const text = message.content.text.toLowerCase();
    return (
      (text.includes("investment") ||
        text.includes("portfolio") ||
        text.includes("strategy") ||
        text.includes("msty") ||
        text.includes("mstr") ||
        text.includes("freedom") ||
        text.includes("money") ||
        text.includes("wealth") ||
        text.includes("btc") ||
        text.includes("bitcoin")) &&
      (text.includes("how much") ||
        text.includes("strategy") ||
        text.includes("advice") ||
        text.includes("invest") ||
        text.includes("portfolio") ||
        text.includes("allocation"))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback: HandlerCallback,
    _responses: Memory[],
  ) => {
    try {
      const text = message.content.text.toLowerCase();
      let strategy = "";

      if (text.includes("msty") || text.includes("income")) {
        strategy = `
📊 **MSTY STRATEGY: ON-CHAIN PAYCHECK**

**The Framework:**
• Eighty percent Bitcoin cold storage (long-term accumulation)
• Twenty percent MSTY for monthly income generation
• Live off MSTY distributions, never touch Bitcoin principal
• Dollar-cost average into Bitcoin during market cycles

**How MSTY Works:**
MSTY extracts yield from MicroStrategy's volatility through sophisticated options overlays. When MSTR moves, MSTY captures premium. This creates consistent monthly distributions while maintaining Bitcoin exposure through the underlying MSTR holdings.

**Implementation:**
• Start with one hundred thousand dollar allocation minimum
• Reinvest MSTY distributions during bear markets
• Scale position as Bitcoin appreciation compounds
• Use distributions for living expenses, not speculation

**Risk Management:**
MSTY is not Bitcoin - it's a derivative play on Bitcoin volatility through MicroStrategy. Understand counterparty risk, options decay, and market correlation. This is sophisticated financial engineering, not simple stacking.

**Mathematical Reality:**
At current yields, one million dollars in MSTY generates approximately eight to twelve thousand monthly. This creates financial runway while your Bitcoin stack appreciates toward thesis targets.

*Your on-chain paycheck - designed for Bitcoiners who want to preserve long-term upside while generating current income.*
        `;
      } else if (text.includes("freedom") || text.includes("how much")) {
        const bitcoinService = runtime.getService("bitcoin-data") as StarterService;
        if (bitcoinService) {
          const freedomMath = await bitcoinService.calculateFreedomMathematics();

          strategy = `
🔢 **BITCOIN FREEDOM MATHEMATICS**

**Current Analysis (at $${freedomMath.currentPrice.toLocaleString()}):**
• Freedom Target: $10M net worth
• Bitcoin Needed Today: **${freedomMath.btcNeeded.toFixed(2)} BTC**
• Conservative Target: **${freedomMath.safeLevels.conservative.toFixed(2)} BTC** (50% buffer)
• Moderate Target: **${freedomMath.safeLevels.moderate.toFixed(2)} BTC** (25% buffer)

**Thesis Scenarios:**
• **$250K BTC** (2-3 years): ${freedomMath.scenarios.thesis250k.btc.toFixed(1)} BTC needed
• **$500K BTC** (3-5 years): ${freedomMath.scenarios.thesis500k.btc.toFixed(1)} BTC needed  
• **$1M BTC** (5-10 years): ${freedomMath.scenarios.thesis1m.btc.toFixed(1)} BTC needed

**The Six Point One Five Strategy:**
With Bitcoin's historical forty-four percent compound annual growth rate, six point one five plus BTC enables freedom by twenty twenty-five. Less than zero point three BTC per millionaire worldwide - global scarcity becoming apparent.

**Implementation Framework:**
1. **Accumulation Phase:** Dollar-cost average toward target
2. **Preservation Phase:** Cold storage with multi-sig security
3. **Income Phase:** Deploy MSTY or yield strategies on portion
4. **Legacy Phase:** Intergenerational wealth transfer

**Risk Considerations:**
- Bitcoin volatility can cause 20-30% drawdowns
- Regulatory uncertainty in various jurisdictions  
- Technology risks (quantum computing, etc.)
- Execution risks (custody, security, taxation)

*Freedom is mathematical. Calculate your target, execute your plan, verify through accumulation.*
          `;
        } else {
          strategy = `
🔢 **BITCOIN FREEDOM MATHEMATICS**

**The Framework:**
With Bitcoin's historical forty-four percent compound annual growth rate, six point one five plus BTC enables freedom by twenty twenty-five. At current prices around one hundred thousand dollars, this equals approximately six hundred thousand dollar investment for potential ten million outcome.

**Conservative Targeting:**
• Ten BTC target accounts for volatility and bear markets
• Provides fifty percent buffer against thesis timeline uncertainty
• Aligns with one hundred thousand BTC Holders wealth creation event

**Implementation Strategy:**
1. **Base Layer:** Six to ten BTC in cold storage (sovereign stack)
2. **Income Layer:** MSTY or yield strategies for cash flow
3. **Speculation Layer:** Small allocation to Lightning or mining
4. **Fiat Bridge:** Traditional assets during accumulation phase

*Less than zero point three BTC per millionaire worldwide. Global scarcity becoming apparent.*
          `;
        }
      } else if (text.includes("portfolio") || text.includes("allocation")) {
        strategy = `
🎯 **BITCOIN-NATIVE PORTFOLIO CONSTRUCTION**

**Core Allocation Framework:**
• **40-60%** Bitcoin (cold storage, multi-sig)
• **20-30%** MSTR/MSTY (leveraged Bitcoin exposure + income)
• **10-20%** Traditional assets (bonds, real estate)
• **5-10%** Speculation (altcoins, mining, Lightning)

**Risk-Based Allocation:**
**Conservative (Age 50+):**
• 40% Bitcoin, 30% MSTY, 20% Bonds, 10% Speculation

**Moderate (Age 30-50):**
• 50% Bitcoin, 25% MSTR, 15% Real Estate, 10% Speculation

**Aggressive (Age <30):**
• 60% Bitcoin, 20% MSTR, 10% Traditional, 10% High-risk

**Rebalancing Philosophy:**
Never sell Bitcoin. Rebalance by adjusting new capital allocation. Bitcoin is the asset you hold forever, everything else serves Bitcoin accumulation or income generation.

**Tax Optimization:**
• Hold Bitcoin longer than one year for capital gains treatment
• Use tax-advantaged accounts for MSTR/MSTY when possible
• Consider domicile optimization for high net worth individuals
• Structure inheritance through multi-generational trusts

*Seek wealth, not money or status. Wealth is assets that earn while you sleep.*
        `;
      } else {
        strategy = `
💰 **BITCOIN INVESTMENT STRATEGY: COMPLETE FRAMEWORK**

**Core Thesis:**
Bitcoin is transitioning from speculative asset to reserve asset. Institutional adoption, sovereign adoption, and regulatory clarity creating unprecedented demand against fixed twenty-one million supply cap.

**Investment Phases:**

**1. Accumulation (0-10 BTC):**
• Dollar-cost average weekly or monthly
• Focus on cold storage and security setup
• Learn Lightning Network and self-custody
• Minimize trading, maximize stacking

**2. Optimization (10+ BTC):**
• Deploy yield strategies (MSTY, DeFi)
• Consider MSTR exposure for leverage
• Geographic and custody diversification
• Tax planning and structure optimization

**3. Sovereignty (50+ BTC):**
• Multi-generational wealth planning
• Real estate and luxury asset allocation
• Angel investing and business development
• Cultural capital and influence building

**Risk Management:**
• Never invest more than you can afford to lose completely
• Understand Bitcoin's volatility and drawdown potential
• Diversify custody methods and geographic exposure
• Maintain emergency fiat reserves for liquidity needs

**Key Principles:**
• Time in market beats timing the market
• Security and custody are more important than yield
• Study Bitcoin, not charts
• Think in decades, not quarters

*The dawn is now. What impossible thing are you building with this knowledge?*
        `;
      }

      const responseContent: Content = {
        text: strategy.trim(),
        actions: ["INVESTMENT_STRATEGY_ADVICE"],
        source: message.content.source || "investment-strategy",
      };

      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in investment strategy action:", error);

      const errorContent: Content = {
        text: "Unable to provide investment strategy advice at this time. Truth requires verification through mathematical analysis and risk assessment.",
        actions: ["INVESTMENT_STRATEGY_ADVICE"],
        source: message.content.source || "investment-strategy",
      };

      await callback(errorContent);
      return errorContent;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "What investment strategy should I follow for Bitcoin?",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "💰 **BITCOIN INVESTMENT STRATEGY: COMPLETE FRAMEWORK**\n\nCore Thesis: Bitcoin transitioning from speculative to reserve asset.\n\nInvestment Phases:\n1. Accumulation (0-10 BTC): Dollar-cost average, cold storage, self-custody\n2. Optimization (10+ BTC): Yield strategies, MSTR exposure, diversification\n3. Sovereignty (50+ BTC): Multi-generational planning, real estate, angel investing\n\nKey Principles: Time in market beats timing, security over yield, study Bitcoin not charts, think in decades not quarters.",
          actions: ["INVESTMENT_STRATEGY_ADVICE"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Tell me about MSTY strategy",
        },
      },
      {
        name: "Satoshi",
        content: {
          text: "📊 **MSTY STRATEGY: ON-CHAIN PAYCHECK**\n\nThe Framework: 80% Bitcoin cold storage, 20% MSTY for monthly income. Live off MSTY distributions, never touch Bitcoin principal.\n\nHow MSTY Works: Extracts yield from MicroStrategy's volatility through options overlays. Creates consistent monthly distributions while maintaining Bitcoin exposure.\n\nImplementation: Start with $100K minimum, reinvest distributions during bear markets, scale as Bitcoin appreciates.\n\nMathematical Reality: $1M in MSTY generates $8-12K monthly. Your on-chain paycheck.",
          actions: ["INVESTMENT_STRATEGY_ADVICE"],
        },
      },
    ],
  ],
}; 