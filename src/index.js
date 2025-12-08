import { EventEmitter } from "events";
import { getLlama, LlamaChatSession, LlamaChat } from "node-llama-cpp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { ModelManager } from "./model-manager.js";
import { BeeBeeConfig } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BeeBee extends EventEmitter {
  constructor(config = {}) {
    super();
    // Handle both BeeBeeConfig instances and plain objects
    if (config instanceof BeeBeeConfig) {
      this.config = config.get();
    } else if (config.get && typeof config.get === 'function') {
      this.config = config.get();
    } else {
      // Create a BeeBeeConfig instance with the provided config
      const beebeeConfig = new BeeBeeConfig(config);
      this.config = beebeeConfig.get();
    }
    
    this.llama = null;
    this.model = null;
    this.chatContext = {},
    this.context = {};
    this.session = {};
    this.isInitialized = false;
    
    // Initialize model manager
    this.modelManager = new ModelManager(this.config.modelPath);
    
    // Set up event listeners for model management
    this.setupModelEventListeners();

    // Initialize the instance
    this.initialize();
  }
  
  /**
  * 
  * @method setupModelEventListeners
  *
  */
  setupModelEventListeners() {
    // Listen for model check request from BentoBoxDS
    this.on('model:check', () => {
      const modelInfo = this.modelManager.getModelInfo();
      if (modelInfo.exists) {
        this.emit('model:exists', modelInfo);
      } else {
        this.emit('model:missing', modelInfo);
      }
    });
    
    // Listen for download start from BentoBoxDS
    this.on('model:download:start', async (data) => {
      const source = data?.source || 'hyperdrive';
      const downloadInfo = this.modelManager.getDownloadInfo(source);
      
      // Ensure directory exists
      await this.modelManager.ensureDirectory();
      
      // Emit ready for download
      this.emit('model:download:ready', downloadInfo);
    });
    
    // Listen for download complete from BentoBoxDS
    this.on('model:download:complete', async () => {
      // Re-check model and try to initialize if it exists now
      if (this.modelManager.exists()) {
        try {
          await this.initialize();
        } catch (error) {
          this.emit('error', { 
            type: 'initialization', 
            message: error.message 
          });
        }
      }
    });
  }

  /**
  * 
  * @method initialize
  *
  */
  async initialize() {
    try {
      // Check if model file exists
      if (!this.modelManager.exists()) {
        const modelInfo = this.modelManager.getModelInfo();
        this.emit('model:missing', modelInfo);
        this.emit('error', {
          type: 'model:missing',
          message: `Model file not found at: ${this.config.modelPath}`,
          modelInfo
        });
        return false;
      }
      // Get llama instance
      this.llama = await getLlama();
      // Load the model
      this.model = await this.llama.loadModel({
        modelPath: this.config.modelPath,
        ...this.config.modelOptions
      });
      // Create context
      this.context = await this.model.createContext({
        contextSize: this.config.contextSize,
        threads: this.config.threads
      });
      this.isInitialized = true;
      // Emit ready event
      this.emit('ready');
      return true;
    } catch (error) {
      console.error("Failed to initialize BeeBee:", error);
      // Emit error event
      this.emit('error', error);
      throw error;
    }
  }

  /**
  * 
  * @method startNewChatSession
  *
  */
  startNewChatSession(chatID) {
    // Create chat session
    this.chatContext[chatID] = this.context[chatID].getSequence()
    this.session[chatID] = new LlamaChatSession({
      contextSequence: this.chatContext[chatID],
      ...this.config.sessionOptions
    });
  }

  /**
  * 
  * @method prompt
  *
  */
  async prompt(text, options = {}, bboxID) {
    // is this first prompt of this chat session?
    if (!this.isInitialized) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    const fullPrompt = this.buildPrompt(text, options, bboxID);
    try {
      const response = await this.session[bboxID].prompt(fullPrompt, {
        temperature: options.temperature || this.config.temperature,
        topP: options.topP || this.config.topP,
        maxTokens: options.maxTokens || this.config.maxTokens
      });
      
      // Emit response event
      this.emit('response', response, bboxID);
      
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      // Emit error event
      this.emit('error', error);
      throw error;
    }
  }

  /**
  * 
  * @method promptStream
  *
  */
  async promptStream(text, options = {}, onToken, bboxID) {
    if (!this.isInitialized) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    const fullPrompt = this.buildPrompt(text, options, bboxID);
    try {
      let fullResponse = "";
      
      // Use prompt with onToken callback for streaming
      const response = await this.session[bboxID].prompt(fullPrompt, {
        temperature: options.temperature || this.config.temperature,
        topP: options.topP || this.config.topP,
        maxTokens: options.maxTokens || this.config.maxTokens,
        onToken: (tokens) => {
          // tokens can be an array of token IDs (numbers) or strings
          const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
          
          for (const token of tokenArray) {
            // Convert token to string if it's a number (token ID)
            const tokenStr = typeof token === 'number' ? 
              this.model.detokenize([token]) : 
              String(token);
            
            fullResponse += tokenStr;
            
            // Emit token event
            this.emit('token', tokenStr, bboxID);
            
            if (onToken) {
              onToken(tokenStr, bboxID);
            }
          }
        }
      });
      
      // Emit complete response event
      this.emit('response', fullResponse, bboxID);
      
      return fullResponse;
    } catch (error) {
      console.error("Error generating streaming response:", error);
      // Emit error event
      this.emit('error', error);
      throw error;
    }
  }

  /**
  * 
  * @method buildPrompt
  *
  */
  buildPrompt(text, options, bboxID) {
    let prompt = '';

    if (options.includeSystemPrompt !== false && this.config.systemPrompt) {
      prompt += `${this.config.systemPrompt}\n\n`;
    }

    if (bboxID) {
      prompt += `bboxid: ${bboxID}\n`;
    }

    prompt += `User: ${text}\nAssistant: `;
    return prompt;
  }

  /**
  * 
  * @method complete
  *
  */
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

  /**
  * 
  * @method dispose
  *
  */
  async dispose() {
    if (this.context && typeof this.context.dispose === 'function') {
      await this.context.dispose();
    }
    if (this.model && typeof this.model.dispose === 'function') {
      await this.model.dispose();
    }
    this.isInitialized = false;
  }

  // Utility method to get model info
  /**
  * 
  * @method 
  *
  */
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
  // Initialization is now handled in the constructor
  // Return beebee instance even if model is missing
  // BentoBoxDS can handle the model:missing event
  return beebee;
}