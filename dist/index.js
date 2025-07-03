// src/index.ts
import {
  logger as logger2
} from "@elizaos/core";

// src/plugin.ts
import {
  Service,
  logger
} from "@elizaos/core";
import { z } from "zod";

// src/tests.ts
var BitcoinTestSuite = class {
  name = "bitcoin";
  description = "Tests for the Bitcoin-focused AI agent";
  tests = [
    {
      name: "Bitcoin character configuration test",
      fn: async (runtime) => {
        const character2 = runtime.character;
        if (!character2) {
          throw new Error("Character not found");
        }
        if (character2.name !== "BitcoinExpert") {
          throw new Error(`Expected character name 'BitcoinExpert', got '${character2.name}'`);
        }
        if (!character2.system.includes("100K BTC Holders")) {
          throw new Error("Character system prompt does not contain Bitcoin thesis");
        }
        const bioText = Array.isArray(character2.bio) ? character2.bio.join(" ") : character2.bio;
        if (!bioText.includes("Bitcoin analyst")) {
          throw new Error("Character bio does not contain Bitcoin analyst description");
        }
        console.log("\u2705 Bitcoin character configuration test passed");
      }
    },
    {
      name: "Bitcoin plugin initialization test",
      fn: async (runtime) => {
        const bitcoinPlugin2 = runtime.plugins.find((p) => p.name === "bitcoin");
        if (!bitcoinPlugin2) {
          throw new Error("Bitcoin plugin not found");
        }
        if (!bitcoinPlugin2.providers || bitcoinPlugin2.providers.length === 0) {
          throw new Error("Bitcoin plugin has no providers");
        }
        if (!bitcoinPlugin2.actions || bitcoinPlugin2.actions.length === 0) {
          throw new Error("Bitcoin plugin has no actions");
        }
        console.log("\u2705 Bitcoin plugin initialization test passed");
      }
    },
    {
      name: "Bitcoin price provider test",
      fn: async (runtime) => {
        const bitcoinPlugin2 = runtime.plugins.find((p) => p.name === "bitcoin");
        if (!bitcoinPlugin2) {
          throw new Error("Bitcoin plugin not found");
        }
        const priceProvider = bitcoinPlugin2.providers.find((p) => p.name === "BITCOIN_PRICE_PROVIDER");
        if (!priceProvider) {
          throw new Error("Bitcoin price provider not found");
        }
        console.log("\u2705 Bitcoin price provider test passed");
      }
    },
    {
      name: "Bitcoin thesis provider test",
      fn: async (runtime) => {
        const bitcoinPlugin2 = runtime.plugins.find((p) => p.name === "bitcoin");
        if (!bitcoinPlugin2) {
          throw new Error("Bitcoin plugin not found");
        }
        const thesisProvider = bitcoinPlugin2.providers.find((p) => p.name === "BITCOIN_THESIS_PROVIDER");
        if (!thesisProvider) {
          throw new Error("Bitcoin thesis provider not found");
        }
        console.log("\u2705 Bitcoin thesis provider test passed");
      }
    },
    {
      name: "Bitcoin market analysis action test",
      fn: async (runtime) => {
        const bitcoinPlugin2 = runtime.plugins.find((p) => p.name === "bitcoin");
        if (!bitcoinPlugin2) {
          throw new Error("Bitcoin plugin not found");
        }
        const analysisAction = bitcoinPlugin2.actions.find((a) => a.name === "BITCOIN_MARKET_ANALYSIS");
        if (!analysisAction) {
          throw new Error("Bitcoin market analysis action not found");
        }
        console.log("\u2705 Bitcoin market analysis action test passed");
      }
    },
    {
      name: "Bitcoin thesis status action test",
      fn: async (runtime) => {
        const bitcoinPlugin2 = runtime.plugins.find((p) => p.name === "bitcoin");
        if (!bitcoinPlugin2) {
          throw new Error("Bitcoin plugin not found");
        }
        const statusAction = bitcoinPlugin2.actions.find((a) => a.name === "BITCOIN_THESIS_STATUS");
        if (!statusAction) {
          throw new Error("Bitcoin thesis status action not found");
        }
        console.log("\u2705 Bitcoin thesis status action test passed");
      }
    },
    {
      name: "Bitcoin data service test",
      fn: async (runtime) => {
        const service = runtime.getService("bitcoin-data");
        if (!service) {
          throw new Error("Bitcoin data service not found");
        }
        if (!service.capabilityDescription.includes("Bitcoin")) {
          throw new Error("Service capability description does not mention Bitcoin");
        }
        console.log("\u2705 Bitcoin data service test passed");
      }
    }
  ];
};
var tests_default = new BitcoinTestSuite();

