#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🟠 Starting Satoshi - Bitcoin AI Agent${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with your API keys."
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

# Check API keys
API_KEY_VALID=false

if [ -n "$OPENAI_API_KEY" ] && [[ "$OPENAI_API_KEY" != *"REPLACE_WITH_YOUR_ACTUAL"* ]] && [[ "$OPENAI_API_KEY" != *"your_"* ]]; then
    echo -e "${GREEN}✅ OpenAI API key detected${NC}"
    API_KEY_VALID=true
elif [ -n "$ANTHROPIC_API_KEY" ] && [[ "$ANTHROPIC_API_KEY" != *"your_"* ]]; then
    echo -e "${GREEN}✅ Anthropic API key detected${NC}"
    API_KEY_VALID=true
else
    echo -e "${YELLOW}⚠️  No valid LLM API key found${NC}"
    echo -e "${YELLOW}   Using local AI fallback (limited functionality)${NC}"
    echo ""
    echo -e "${BLUE}🔑 To enable full functionality:${NC}"
    echo "   1. Get an OpenAI API key: https://platform.openai.com/api-keys"
    echo "   2. Edit .env file: OPENAI_API_KEY=your_actual_key_here"
    echo "   3. Restart the agent"
    echo ""
fi

# Show additional optional features
if [ -n "$COINGECKO_API_KEY" ] && [[ "$COINGECKO_API_KEY" != *"your_"* ]]; then
    echo -e "${GREEN}✅ CoinGecko API key detected (premium Bitcoin data)${NC}"
fi

if [ -n "$DISCORD_API_TOKEN" ]; then
    echo -e "${GREEN}✅ Discord integration enabled${NC}"
fi

if [ -n "$SLACK_BOT_TOKEN" ]; then
    echo -e "${GREEN}✅ Slack integration enabled${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Starting ElizaOS...${NC}"
echo ""

# Start the agent
bun start 