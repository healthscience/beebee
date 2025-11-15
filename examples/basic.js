import { BeeBee, createBeeBee } from "../src/index.js";

async function main() {
  console.log("BeeBee Basic Example\n");
  
  let beebee;
  
  try {
    // Method 1: Using the factory function (recommended)
    console.log("Initializing BeeBee...");
    beebee = await createBeeBee({
      // You can override any default settings here
      // modelPath: "/path/to/your/model.gguf",
      // temperature: 0.8,
      // maxTokens: 512
    });
    
    console.log("BeeBee initialized successfully!\n");
    
    // Example 1: Simple prompt
    console.log("Example 1: Simple prompt");
    console.log("Prompt: Can you outline the best way to live life?");
    console.log("\nResponse:");
    
    const response1 = await beebee.prompt("Can you outline the best way to live life?");
    console.log(response1);
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Example 2: Custom parameters
    console.log("Example 2: With custom parameters");
    console.log("Prompt: Write a short poem about coding");
    console.log("Parameters: temperature=0.9, maxTokens=100");
    console.log("\nResponse:");
    
    const response2 = await beebee.prompt(
      "Write a short poem about coding",
      {
        temperature: 0.9,
        maxTokens: 100
      }
    );
    console.log(response2);
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Example 3: Technical question
    console.log("Example 3: Technical question");
    console.log("Prompt: Explain what a REST API is in simple terms");
    console.log("\nResponse:");
    
    const response3 = await beebee.prompt(
      "Explain what a REST API is in simple terms",
      {
        temperature: 0.3,  // Lower temperature for more focused response
        maxTokens: 200
      }
    );
    console.log(response3);
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Get model info
    console.log("Model Information:");
    console.log(beebee.getModelInfo());
    
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