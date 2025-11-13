import { createBeeBee } from "../src/index.js";

// Example of how to integrate BeeBee into another application
class ChatBot {
  constructor() {
    this.beebee = null;
    this.conversationHistory = [];
  }
  
  async initialize() {
    this.beebee = await createBeeBee({
      temperature: 0.7,
      maxTokens: 200
    });
    console.log("ChatBot initialized with BeeBee");
  }
  
  async chat(userMessage) {
    if (!this.beebee) {
      throw new Error("ChatBot not initialized");
    }
    
    // Add user message to history
    this.conversationHistory.push({ role: "user", content: userMessage });
    
    // Generate response
    const response = await this.beebee.prompt(userMessage);
    
    // Add assistant response to history
    this.conversationHistory.push({ role: "assistant", content: response });
    
    return response;
  }
  
  async dispose() {
    if (this.beebee) {
      await this.beebee.dispose();
    }
  }
}

// Example usage
async function main() {
  console.log("BeeBee Integration Example - Simple ChatBot\n");
  
  const chatbot = new ChatBot();
  
  try {
    await chatbot.initialize();
    
    // Simulate a conversation
    const conversations = [
      "Hello! What's your name?",
      "Can you help me understand what Node.js is?",
      "What are some best practices for Node.js development?",
      "Thank you for the help!"
    ];
    
    for (const message of conversations) {
      console.log(`User: ${message}`);
      const response = await chatbot.chat(message);
      console.log(`Bot: ${response}\n`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await chatbot.dispose();
  }
}

// Another example: Code Assistant
class CodeAssistant {
  constructor() {
    this.beebee = null;
  }
  
  async initialize() {
    this.beebee = await createBeeBee({
      temperature: 0.3,  // Lower temperature for more focused code generation
      maxTokens: 500
    });
  }
  
  async explainCode(code) {
    const prompt = `Please explain this code:\n\n${code}\n\nExplanation:`;
    return await this.beebee.prompt(prompt);
  }
  
  async suggestImprovements(code) {
    const prompt = `Suggest improvements for this code:\n\n${code}\n\nImprovements:`;
    return await this.beebee.prompt(prompt);
  }
  
  async generateFunction(description) {
    const prompt = `Generate a JavaScript function that ${description}:\n\n\`\`\`javascript`;
    return await this.beebee.prompt(prompt);
  }
  
  async dispose() {
    if (this.beebee) {
      await this.beebee.dispose();
    }
  }
}

// Run the chatbot example
main().catch(console.error);