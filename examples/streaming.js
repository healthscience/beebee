import { createBeeBee } from "../src/index.js";
import { stdout } from "process";

async function main() {
  console.log("BeeBee Streaming Example\n");
  
  let beebee;
  
  try {
    // Initialize BeeBee
    console.log("Initializing BeeBee...");
    beebee = await createBeeBee();
    console.log("BeeBee initialized successfully!\n");
    
    // Example 1: Streaming with callback
    console.log("Example 1: Streaming response");
    console.log("Prompt: Tell me a story about a robot learning to paint");
    console.log("\nStreaming response:\n");
    
    const response1 = await beebee.promptStream(
      "How to cure aging?",
      {
        maxTokens: 300,
        temperature: 0.8
      },
      (token) => {
        // Print each token as it arrives
        stdout.write(token);
      }
    );
    
    console.log("\n\n" + "=".repeat(50) + "\n");
    
    // Example 2: Collecting streamed tokens
    console.log("Example 2: Collecting streamed tokens");
    console.log("Prompt: What are the key principles of good software design?");
    console.log("\nStreaming response with progress:\n");
    
    let tokenCount = 0;
    const tokens = [];
    
    const response2 = await beebee.promptStream(
      "What are the key principles of good software design?",
      {
        maxTokens: 250,
        temperature: 0.5
      },
      (token) => {
        tokens.push(token);
        tokenCount++;
        
        // Show progress every 10 tokens
        if (tokenCount % 10 === 0) {
          stdout.write(`[${tokenCount} tokens] `);
        }
        
        stdout.write(token);
      }
    );
    
    console.log(`\n\nTotal tokens generated: ${tokenCount}`);
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Example 3: Interactive-style streaming
    console.log("Example 3: Interactive conversation");
    
    const prompts = [
      "Hello! How are you today?",
      "What's your favorite topic to discuss?",
      "Can you tell me something interesting about that topic?"
    ];
    
    for (const prompt of prompts) {
      console.log(`User: ${prompt}`);
      stdout.write("BeeBee: ");
      
      await beebee.promptStream(
        prompt,
        {
          maxTokens: 100,
          temperature: 0.7
        },
        (token) => {
          stdout.write(token);
        }
      );
      
      console.log("\n");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    // Always dispose of resources
    if (beebee) {
      await beebee.dispose();
    }
  }
}

// Run the example
main().catch(console.error);