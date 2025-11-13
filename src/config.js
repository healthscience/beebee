import { homedir } from "os";
import { join } from "path";

// Default configuration for BeeBee
export const defaultConfig = {
  // Model settings
  modelPath: "/home/aboynejames/.local/share/nomic.ai/GPT4All/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf",
  contextSize: 2048,
  threads: 4,
  
  // Generation settings
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 256,
  
  // Other settings
  verbose: false
};

// Helper function to resolve model path
export function resolveModelPath(modelPath) {
  // If path starts with ~, replace with home directory
  if (modelPath.startsWith("~")) {
    return join(homedir(), modelPath.slice(1));
  }
  return modelPath;
}

// Configuration builder
export class BeeBeeConfig {
  constructor(userConfig = {}) {
    this.config = { ...defaultConfig, ...userConfig };
    
    // Resolve model path
    this.config.modelPath = resolveModelPath(this.config.modelPath);
  }
  
  get() {
    return this.config;
  }
  
  set(key, value) {
    this.config[key] = value;
    return this;
  }
  
  update(updates) {
    this.config = { ...this.config, ...updates };
    return this;
  }
  
  // Validation method
  validate() {
    const errors = [];
    
    if (!this.config.modelPath) {
      errors.push("Model path is required");
    }
    
    if (this.config.contextSize < 128) {
      errors.push("Context size must be at least 128");
    }
    
    if (this.config.threads < 1) {
      errors.push("Threads must be at least 1");
    }
    
    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push("Temperature must be between 0 and 2");
    }
    
    if (this.config.topP < 0 || this.config.topP > 1) {
      errors.push("TopP must be between 0 and 1");
    }
    
    if (this.config.maxTokens < 1) {
      errors.push("MaxTokens must be at least 1");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}