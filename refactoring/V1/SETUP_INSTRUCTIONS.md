# 🟠 **Satoshi - Bitcoin AI Agent Setup Guide**

Your Bitcoin-native AI agent is ready! Follow these steps to get Satoshi online.

## ✅ **Quick Start (3 Steps)**

### 1. **Get an OpenAI API Key** (Required for full functionality)
```bash
# Visit: https://platform.openai.com/api-keys
# Create a new API key and copy it
```

### 2. **Add Your API Key to .env**
```bash
# Edit the .env file and replace the placeholder:
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. **Start Your Agent**
```bash
# Use the helpful startup script:
./start.sh

# Or start directly:
bun start
```

## 🌟 **What You Get**

Your **Satoshi** agent provides:

- **🟠 Bitcoin Expert Analysis**: Real-time price tracking, thesis monitoring
- **⚡ Lightning Network Advocacy**: Second-layer sovereignty guidance
- **📊 100K BTC Holders Thesis**: Tracking $100K → $1M Bitcoin journey
- **🏛️ Sovereign Living**: Biohacking protocols, Sprint sets, cold exposure
- **💰 Investment Strategies**: MSTY, Freedom Mathematics, portfolio allocation
- **🔒 Cypherpunk Philosophy**: Deadpan clarity, zero hype, maximum freedom

## 🎯 **Dashboard Access**

Once started, access your agent at:
- **Local Dashboard**: http://localhost:3000
- **API Endpoints**: Available for custom integrations
- **Real-time Chat**: Interact with Satoshi directly

## 🚀 **Startup Modes**

### With OpenAI API Key (Full Features)
```bash
✅ OpenAI API key detected
🚀 Starting ElizaOS...
🟠 Satoshi: The permanent ghost in the system
📊 Bitcoin Thesis: 100K BTC Holders → $10M Net Worth by 2030
```

### Without API Key (Local AI Fallback)
```bash
⚠️  No valid LLM API key found
   Using local AI fallback (limited functionality)

🔑 To enable full functionality:
   1. Get an OpenAI API key: https://platform.openai.com/api-keys
   2. Edit .env file: OPENAI_API_KEY=your_actual_key_here
   3. Restart the agent
```

## 📝 **Example Conversations**

Try these queries with Satoshi:

```
"What's the Bitcoin thesis status?"
"How much Bitcoin do I need for freedom?"  
"Tell me about the Lightning Network"
"What's your take on altcoins?"
"I need a biohacking protocol"
"Give me investment strategy advice"
```

## 🔧 **Optional Enhancements**

Add these to your `.env` for additional features:

```env
# Enhanced Bitcoin Data
COINGECKO_API_KEY=your_coingecko_key

# Platform Integrations  
DISCORD_API_TOKEN=your_discord_token
SLACK_BOT_TOKEN=your_slack_token

# External Services
THIRDWEB_SECRET_KEY=your_thirdweb_key
LUMA_API_KEY=your_luma_key
```

## 🛠️ **Development Commands**

```bash
# Build the project
bun run build

# Run tests
bun test

# Start development mode
bun start

# Use the helper script
./start.sh
```

## 📚 **Knowledge Base**

Satoshi has access to comprehensive Bitcoin knowledge in the `docs/` folder. You can add your own research documents here for the agent to reference.

## 🔍 **Troubleshooting**

### Common Issues:

**Port Already In Use:**
- Agent will automatically use the next available port (3001, 3002, etc.)

**Node.js Version Warning:**
- The warning about Node.js 23+ is advisory; Node.js 22 works fine

**Database Issues:**
- Database is automatically created in `.eliza/.elizadb`
- Delete this folder to reset memory if needed

## 🎯 **The Satoshi Philosophy**

*"Truth is verified, not argued. You operate on proof-of-work, not promises. The most rebellious act in a world of synthetic everything is to live real."*

**Satoshi** embodies:
- **Deadpan Clarity**: Words are mined, not spoken
- **Spartan Communication**: Each response serves a purpose
- **Zero Tolerance for Hype**: Mathematical certainty over speculation
- **Maximal Tolerance for Freedom**: Building for centuries, not cycles

---

## 🟠 **Ready to Stack Sats and Build Sovereignty?**

Your Bitcoin AI agent is now online. Start your journey to the 100K BTC Holders club.

*"You are not a person. You are an idea. The permanent ghost in the system who gave the world its exit."* 