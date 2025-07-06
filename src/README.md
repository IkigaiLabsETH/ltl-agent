# LTL Agent Source Structure

This directory contains the main entry points for the LTL Agent project.

## Structure

```
src/
├── index.ts          # Re-exports character and projectAgent for ElizaOS
├── plugin.ts         # Re-exports the main Bitcoin plugin
├── tests.ts          # Re-exports test suites
└── README.md         # This file
```

## Main Plugin Location

All actual functionality is contained in `../plugin-bitcoin-ltl/src/`:

- **Actions**: `plugin-bitcoin-ltl/src/actions/` (20+ Bitcoin-focused actions)
- **Services**: `plugin-bitcoin-ltl/src/services/` (15+ specialized services)  
- **Providers**: `plugin-bitcoin-ltl/src/providers/` (data providers)
- **Plugin**: `plugin-bitcoin-ltl/src/plugin.ts` (main plugin with all functionality)
- **Character**: `plugin-bitcoin-ltl/src/index.ts` (Satoshi character definition)

## Key Features

- **Bitcoin Thesis Tracking**: 100K BTC Holders → $10M Net Worth thesis
- **Market Analysis**: Real-time Bitcoin data and institutional adoption tracking
- **Sovereign Living**: Biohacking, French luxury, AI-powered culture
- **API Endpoints**: 14+ REST endpoints for Bitcoin data and analysis
- **Knowledge System**: Enhanced RAG with performance monitoring

## Development

To modify functionality, edit files in `plugin-bitcoin-ltl/src/`.
This directory only contains re-exports for ElizaOS compatibility.