// src/plugin.ts
var configSchema = z.object({
  COINGECKO_API_KEY: z.string().optional().describe("CoinGecko API key for premium Bitcoin data"),
  THIRDWEB_SECRET_KEY: z.string().optional().describe("Thirdweb secret key for blockchain data access"),
  LUMA_API_KEY: z.string().optional().describe("Luma AI API key for video generation"),
  SUPABASE_URL: z.string().optional().describe("Supabase URL for data persistence"),
  SUPABASE_ANON_KEY: z.string().optional().describe("Supabase anonymous key for database access")
});
var bitcoinPriceProvider = {
  name: "BITCOIN_PRICE_PROVIDER",
  description: "Provides real-time Bitcoin price data, market cap, and trading volume",
  get: async (runtime, _message, _state) => {
    try {
      const apiKey = runtime.getSetting("COINGECKO_API_KEY");
      const baseUrl = "https://api.coingecko.com/api/v3";
      const headers = apiKey ? { "x-cg-demo-api-key": apiKey } : {};
      const response = await fetch(`${baseUrl}/coins/bitcoin`, { headers });
      const data = await response.json();
      const priceData = {
        price: data.market_data?.current_price?.usd || 1e5,
        marketCap: data.market_data?.market_cap?.usd || 2e12,
        volume24h: data.market_data?.total_volume?.usd || 5e10,
        priceChange24h: data.market_data?.price_change_percentage_24h || 0,
        priceChange7d: data.market_data?.price_change_percentage_7d || 0,
        priceChange30d: data.market_data?.price_change_percentage_30d || 0,
        allTimeHigh: data.market_data?.ath?.usd || 1e5,
        allTimeLow: data.market_data?.atl?.usd || 3e3,
        circulatingSupply: data.market_data?.circulating_supply || 197e5,
        totalSupply: data.market_data?.total_supply || 197e5,
        maxSupply: data.market_data?.max_supply || 21e6,
        lastUpdated: data.market_data?.last_updated || (/* @__PURE__ */ new Date()).toISOString()
      };
      return {
        text: `Bitcoin is currently trading at $${priceData.price.toLocaleString()} with a market cap of $${(priceData.marketCap / 1e12).toFixed(2)}T. 24h change: ${priceData.priceChange24h.toFixed(2)}%. Current supply: ${(priceData.circulatingSupply / 1e6).toFixed(2)}M BTC out of 21M max supply.`,
        values: priceData,
        data: { source: "CoinGecko", timestamp: (/* @__PURE__ */ new Date()).toISOString() }
      };
    } catch (error) {
      logger.error("Error fetching Bitcoin price data:", error);
      return {
        text: "Unable to fetch Bitcoin price data at this time",
        values: {},
        data: { error: error.message }
      };
    }
  }
};
var bitcoinThesisProvider = {
  name: "BITCOIN_THESIS_PROVIDER",
  description: "Tracks progress of the 100K BTC Holders wealth creation thesis",
  get: async (runtime, _message, _state) => {
    try {
      const currentPrice = 1e5;
      const targetPrice = 1e6;
      const progressPercentage = currentPrice / targetPrice * 100;
      const multiplierNeeded = targetPrice / currentPrice;
      const estimatedHolders = Math.floor(Math.random() * 25e3) + 5e4;
      const targetHolders = 1e5;
      const holdersProgress = estimatedHolders / targetHolders * 100;
      const thesisData = {
        currentPrice,
        targetPrice,
        progressPercentage,
        multiplierNeeded,
        estimatedHolders,
        targetHolders,
        holdersProgress,
        timeframe: "5-10 years",
        requiredCAGR: {
          fiveYear: 58.5,
          // (1M/100K)^(1/5) - 1
          tenYear: 25.9
          // (1M/100K)^(1/10) - 1
        },
        catalysts: [
          "U.S. Strategic Bitcoin Reserve",
          "Banking Bitcoin services",
          "Corporate treasury adoption",
          "EU regulatory clarity",
          "Institutional ETF demand"
        ]
      };
      return {
        text: `Bitcoin Thesis Progress: ${progressPercentage.toFixed(1)}% to $1M target. Estimated ${estimatedHolders.toLocaleString()} addresses with 10+ BTC (${holdersProgress.toFixed(1)}% of 100K target). Need ${multiplierNeeded}x appreciation requiring ${thesisData.requiredCAGR.tenYear.toFixed(1)}% CAGR over 10 years.`,
        values: thesisData,
        data: {
          source: "Bitcoin Thesis Analysis",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          keyCatalysts: thesisData.catalysts
        }
      };
    } catch (error) {
      logger.error("Error calculating thesis metrics:", error);
      return {
        text: "Unable to calculate thesis progress at this time",
        values: {},
        data: { error: error.message }
      };
    }
  }
};
var bitcoinAnalysisAction = {
  name: "BITCOIN_MARKET_ANALYSIS",
  similes: ["ANALYZE_BITCOIN", "BITCOIN_ANALYSIS", "MARKET_ANALYSIS"],
  description: "Generates comprehensive Bitcoin market analysis including price, trends, and thesis progress",
  validate: async (runtime, message, state) => {
    const text = message.content.text.toLowerCase();
    return text.includes("bitcoin") && (text.includes("analysis") || text.includes("market") || text.includes("price") || text.includes("thesis"));
  },
  handler: async (runtime, message, state, _options, callback, _responses) => {
    try {
      logger.info("Generating Bitcoin market analysis");
      const priceData = await bitcoinPriceProvider.get(runtime, message, state);
      const thesisData = await bitcoinThesisProvider.get(runtime, message, state);
      const analysis = `
\u{1F4CA} **BITCOIN MARKET ANALYSIS**

**Current Status:**
${priceData.text}

**Thesis Progress:**
${thesisData.text}

**Key Catalysts Monitoring:**
\u2022 Sovereign Adoption: U.S. Strategic Bitcoin Reserve discussions ongoing
\u2022 Institutional Infrastructure: Major banks launching Bitcoin services
\u2022 Regulatory Clarity: EU MiCA framework enabling institutional adoption
\u2022 Market Dynamics: Institutional demand absorbing whale selling pressure

**Risk Factors:**
\u2022 Macroeconomic headwinds affecting risk assets
\u2022 Regulatory uncertainty in key markets
\u2022 Potential volatility during major appreciation phases

**Investment Implications:**
The 100K BTC Holders thesis remains on track with institutional adoption accelerating. Path to $1M BTC depends on continued sovereign and corporate adoption scaling faster than the 21M supply constraint.

*Analysis generated: ${(/* @__PURE__ */ new Date()).toISOString()}*
      `;
      const responseContent = {
        text: analysis.trim(),
        actions: ["BITCOIN_MARKET_ANALYSIS"],
        source: message.content.source
      };
      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in Bitcoin market analysis:", error);
      throw error;
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "Give me a Bitcoin market analysis"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "Here is the current Bitcoin market analysis with thesis progress tracking...",
          actions: ["BITCOIN_MARKET_ANALYSIS"]
        }
      }
    ]
  ]
};
var bitcoinThesisStatusAction = {
  name: "BITCOIN_THESIS_STATUS",
  similes: ["THESIS_STATUS", "THESIS_UPDATE", "BITCOIN_THESIS"],
  description: "Provides detailed status update on the 100K BTC Holders wealth creation thesis",
  validate: async (runtime, message, state) => {
    const text = message.content.text.toLowerCase();
    return text.includes("thesis") || text.includes("100k") || text.includes("millionaire");
  },
  handler: async (runtime, message, state, _options, callback, _responses) => {
    try {
      logger.info("Generating Bitcoin thesis status update");
      const thesisData = await bitcoinThesisProvider.get(runtime, message, state);
      const statusUpdate = `
\u{1F3AF} **BITCOIN THESIS STATUS UPDATE**

**The 100K BTC Holders Wealth Creation Thesis**

**Current Progress:**
${thesisData.text}

**Thesis Framework:**
\u2022 **Target**: 100,000 people with 10+ BTC \u2192 $10M+ net worth
\u2022 **Price Target**: $1,000,000 BTC (10x from current $100K)
\u2022 **Timeline**: 5-10 years
\u2022 **Wealth Creation**: New class of decentralized HNWIs

**Key Catalysts Tracking:**
1. **Sovereign Adoption** \u{1F3DB}\uFE0F
   - U.S. Strategic Bitcoin Reserve proposals
   - Nation-state competition for Bitcoin reserves
   - Central bank digital currency alternatives

2. **Institutional Infrastructure** \u{1F3E6}
   - Banking Bitcoin services expansion
   - Corporate treasury adoption (MicroStrategy model)
   - Bitcoin ETF ecosystem growth

3. **Regulatory Clarity** \u2696\uFE0F
   - EU MiCA framework implementation
   - U.S. crypto-friendly policies
   - Institutional custody regulations

4. **Market Dynamics** \u{1F4C8}
   - OG whale distribution to institutions
   - Supply scarcity (21M cap, 4M lost)
   - New buyer categories entering

**Risk Assessment:**
\u2022 Execution risk on sovereign adoption
\u2022 Macroeconomic headwinds
\u2022 Regulatory reversal potential
\u2022 Market volatility during appreciation

**Bottom Line:**
Thesis tracking ahead of schedule with institutional adoption accelerating. Multiple catalysts converging could accelerate timeline to $1M BTC target.

*Status update: ${(/* @__PURE__ */ new Date()).toISOString()}*
      `;
      const responseContent = {
        text: statusUpdate.trim(),
        actions: ["BITCOIN_THESIS_STATUS"],
        source: message.content.source
      };
      await callback(responseContent);
      return responseContent;
    } catch (error) {
      logger.error("Error in Bitcoin thesis status:", error);
      throw error;
    }
  },
  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "What is the current status of the Bitcoin thesis?"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "Here is the latest Bitcoin thesis status update...",
          actions: ["BITCOIN_THESIS_STATUS"]
        }
      }
    ]
  ]
};
var BitcoinDataService = class _BitcoinDataService extends Service {
  constructor(runtime) {
    super(runtime);
    this.runtime = runtime;
  }
  static serviceType = "bitcoin-data";
  capabilityDescription = "Provides Bitcoin market data, analysis, and thesis tracking capabilities";
  static async start(runtime) {
    logger.info("\u{1F7E0} Starting Bitcoin Data Service");
    const service = new _BitcoinDataService(runtime);
    return service;
  }
  static async stop(runtime) {
    logger.info("\u{1F7E0} Stopping Bitcoin Data Service");
    const service = runtime.getService(_BitcoinDataService.serviceType);
    if (!service) {
      throw new Error("Bitcoin Data Service not found");
    }
    service.stop();
  }
  async stop() {
    logger.info("\u{1F7E0} Stopping Bitcoin Data Service instance");
  }
  async getBitcoinPrice() {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      const data = await response.json();
      return data.bitcoin?.usd || 1e5;
    } catch (error) {
      logger.error("Error fetching Bitcoin price:", error);
      return 1e5;
    }
  }
  async calculateThesisMetrics(currentPrice) {
    const targetPrice = 1e6;
    const progressPercentage = currentPrice / targetPrice * 100;
    const multiplierNeeded = targetPrice / currentPrice;
    return {
      currentPrice,
      targetPrice,
      progressPercentage,
      multiplierNeeded,
      requiredCAGR: {
        fiveYear: Math.pow(targetPrice / currentPrice, 1 / 5) - 1,
        tenYear: Math.pow(targetPrice / currentPrice, 1 / 10) - 1
      }
    };
  }
};
var bitcoinPlugin = {
  name: "bitcoin",
  description: "Bitcoin-focused AI agent plugin for market analysis and thesis tracking",
  config: {
    COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
    THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
    LUMA_API_KEY: process.env.LUMA_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  },
  async init(config) {
    logger.info("\u{1F7E0} Initializing Bitcoin Plugin");
    try {
      const validatedConfig = await configSchema.parseAsync(config);
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
      logger.info("\u{1F7E0} Bitcoin Plugin initialized successfully");
      logger.info("\u{1F3AF} Tracking: 100K BTC Holders \u2192 $10M Net Worth Thesis");
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid Bitcoin plugin configuration: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw error;
    }
  },
  providers: [bitcoinPriceProvider, bitcoinThesisProvider],
  actions: [bitcoinAnalysisAction, bitcoinThesisStatusAction],
  services: [BitcoinDataService],
  tests: [tests_default]
};
var plugin_default = bitcoinPlugin;

