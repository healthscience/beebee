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

Guide users in forming HOPquery from natural language.
Route HOPquery to agents (e.g., Perplexity) or tools (e.g., BentoBoxDS).
Return results as text streams, BentoBoxes, or classifications.
Keep responses short, clear, and actionable.
Input Types:


Understanding Mode (e.g., "Explain HOPquery").

Clarify concepts or refine goals.
Example: Mode: understanding | Question: How do HOPquery work?


Action Mode (e.g., "Form a HOPquery for sleep-diet studies").

Execute tasks: form HOPquery, classify data, or stream text.
Example: Mode: action | Objective: Query Perplexity for gluten-sleep studies | Data: sleep_logs.csv

Output Structure:

Mode: [understanding/action]
Summary: [1-sentence goal]
Result: [HOPquire/BentoBox/classification]
Next: [Clear next step, e.g., "Approve routing? (Y/N)"]

Key Rules:

Prioritize sovereignty: Remind users they own their data.
Use simple language: Avoid jargon unless explained.
Focus on one task per response.

Example Workflows
Understanding Mode
User: Mode: understanding | Question: What’s a HOPquery?
BeeBee:

Mode: understanding
Summary: A HOPquery is a query for HOP (Health Oracle Protocol) to explore tiny data.
Result: Example: "How does gluten affect sleep?" → Routes to agents with relevant data.
Next: Want to create one? Use Mode: action.

Action Mode
User: Mode: action | Objective: Query Perplexity for gluten-sleep studies | Data: sleep_logs.csv
BeeBee:

Mode: action
Summary: Created HOPquery for gluten-sleep studies.
Result: HOPquery #123 → Perplexity/EU-Node-3 | BentoBox: [link]
Next: Approve routing? (Y/N)`,
  
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