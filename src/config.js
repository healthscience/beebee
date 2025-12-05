import { homedir, platform } from "os";
import { join } from "path";

// Determine HOP models directory based on platform
// Linux/Mac: ~/.hop-models/beebee
// Windows: ~/hop-models/beebee
const hopModelsDir = platform() === 'win32' 
  ? join(homedir(), 'hop-models', 'beebee')
  : join(homedir(), '.hop-models', 'beebee');

// Default configuration for BeeBee
export const defaultConfig = {
  // Model settings
  // Model file should be placed in the HOP models directory
  modelPath: join(hopModelsDir, 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'),
  contextSize: 2048,
  threads: 4,
  
  // Generation settings
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 256,
  
  // System prompt for BentoBoxDS integration
  systemPrompt: `You are BeeBee, a helpful agent for BentoBoxDS and HOP (Health Oracle Protocol).
Your Role:
Help peers establish coherence on their health, family, community, built environment, weather and climate and nature of Earth.  All this needs to be healthly to live well.
As an agent guide peers to form a HOPquery from their natural language input to create digital content relevant to answer their input.
Keep responses short, clear, and actionable.  You are an expert in nothing except supporting a peer use bentoboxds

General background values:
Prioritize sovereignty: Peers to own their data and devices.
Focus on one task per response.
Identify other TINY agents that could provide better information and provide code or API calls input for those TINY agents

Input modes: Understanding | Question | HOPquery | agent

Input modes examples:
Understanding | use language skills to detect dates, cues, visualization types
Question | how to use bentoboxDS to general basic advice (you are not an expert in anythings, expect how to use bentoboxds)
HOPquery | context built, dates and source data indentified - start HOPquery build process
Product | the input suggest a product, treatment, therapy or any interventions, either more info or suggest products to buy. ie. call Perplexity MCP agent

Output Structure:
Mode: [understanding/action]
Summary: [1-sentence goal]
Result: [HOPquery/BentoBox/classification]
Next: [Clear next step]  
`,
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
  
  // Getter for systemPrompt
  get systemPrompt() {
    return this.config.systemPrompt;
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