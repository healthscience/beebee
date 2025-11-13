#!/usr/bin/env node

import { createBeeBee } from "../src/index.js";

async function main() {
  console.log("🐝 BeeBee Event-Based Example\n");
  
  try {
    // Create BeeBee instance
    const beebee = await createBeeBee({
      temperature: 0.7,
      maxTokens: 512
    });
    
    // Set up event listeners
    beebee.on('ready', () => {
      console.log("✅ BeeBee is ready!");
    });
    
    beebee.on('token', (token) => {
      // Handle each token as it streams
      process.stdout.write(token);
    });
    
    beebee.on('response', (fullResponse) => {
      // Handle complete response
      console.log("\n\n📝 Complete response received");
      console.log(`Length: ${fullResponse.length} characters`);
    });
    
    beebee.on('error', (error) => {
      console.error("\n❌ Error:", error.message);
    });
    
    // Example 1: Non-streaming prompt
    console.log("\n--- Example 1: Non-streaming ---");
    console.log("User: What is BentoBoxDS?");
    console.log("\nAssistant: ");
    
    await beebee.prompt("What is BentoBoxDS?");
    
    // Example 2: Streaming prompt
    console.log("\n\n--- Example 2: Streaming ---");
    console.log("User: Tell me about HealthCues");
    console.log("\nAssistant: ");
    
    await beebee.promptStream("Tell me about HealthCues");
    
    // Example 3: Without system prompt
    console.log("\n\n--- Example 3: Without system prompt ---");
    console.log("User: Hello");
    console.log("\nAssistant: ");
    
    await beebee.promptStream("Hello", { includeSystemPrompt: false });
    
    // Clean up
    await beebee.dispose();
    
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();