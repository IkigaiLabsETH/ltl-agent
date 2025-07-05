#!/usr/bin/env node

/**
 * Knowledge Reorganization Script
 * Categorizes and moves knowledge files into the new plugin structure
 */

import fs from 'fs/promises';
import path from 'path';

const KNOWLEDGE_DIR = './knowledge';
const DRY_RUN = process.argv.includes('--dry-run');

// File categorization rules based on filename patterns
const CATEGORIES = {
  'shared/bitcoin': [
    'bitcoin-', 'btc-', 'microstrategy', 'mara-', 'metaplanet-', 
    'altbg-', 'bitaxe-', 'satoshi-', 'lightning-'
  ],
  'shared/lifestyle': [
    'luxury-', 'basque-', 'bordeaux-', 'costa-rica-', 'dubai-', 
    'italy-', 'monaco-', 'portugal-', 'spain-', 'switzerland-',
    'thermomix-', 'big-green-egg-', 'hill-hx50-', 'cirrus-vision-',
    'hybrid-catamarans-', 'premium-', 'sovereign-'
  ],
  'shared/markets': [
    'altcoins-', 'crypto-', 'ethereum-', 'solana-', 'sui-', 
    'hyperliquid-', 'pump-fun-', 'vaneck-', 'etf-', 'msty-',
    'innovation-stocks-', 'early-stage-', 'tesla-', 'nuclear-',
    'dogecoin-', 'moonpig-', 'sharplink-'
  ],
  'shared/technology': [
    'ai-', 'robotaxi-', 'otonomos-', 'technology-'
  ],
  'ltl-agent/strategies': [
    'wealth-building-', 'financial-', 'cost-of-living-',
    'debt-taxation-', 'generational-wealth-', 'gold-vs-bitcoin-',
    '1k-grind-challenge-', 'energy-independence-'
  ],
  'ltl-agent/travel': [
    'livethelife-', 'forest-land-investment-', 'premium-camper-vans-',
    'world-class-wine-', 'luxury-wine-', 'luxury-outdoor-'
  ],
  'ltl-agent/insights': [
    'ltl-', 'million-dollar-mobius-', 'communication-philosophy-',
    'vibe-coding-', 'sustainable-fitness-', 'premium-smart-home-',
    'european-pension-', 'digital-art-nft-'
  ]
};

async function categorizeFile(filename) {
  for (const [category, patterns] of Object.entries(CATEGORIES)) {
    for (const pattern of patterns) {
      if (filename.startsWith(pattern)) {
        return category;
      }
    }
  }
  
  // Default fallback - analyze content for better categorization
  return 'ltl-agent/insights'; // Default to insights
}

async function moveFile(source, destination) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would move: ${source} → ${destination}`);
    return;
  }
  
  try {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rename(source, destination);
    console.log(`✅ Moved: ${path.basename(source)} → ${destination}`);
  } catch (error) {
    console.error(`❌ Error moving ${source}: ${error.message}`);
  }
}

async function reorganizeKnowledge() {
  console.log('🚀 Starting knowledge reorganization...');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be moved');
  }
  
  try {
    const files = await fs.readdir(KNOWLEDGE_DIR);
    const markdownFiles = files.filter(file => 
      file.endsWith('.md') && !file.startsWith('.') 
    );
    
    console.log(`📚 Found ${markdownFiles.length} knowledge files`);
    
    const moves = [];
    
    for (const file of markdownFiles) {
      const category = await categorizeFile(file);
      const source = path.join(KNOWLEDGE_DIR, file);
      const destination = path.join(KNOWLEDGE_DIR, category, file);
      
      moves.push({ source, destination, category, file });
    }
    
    // Group by category for reporting
    const byCategory = {};
    moves.forEach(move => {
      if (!byCategory[move.category]) byCategory[move.category] = [];
      byCategory[move.category].push(move.file);
    });
    
    console.log('\n📋 Categorization Summary:');
    for (const [category, files] of Object.entries(byCategory)) {
      console.log(`  ${category}: ${files.length} files`);
      if (DRY_RUN) {
        files.forEach(file => console.log(`    - ${file}`));
      }
    }
    
    // Execute moves
    console.log('\n🔄 Moving files...');
    for (const move of moves) {
      await moveFile(move.source, move.destination);
    }
    
    console.log('\n✅ Knowledge reorganization complete!');
    console.log('\n📁 New structure:');
    console.log('knowledge/');
    console.log('├── shared/');
    console.log('│   ├── bitcoin/      # Bitcoin-specific knowledge');
    console.log('│   ├── lifestyle/    # Luxury lifestyle content'); 
    console.log('│   ├── markets/      # Market analysis');
    console.log('│   └── technology/   # Tech and AI content');
    console.log('└── ltl-agent/');
    console.log('    ├── strategies/   # Investment strategies');
    console.log('    ├── travel/       # Travel and lifestyle');
    console.log('    └── insights/     # Custom insights');
    
  } catch (error) {
    console.error('❌ Error during reorganization:', error.message);
    process.exit(1);
  }
}

// Run the script
reorganizeKnowledge(); 