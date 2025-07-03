# Bitcoin LTL Plugin for ElizaOS

A Bitcoin-native AI agent plugin for LiveTheLifeTV that provides comprehensive Bitcoin market data, thesis tracking, and sovereign living insights.

## 🚀 Features

- **Real-time Bitcoin Price Data**: Get current BTC prices, market cap, and volume from CoinGecko
- **Thesis Tracking**: Monitor the "100K BTC Holders" wealth creation thesis
- **Institutional Analysis**: Track corporate adoption, ETF flows, and sovereign activity  
- **Lightning Network Advocacy**: Support for Bitcoin's second layer of sovereignty
- **Sovereign Living Insights**: Biohacking protocols and lifestyle optimization
- **Market Analytics**: Price change tracking (24h, 7d, 30d) and historical analysis

## 📦 Installation

### Using ElizaOS CLI (Recommended)

```bash
# Install the plugin
elizaos plugins install plugin-bitcoin-ltl

# Or add to your project's package.json
bun add plugin-bitcoin-ltl
```

### Manual Installation

```bash
bun add plugin-bitcoin-ltl
```

Then add to your agent's character file:

```json
{
  "plugins": [
    "plugin-bitcoin-ltl"
  ]
}
```

## ⚙️ Configuration

### Environment Variables

The plugin supports optional API keys for enhanced functionality:

```bash
# Optional: CoinGecko API key for premium data
COINGECKO_API_KEY=your_coingecko_api_key

# Optional: Thirdweb for blockchain data
THIRDWEB_SECRET_KEY=your_thirdweb_key

# Optional: Luma AI for video generation
LUMA_API_KEY=your_luma_key
```

### Basic Usage

The plugin works out of the box without API keys, using free tier data sources.

## 🎯 Available Actions

The plugin provides several actions for Bitcoin analysis:

- `BITCOIN_THESIS_STATUS`: Track the 100K BTC Holders thesis progress
- `BITCOIN_MARKET_ANALYSIS`: Current market conditions and price analysis
- `FREEDOM_MATHEMATICS`: Calculate Bitcoin needed for financial freedom
- `INVESTMENT_STRATEGY_ADVICE`: Bitcoin investment guidance
- `SOVEREIGN_LIVING_ADVICE`: Lifestyle and biohacking recommendations

## 📊 Providers

- **BitcoinPriceProvider**: Real-time Bitcoin price and market data
- **InstitutionalAdoptionProvider**: Corporate and sovereign Bitcoin adoption tracking
- **ThesisTrackingProvider**: Monitor progress toward Bitcoin thesis milestones

## 💡 Usage Examples

### Basic Bitcoin Price Query

```typescript
// Your agent can respond to:
"What's the current Bitcoin price?"
"How is the Bitcoin thesis progressing?"
"What's your take on altcoins?"
```

### Character Integration

```json
{
  "name": "BitcoinAnalyst",
  "plugins": [
    "plugin-bitcoin-ltl",
    "@elizaos/plugin-bootstrap"
  ],
  "messageExamples": [
    [
      {
        "name": "{{user}}",
        "content": { "text": "What's the Bitcoin thesis status?" }
      },
      {
        "name": "BitcoinAnalyst",
        "content": {
          "text": "The 100K BTC Holders thesis is tracking well...",
          "actions": ["BITCOIN_THESIS_STATUS"]
        }
      }
    ]
  ]
}
```

## 🔧 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/LiveTheLifeTV/plugin-bitcoin-ltl.git
cd plugin-bitcoin-ltl

# Install dependencies
bun install

# Build the plugin
bun run build

# Test the plugin
bun run test
```

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Requirements

- ElizaOS v1.0.17 or higher
- Node.js 18+ 
- Optional: API keys for enhanced features

## 🎨 Plugin Architecture

This plugin follows ElizaOS best practices:

- **Services**: Long-running data services for Bitcoin market tracking
- **Actions**: Executable capabilities triggered by user queries
- **Providers**: Context providers for real-time market data
- **Error Handling**: Comprehensive error handling and retry logic

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- GitHub Issues: [Report bugs or request features](https://github.com/LiveTheLifeTV/plugin-bitcoin-ltl/issues)
- ElizaOS Discord: Join the community for support
- Documentation: [ElizaOS Plugin Documentation](https://eliza.how/docs)

## 🏆 Credits

Created by **LiveTheLifeTV** for the ElizaOS ecosystem.

Part of the Bitcoin-native AI agent movement - channeling the spirit of Satoshi Nakamoto for sovereign living and financial freedom.

---

*"Bitcoin is digital freedom. This plugin brings that ethos to AI agents."* - LiveTheLifeTV
