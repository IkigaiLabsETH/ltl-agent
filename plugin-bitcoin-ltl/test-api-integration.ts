#!/usr/bin/env ts-node

/**
 * API Integration Test Runner
 * Run this script to test all free API integrations
 */

import { testAPIIntegration } from "./src/tests/apiIntegrationTest";

async function main() {
  console.log("🚀 Starting Bitcoin Intelligence API Integration Tests");
  console.log("Testing only FREE APIs - no paid API keys required");
  console.log("=" .repeat(70));
  
  try {
    const success = await testAPIIntegration();
    
    if (success) {
      console.log("\n🎉 SUCCESS: All API integrations working correctly!");
      console.log("✅ Free APIs are functioning as expected");
      console.log("✅ Services are properly integrated");
      console.log("✅ Configuration is valid");
      process.exit(0);
    } else {
      console.log("\n❌ FAILURE: Some API integrations failed");
      console.log("Please check the error messages above");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 CRITICAL ERROR:", error);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error); 