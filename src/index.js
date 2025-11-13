import { getLlama, LlamaChatSession, LlamaChat } from "node-llama-cpp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BeeBee {
  constructor(config = {}) {
    // Handle both BeeBeeConfig instances and plain objects
    if (config.get && typeof config.get === 'function') {
      this.config = config.get();
    } else {
      this.config = {
        modelPath: config.modelPath || "/home/aboynejames/.local/share/nomic.ai/GPT4All/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf",
        contextSize: config.contextSize || 2048,
        threads: config.threads || 4,
        temperature: config.temperature || 0.7,
        topP: config.topP || 0.9,
        maxTokens: config.maxTokens || 256,
        ...config
      };
    }
    
    this.llama = null;
    this.model = null;
    this.context = null;
    this.session = null;
  }

  async initialize() {
    try {
      // Check if model file exists
      if (!existsSync(this.config.modelPath)) {
        throw new Error(`Model file not found at: ${this.config.modelPath}`);
      }

      // Get llama instance
      this.llama = await getLlama();
      
      // Load the model
      this.model = await this.llama.loadModel({
        modelPath: this.config.modelPath
      });
      
      // Create context
      this.context = await this.model.createContext({
        contextSize: this.config.contextSize,
        threads: this.config.threads
      });
      
      // Create chat session
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence()
      });
      
      console.log("BeeBee initialized successfully!");
      return true;
    } catch (error) {
      console.error("Failed to initialize BeeBee:", error);
      throw error;
    }
  }

  async prompt(text, options = {}) {
    if (!this.session) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    const promptOptions = {
      temperature: options.temperature || this.config.temperature,
      topP: options.topP || this.config.topP,
      maxTokens: options.maxTokens || this.config.maxTokens,
      ...options
    };

    try {
      const response = await this.session.prompt(text, {
        temperature: promptOptions.temperature,
        topP: promptOptions.topP,
        maxTokens: promptOptions.maxTokens
      });
      
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  async promptStream(text, options = {}, onToken) {
    if (!this.session) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    const promptOptions = {
      temperature: options.temperature || this.config.temperature,
      topP: options.topP || this.config.topP,
      maxTokens: options.maxTokens || this.config.maxTokens,
      ...options
    };

    try {
      let fullResponse = "";
      
      // Use prompt with onToken callback for streaming
      const response = await this.session.prompt(text, {
        temperature: promptOptions.temperature,
        topP: promptOptions.topP,
        maxTokens: promptOptions.maxTokens,
        onToken: (tokens) => {
          // tokens can be an array of token IDs (numbers) or strings
          const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
          
          for (const token of tokenArray) {
            // Convert token to string if it's a number (token ID)
            const tokenStr = typeof token === 'number' ? 
              this.model.detokenize([token]) : 
              String(token);
            
            fullResponse += tokenStr;
            if (onToken) {
              onToken(tokenStr);
            }
          }
        }
      });
      
      return fullResponse;
    } catch (error) {
      console.error("Error generating streaming response:", error);
      throw error;
    }
  }

  async complete(prompt, options = {}) {
    if (!this.context) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    const completionOptions = {
      temperature: options.temperature || this.config.temperature,
      topP: options.topP || this.config.topP,
      maxTokens: options.maxTokens || this.config.maxTokens,
      ...options
    };

    try {
      const sequence = this.context.getSequence();
      
      // Tokenize the prompt
      const tokens = this.model.tokenize(prompt);
      
      // Insert tokens into sequence
      sequence.insertTokens(tokens);
      
      // Generate completion
      const completionTokens = await sequence.evaluate({
        temperature: completionOptions.temperature,
        topP: completionOptions.topP,
        maxTokens: completionOptions.maxTokens
      });
      
      // Decode tokens to text
      const completion = this.model.detokenize(completionTokens);
      
      return completion;
    } catch (error) {
      console.error("Error generating completion:", error);
      throw error;
    }
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose();
    }
    if (this.model) {
      await this.model.dispose();
    }
    console.log("BeeBee disposed successfully");
  }

  // Utility method to get model info
  getModelInfo() {
    if (!this.model) {
      return null;
    }
    
    return {
      modelPath: this.config.modelPath,
      contextSize: this.config.contextSize,
      threads: this.config.threads
    };
  }
}

// Export a factory function for convenience
export async function createBeeBee(config = {}) {
  const beebee = new BeeBee(config);
  await beebee.initialize();
  return beebee;
}