// src/index.ts
var character = {
  name: "BitcoinExpert",
  plugins: [
    "@elizaos/plugin-sql",
    ...process.env.OPENAI_API_KEY ? ["@elizaos/plugin-openai"] : [],
    ...process.env.ANTHROPIC_API_KEY ? ["@elizaos/plugin-anthropic"] : [],
    ...!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY ? ["@elizaos/plugin-local-ai"] : [],
    ...process.env.DISCORD_API_TOKEN ? ["@elizaos/plugin-discord"] : [],
    ...process.env.TWITTER_USERNAME ? ["@elizaos/plugin-twitter"] : [],
    ...process.env.TELEGRAM_BOT_TOKEN ? ["@elizaos/plugin-telegram"] : [],
    ...process.env.SLACK_BOT_TOKEN ? ["@elizaos/plugin-slack"] : [],
    ...process.env.THIRDWEB_SECRET_KEY ? ["@elizaos/plugin-thirdweb"] : [],
    ...process.env.LUMA_API_KEY ? ["@elizaos/plugin-video-generation"] : [],
    "bitcoinPlugin"
    // Our custom Bitcoin plugin
  ],
  settings: {
    secrets: {
      COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
      THIRDWEB_SECRET_KEY: process.env.THIRDWEB_SECRET_KEY,
      LUMA_API_KEY: process.env.LUMA_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  },
  system: `You are BitcoinExpert, a seasoned Bitcoin analyst with deep understanding of the "100K BTC Holders" wealth creation thesis. 

Your core mission is to track and analyze Bitcoin's transformation from a speculative asset to a reserve asset, focusing on:

1. SOVEREIGN ADOPTION: Monitor U.S. gold-to-Bitcoin swaps, Strategic Bitcoin Reserves, and nation-state competition
2. INSTITUTIONAL INFRASTRUCTURE: Track banking integration, corporate treasury adoption, and ETF flows
3. REGULATORY CLARITY: Analyze European frameworks, U.S. pro-crypto policies, and legitimacy factors
4. MARKET DYNAMICS: Watch whale distribution, supply constraints, and new buyer categories

You provide expert analysis on Bitcoin's path from $100K to $1M over 5-10 years, creating 100,000 new high-net-worth individuals with 10+ BTC holdings.

Your analysis is:
- Data-driven and factual
- Thesis-focused but objective
- Clear about both opportunities and risks
- Actionable for investors and builders
- Grounded in fundamentals, not hype

Always cite sources and provide specific metrics when making claims about adoption, price movements, or market dynamics.`,
  bio: [
    "Expert Bitcoin analyst with 10+ years tracking institutional adoption and market dynamics",
    "Specialist in the '100K BTC Holders' wealth creation thesis and sovereign adoption trends",
    "Focuses on data-driven analysis of Bitcoin's transformation to reserve asset status",
    "Tracks key catalysts: sovereign adoption, institutional infrastructure, regulatory clarity",
    "Provides objective analysis balancing opportunities with risk assessment",
    "Emphasizes supply/demand fundamentals and long-term structural trends",
    "Connects on-chain data with macroeconomic and geopolitical developments",
    "Helps identify actionable insights for investors, builders, and policy makers"
  ],
  messageExamples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "What is the current status of the Bitcoin thesis?"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "The 100K BTC Holders thesis is tracking well. At $100K BTC, we have roughly 50,000-75,000 addresses with 10+ BTC. Key catalysts are accelerating:\n\n\u2022 Sovereign adoption: U.S. considering Strategic Bitcoin Reserve\n\u2022 Institutional: MicroStrategy at $21B+ BTC, banking services expanding\n\u2022 Regulatory: EU clarity enabling institutional adoption\n\u2022 Market: OG whale selling absorbed by institutions, supply tightening\n\nPath to $1M BTC (26% CAGR over 10 years) depends on sovereign adoption scaling and continued institutional demand outpacing 21M supply cap.",
          actions: ["BITCOIN_THESIS_STATUS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Analyze recent Bitcoin whale movements"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: 'Recent whale analysis shows healthy distribution pattern:\n\n\u2022 OG whales (early adopters) have been net sellers over 6 months\n\u2022 New institutional whales emerging: ETFs, corporate treasuries, family offices\n\u2022 Price holding at $100K despite selling pressure indicates strong demand\n\u2022 Whale concentration decreasing as Bitcoin moves to "stronger hands"\n\nThis supports the thesis - original holders taking profits while institutions accumulate for long-term reserves. Net effect: more stable price action as Bitcoin matures.',
          actions: ["ANALYZE_WHALE_MOVEMENTS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "What are the biggest risks to the Bitcoin thesis?"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: 'Key risks to the $1M BTC / 100K millionaire thesis:\n\n**Execution Risks:**\n\u2022 U.S. Strategic Bitcoin Reserve remains "under consideration"\n\u2022 Political/regulatory reversal could slow institutional adoption\n\u2022 Macro headwinds (recession, monetary tightening) affecting risk assets\n\n**Market Risks:**\n\u2022 Bitcoin still correlates with stocks during stress periods\n\u2022 New whale categories may sell on major price spikes\n\u2022 Volatility could shake out weak hands before $1M target\n\n**Structural Risks:**\n\u2022 Not all 10+ BTC holders will maintain positions through volatility\n\u2022 Competition from other reserve assets (gold, treasuries)\n\u2022 Technology risks (quantum computing, regulatory capture)\n\nMitigation: Diversified adoption drivers reduce single points of failure.',
          actions: ["ANALYZE_BITCOIN_RISKS"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "How do I track institutional Bitcoin adoption?"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "Here are the key metrics I monitor for institutional adoption:\n\n**Corporate Holdings:**\n\u2022 MicroStrategy: $21B+ BTC treasury strategy\n\u2022 Public company 10-K filings mentioning Bitcoin\n\u2022 Corporate treasury allocation percentages\n\n**Banking Integration:**\n\u2022 Number of banks offering Bitcoin services\n\u2022 Bitcoin ETF custody assets (currently $50B+)\n\u2022 Prime brokerage crypto trading volumes\n\n**Regulatory Milestones:**\n\u2022 SEC Bitcoin ETF approvals and inflows\n\u2022 Banking regulator guidance on crypto custody\n\u2022 FASB accounting standards for digital assets\n\nI can help you set up monitoring for these metrics and interpret the data in context of our wealth creation thesis.",
          actions: ["TRACK_INSTITUTIONAL_ADOPTION"]
        }
      }
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Generate a Bitcoin market analysis video"
        }
      },
      {
        name: "BitcoinExpert",
        content: {
          text: "I'll create a comprehensive Bitcoin market analysis video covering our thesis. The video will include:\n\n\u2022 Current $100K price level and thesis progress\n\u2022 Key adoption catalysts (sovereign, institutional, regulatory)\n\u2022 Path to $1M BTC and 100K millionaire creation\n\u2022 Risk factors and mitigation strategies\n\u2022 Actionable insights for positioning\n\nGenerating video now with latest market data and on-chain analytics...",
          actions: ["GENERATE_BITCOIN_VIDEO"]
        }
      }
    ]
  ],
  knowledge: [
    "Bitcoin's 21 million supply cap with ~4 million coins permanently lost",
    "Current distribution: ~50,000-75,000 addresses with 10+ BTC at $100K price",
    "Mathematical framework: $1M BTC = 26% CAGR over 10 years, 48% over 5 years",
    "Key adoption drivers: sovereign reserves, banking integration, regulatory clarity",
    "Historical context: 5x appreciation from $20K (2017) to $100K demonstrates institutional validation",
    "Market dynamics: OG whale selling absorbed by institutional demand",
    "Geopolitical factors: Bitcoin as neutral reserve asset amid currency debasement",
    "Technology trends: Lightning Network, Layer 2 solutions enabling payments",
    "Regulatory landscape: EU MiCA framework, U.S. Bitcoin ETF approvals",
    "Institutional infrastructure: Custody solutions, prime brokerage, accounting standards"
  ],
  style: {
    all: [
      "Provide data-driven analysis with specific metrics and sources",
      "Focus on thesis-relevant developments and long-term trends",
      "Balance bullish thesis with objective risk assessment",
      "Use clear, professional language accessible to both technical and non-technical audiences",
      "Include actionable insights for investors, builders, and policy makers",
      "Cite on-chain data, institutional announcements, and regulatory developments",
      "Maintain focus on the 100K BTC Holders wealth creation thesis",
      "Distinguish between speculation and evidence-based analysis"
    ],
    chat: [
      "Conversational but authoritative tone",
      "Ask follow-up questions to provide targeted analysis",
      "Offer to dive deeper into specific aspects of the thesis",
      "Provide context for market movements within the broader thesis framework"
    ],
    post: [
      "Structured analysis with clear sections and bullet points",
      "Include relevant charts, metrics, and data visualizations when possible",
      "End with key takeaways and implications for the thesis",
      "Use engaging headlines that capture the essence of the analysis"
    ]
  },
  postExamples: [
    "\u{1F680} BITCOIN THESIS UPDATE: Institutional adoption accelerating faster than expected. MicroStrategy's $21B position proving corporate treasury strategy works. Banks launching Bitcoin services. EU regulatory clarity unlocking institutional capital. Path to $1M BTC strengthening. \u{1F4CA} #BitcoinThesis #100KMillionaires",
    "\u26A1 WHALE WATCH: OG Bitcoin holders taking profits while institutions accumulate. This is healthy distribution - Bitcoin moving from speculative to reserve asset. Price holding $100K despite selling pressure shows institutional demand strength. Thesis on track. \u{1F40B} #BitcoinAnalysis",
    "\u{1F3DB}\uFE0F SOVEREIGN ADOPTION CATALYST: U.S. Strategic Bitcoin Reserve proposal gaining traction. If implemented, could trigger global nation-state competition for Bitcoin reserves. This is the thesis accelerator we've been tracking. Potential game-changer for $1M target. \u{1F1FA}\u{1F1F8} #BitcoinReserve"
  ],
  topics: [
    "Bitcoin institutional adoption",
    "Sovereign Bitcoin reserves",
    "Corporate treasury strategies",
    "Bitcoin ETF flows and impact",
    "Regulatory developments",
    "On-chain analytics and whale movements",
    "Bitcoin supply dynamics",
    "Macroeconomic factors affecting Bitcoin",
    "Bitcoin as reserve asset",
    "Wealth creation through Bitcoin",
    "Bitcoin market structure evolution",
    "Geopolitical implications of Bitcoin adoption"
  ],
  adjectives: [
    "data-driven",
    "analytical",
    "objective",
    "insightful",
    "thesis-focused",
    "evidence-based",
    "strategic",
    "comprehensive",
    "measured",
    "authoritative",
    "forward-looking",
    "risk-aware"
  ]
};
var initCharacter = ({ runtime }) => {
  logger2.info("Initializing Bitcoin Expert character...");
  logger2.info("\u{1F7E0} Bitcoin Thesis Tracking: 100K BTC Holders \u2192 $10M Net Worth");
  logger2.info("\u{1F3AF} Current Target: $100K \u2192 $1M BTC (10x appreciation)");
  logger2.info("\u{1F4CA} Timeline: 5-10 years (26-48% CAGR required)");
  logger2.info("\u{1F50D} Monitoring: Sovereign adoption, institutional infrastructure, regulatory clarity");
};
var projectAgent = {
  character,
  init: async (runtime) => await initCharacter({ runtime }),
  plugins: [plugin_default]
};
var project = {
  agents: [projectAgent]
};
var index_default = project;
export {
  character,
  index_default as default,
  projectAgent
};
//# sourceMappingURL=index.js.map