#!/usr/bin/env node

/**
 * Example showing how beebee-ai package can integrate with BeeBee
 * using the event-based API for BentoBoxDS communication
 */

import { createBeeBee } from "../src/index.js";

// This would be inside the beebee-ai package
class BeeBeeAI {
  constructor() {
    this.beebee = null;
    this.websocketClients = new Set(); // BentoBoxDS connections
  }
  
  async initialize() {
    // Create BeeBee instance with BentoBoxDS system prompt
    this.beebee = await createBeeBee({
      temperature: 0.7,
      maxTokens: 512
    });
    
    // Set up event listeners
    this.beebee.on('ready', () => {
      console.log('✅ BeeBee LLM ready');
      this.broadcastToClients({ type: 'llm_ready' });
    });
    
    this.beebee.on('token', (token) => {
      // Stream tokens to BentoBoxDS clients
      this.broadcastToClients({
        type: 'token',
        data: token
      });
    });
    
    this.beebee.on('response', (fullResponse) => {
      // Send complete response
      this.broadcastToClients({
        type: 'response_complete',
        data: fullResponse
      });
    });
    
    this.beebee.on('error', (error) => {
      console.error('❌ BeeBee error:', error);
      this.broadcastToClients({
        type: 'error',
        error: error.message
      });
    });
  }
  
  // Called when receiving message from BentoBoxDS
  async handleBentoBoxMessage(message) {
    const { type, prompt, options = {} } = message;
    
    switch (type) {
      case 'prompt':
        // Non-streaming prompt
        await this.beebee.prompt(prompt, options);
        break;
        
      case 'prompt_stream':
        // Streaming prompt
        await this.beebee.promptStream(prompt, options);
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  }
  
  // Simulate broadcasting to websocket clients
  broadcastToClients(message) {
    console.log('📡 Broadcasting to BentoBoxDS:', message);
    // In real implementation, this would send via websocket
    // this.websocketClients.forEach(client => {
    //   client.send(JSON.stringify(message));
    // });
  }
  
  async dispose() {
    if (this.beebee) {
      await this.beebee.dispose();
    }
  }
}

// Example usage
async function main() {
  console.log("🐝 BeeBee-AI Integration Example\n");
  
  const beebeeAI = new BeeBeeAI();
  await beebeeAI.initialize();
  
  // Simulate receiving messages from BentoBoxDS
  console.log("\n--- Simulating BentoBoxDS prompt ---");
  await beebeeAI.handleBentoBoxMessage({
    type: 'prompt',
    prompt: 'What is BentoBoxDS and HOP in less than 100 words?'
  });
  
  console.log("\n--- Simulating BentoBoxDS streaming prompt ---");
  await beebeeAI.handleBentoBoxMessage({
    type: 'prompt_stream',
    prompt: 'Tell me about HealthCues in less than 100 words'
  });
  
  // Clean up
  await beebeeAI.dispose();
}

main().catch(console.error);