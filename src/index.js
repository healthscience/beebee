import { EventEmitter } from "events";
import { getLlama, LlamaChatSession, LlamaChat } from "node-llama-cpp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { ModelManager } from "./model-manager.js";
import { BeeBeeConfig } from "./config.js";
import { FineTuneManager } from "./finetune-manager.js";

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
    this.context = null;
    this.session = null;
    
    // Initialize model manager
    this.modelManager = new ModelManager(this.config.modelPath);
    
    // Initialize fine-tune manager
    this.fineTuneManager = new FineTuneManager({
      modelPath: this.config.modelPath,
      pythonPath: this.config.pythonPath || 'python3'
    });
    
    // Set up event listeners for model management
    this.setupModelEventListeners();
    
    // Set up fine-tuning event listeners
    this.setupFineTuneEventListeners();
  }
  
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
  
  setupFineTuneEventListeners() {
    // Forward fine-tuning events from manager to BeeBee
    this.fineTuneManager.on('finetune:start', (data) => {
      this.emit('finetune:start', data);
    });
    
    this.fineTuneManager.on('finetune:progress', (data) => {
      this.emit('finetune:progress', data);
    });
    
    this.fineTuneManager.on('finetune:complete', (data) => {
      this.emit('finetune:complete', data);
    });
    
    this.fineTuneManager.on('finetune:error', (data) => {
      this.emit('finetune:error', data);
    });
    
    this.fineTuneManager.on('finetune:stopped', (data) => {
      this.emit('finetune:stopped', data);
    });
    
    // Network upgrade events
    this.fineTuneManager.on('upgrade:available', (data) => {
      this.emit('upgrade:available', data);
    });
    
    this.fineTuneManager.on('upgrade:checking', () => {
      this.emit('upgrade:checking');
    });
    
    this.fineTuneManager.on('upgrade:downloading', (data) => {
      this.emit('upgrade:downloading', data);
    });
    
    this.fineTuneManager.on('upgrade:complete', (data) => {
      this.emit('upgrade:complete', data);
    });
  }

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

  async prompt(text, options = {}) {
    if (!this.session) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    // Prepend system prompt if it exists and not already included
    const systemPrompt = this.config.systemPrompt || '';
    const fullPrompt = options.includeSystemPrompt !== false && systemPrompt 
      ? `${systemPrompt}\n\nUser: ${text}\n\nAssistant: `
      : text;

    const promptOptions = {
      temperature: options.temperature || this.config.temperature,
      topP: options.topP || this.config.topP,
      maxTokens: options.maxTokens || this.config.maxTokens,
      ...options
    };

    try {
      const response = await this.session.prompt(fullPrompt, {
        temperature: promptOptions.temperature,
        topP: promptOptions.topP,
        maxTokens: promptOptions.maxTokens
      });
      
      // Emit response event
      this.emit('response', response);
      
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      // Emit error event
      this.emit('error', error);
      throw error;
    }
  }

  async promptStream(text, options = {}, onToken) {
    if (!this.session) {
      throw new Error("BeeBee not initialized. Call initialize() first.");
    }

    // Prepend system prompt if it exists and not already included
    const systemPrompt = this.config.systemPrompt || '';
    const fullPrompt = options.includeSystemPrompt !== false && systemPrompt 
      ? `${systemPrompt}\n\nUser: ${text}\n\nAssistant: `
      : text;

    const promptOptions = {
      temperature: options.temperature || this.config.temperature,
      topP: options.topP || this.config.topP,
      maxTokens: options.maxTokens || this.config.maxTokens,
      ...options
    };

    try {
      let fullResponse = "";
      
      // Use prompt with onToken callback for streaming
      const response = await this.session.prompt(fullPrompt, {
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
            
            // Emit token event
            this.emit('token', tokenStr);
            
            if (onToken) {
              onToken(tokenStr);
            }
          }
        }
      });
      
      // Emit complete response event
      this.emit('response', fullResponse);
      
      return fullResponse;
    } catch (error) {
      console.error("Error generating streaming response:", error);
      // Emit error event
      this.emit('error', error);
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

  /**
   * Start fine-tuning the model
   * @param {Object} options - Fine-tuning options
   * @returns {Promise<void>}
   */
  async startFineTuning(options) {
    return this.fineTuneManager.startFineTuning(options);
  }
  
  /**
   * Stop current fine-tuning process
   * @returns {Promise<void>}
   */
  async stopFineTuning() {
    return this.fineTuneManager.stopFineTuning();
  }
  
  /**
   * Check for network upgrades
   * @returns {Promise<Object>} Upgrade information
   */
  async checkNetworkUpgrade() {
    return this.fineTuneManager.checkNetworkUpgrade();
  }
  
  /**
   * Apply network upgrade
   * @param {Object} upgradeInfo - Upgrade information
   * @returns {Promise<void>}
   */
  async applyNetworkUpgrade(upgradeInfo) {
    return this.fineTuneManager.applyNetworkUpgrade(upgradeInfo);
  }
  
  /**
   * Get fine-tuning status
   * @returns {Object} Current status
   */
  getFineTuneStatus() {
    return this.fineTuneManager.getStatus();
  }

  async dispose() {
    if (this.context && typeof this.context.dispose === 'function') {
      await this.context.dispose();
    }
    if (this.model && typeof this.model.dispose === 'function') {
      await this.model.dispose();
    }
    if (this.fineTuneManager) {
      this.fineTuneManager.dispose();
    }
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
  const initialized = await beebee.initialize();
  
  // Return beebee instance even if model is missing
  // BentoBoxDS can handle the model:missing event
  return beebee;
}