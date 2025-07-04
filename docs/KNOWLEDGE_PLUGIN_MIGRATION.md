# Knowledge System Configuration Guide

## Hybrid Knowledge Approach

Satoshi uses a hybrid knowledge system that combines the reliability of ElizaOS's core knowledge system with the advanced capabilities of the external knowledge plugin as an optional enhancement.

### Default: Core ElizaOS Knowledge System
- **Always active** - Uses the built-in `@elizaos/plugin-knowledge`
- **Reliable and stable** - Integrated with core ElizaOS architecture
- **All 84 knowledge files** included via `knowledge` array in character configuration
- **No additional dependencies** - Works out of the box

### Optional: Advanced External Knowledge Plugin
- **Opt-in enhancement** - Enable with `USE_ADVANCED_KNOWLEDGE=true`
- **Enhanced RAG capabilities** - Contextual embeddings and advanced search
- **Web interface** - Document management via browser
- **90% cost savings** - Through intelligent caching

## Key Improvements

### 🚀 Enhanced Capabilities
- **Advanced RAG with contextual embeddings** - Better understanding of complex documents
- **Automatic document loading** - Processes all files from `/knowledge` directory on startup
- **Web interface** - Manage documents via browser at `http://localhost:3000/api/agents/[agent-id]/plugins/knowledge/display`
- **Multiple file type support** - PDFs, DOCs, TXT, MD, and many more
- **90% cost reduction** - Document caching reduces repeated processing costs
- **Better search accuracy** - More relevant results with contextual understanding

### 📊 Performance Features
- **Parallel processing** - Up to 30 concurrent requests
- **Rate limiting** - 60 requests per minute, 150K tokens per minute
- **Optimized chunking** - 4000 token input limit, 4096 token output limit
- **Smart caching** - Reduces redundant embedding generation

## Configuration

### Default Configuration (No Setup Required)
The core ElizaOS knowledge system works automatically with all 84 knowledge files included. No environment variables or additional setup needed.

### Optional: Enable Advanced Knowledge Plugin

To enable the advanced external knowledge plugin, add to your `.env` file:

```bash
# Enable advanced knowledge plugin
USE_ADVANCED_KNOWLEDGE=true

# Optional: Advanced plugin configuration
LOAD_DOCS_ON_STARTUP=true               # Auto-load all knowledge files
KNOWLEDGE_PATH=./knowledge               # Path to knowledge directory
CTX_KNOWLEDGE_ENABLED=true              # Enable contextual embeddings
MAX_CONCURRENT_REQUESTS=30              # Parallel processing limit
REQUESTS_PER_MINUTE=60                  # Rate limiting
TOKENS_PER_MINUTE=150000                # Token rate limiting
MAX_INPUT_TOKENS=4000                   # Chunk size limit
MAX_OUTPUT_TOKENS=4096                  # Response size limit
```

### Performance Optimization (Optional)

For best results with the advanced plugin, add these to your `.env` file:

```bash
# Use OpenRouter with Claude for best results + 90% cost savings
TEXT_PROVIDER=openrouter
TEXT_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Knowledge Base Structure

All 84 knowledge files are automatically processed from the `/knowledge` directory:

- **Core Bitcoin** - Philosophy, technical foundation, personalities
- **Market Analysis** - Cycles, thesis tracking, microcap strategies
- **Mining & Infrastructure** - Operations, hardware, energy solutions
- **Treasury Strategy** - Corporate adoption, MicroStrategy, MetaPlanet
- **Lightning & DeFi** - Second layer solutions, lending protocols
- **Investment Strategy** - Financial instruments, wealth building
- **Altcoin Analysis** - Blockchain comparisons, risk assessment
- **Sovereign Living** - Biohacking, fitness, lifestyle optimization
- **Luxury & Travel** - Geographic arbitrage, premium experiences
- **Technology & AI** - Development workflows, infrastructure
- **Philosophy & Culture** - Communication, art, long-term thinking

## Usage

### Automatic Processing
The plugin automatically:
1. Loads all files from `/knowledge` on startup
2. Generates contextual embeddings for better understanding
3. Indexes content for semantic search
4. Provides web interface for management

### Agent Capabilities
Satoshi automatically gains these enhanced abilities:
- **PROCESS_KNOWLEDGE** - "Remember this document: [content]"
- **SEARCH_KNOWLEDGE** - "Search your knowledge for [topic]"
- **Advanced RAG** - Contextual understanding of complex topics

### Web Interface
Access the knowledge management interface at:
```
http://localhost:3000/api/agents/[your-agent-id]/plugins/knowledge/display
```

## Benefits of Hybrid Approach

### Core System Benefits (Always Active)
1. **Reliable Foundation** - Built-in ElizaOS knowledge system with proven stability
2. **Comprehensive Coverage** - All 84 knowledge files loaded and accessible
3. **Zero Configuration** - Works out of the box with no setup required
4. **Consistent Performance** - Predictable behavior integrated with core runtime

### Advanced Plugin Benefits (Optional)
1. **Enhanced RAG** - Contextual embeddings for better document understanding
2. **Cost Efficiency** - 90% reduction in embedding costs through intelligent caching
3. **Web Interface** - Visual document management and search capabilities
4. **Performance Optimization** - Parallel processing and advanced search algorithms
5. **Scalability** - Better handling of large knowledge bases

## Implementation Notes

- **Hybrid Architecture** - Core knowledge system for reliability, advanced plugin for enhancement
- **Backward Compatibility** - All existing knowledge files work with both systems
- **Optional Dependency** - Advanced plugin only loaded when explicitly enabled
- **Fail-Safe Design** - If advanced plugin fails, core system continues to work

## Troubleshooting

### Core Knowledge System Issues
1. **Knowledge not accessible**: Verify all files exist in `/knowledge` directory
2. **Path issues**: Ensure knowledge file paths are correct in character configuration
3. **Embeddings not working**: Check OpenAI API key is valid and has embeddings access

### Advanced Plugin Issues (if enabled)
1. **Plugin not loading**: Verify `USE_ADVANCED_KNOWLEDGE=true` in environment
2. **Advanced search not working**: Check that external plugin is properly installed
3. **Memory issues**: Reduce `MAX_CONCURRENT_REQUESTS` to 10-15
4. **Performance**: Enable contextual mode with OpenRouter for better results

### General Tips
- **Start with core system** - Works reliably without any additional setup
- **Enable advanced features gradually** - Add `USE_ADVANCED_KNOWLEDGE=true` when needed
- **Monitor performance** - Advanced plugin uses more resources but provides better results
- **Check logs** - Both systems provide detailed logging for troubleshooting

The hybrid approach ensures you always have a working knowledge system while optionally benefiting from advanced capabilities when needed. 