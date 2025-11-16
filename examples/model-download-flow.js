#!/usr/bin/env node

/**
 * Example: Model Download Flow
 * 
 * This demonstrates how BentoBoxDS would interact with BeeBee
 * to handle model downloads when the model is missing.
 */

import { createBeeBee } from "../src/index.js";
import { EventEmitter } from "events";

// Simulate BentoBoxDS behavior
class BentoBoxDSSimulator extends EventEmitter {
  constructor() {
    super();
    this.beebee = null;
  }
  
  async initialize() {
    console.log("🐝 BentoBoxDS: Initializing BeeBee...\n");
    
    // Create BeeBee instance (but don't use createBeeBee as it calls initialize)
    const { BeeBee } = await import("../src/index.js");
    this.beebee = new BeeBee({
      // Use a non-existent path to trigger model:missing
      modelPath: "/tmp/test-model-missing.gguf"
    });
    
    // Set up event handlers BEFORE initializing
    this.setupEventHandlers();
    
    // Now initialize BeeBee
    await this.beebee.initialize();
  }
  
  setupEventHandlers() {
    // Handle model missing event
    this.beebee.on('model:missing', (modelInfo) => {
      console.log("❌ BentoBoxDS: Model missing event received");
      console.log("   Path:", modelInfo.path);
      console.log("   Sources available:");
      console.log("   - Hyperdrive:", modelInfo.sources.hyperdrive);
      console.log("   - Cloud:", modelInfo.sources.cloud);
      console.log("");
      
      // Simulate user interaction
      this.simulateUserChoice(modelInfo);
    });
    
    // Handle model exists event
    this.beebee.on('model:exists', (modelInfo) => {
      console.log("✅ BentoBoxDS: Model exists!");
      console.log("   Path:", modelInfo.path);
      console.log("   Size:", modelInfo.size, "bytes");
    });
    
    // Handle download ready event
    this.beebee.on('model:download:ready', (downloadInfo) => {
      console.log("📥 BentoBoxDS: Ready to download");
      console.log("   Source:", downloadInfo.source);
      console.log("   URL:", downloadInfo.url);
      console.log("   Destination:", downloadInfo.destination);
      console.log("");
      
      // Simulate download process
      this.simulateDownload(downloadInfo);
    });
    
    // Handle BeeBee ready event
    this.beebee.on('ready', () => {
      console.log("🎉 BentoBoxDS: BeeBee is ready!");
      console.log("   Model loaded successfully");
    });
    
    // Handle errors
    this.beebee.on('error', (error) => {
      if (error.type === 'model:missing') {
        console.log("⚠️  BentoBoxDS: Handling model missing error");
        // In real BentoBoxDS, this would show UI to user
      } else {
        console.error("❌ BentoBoxDS: Error:", error);
      }
    });
  }
  
  simulateUserChoice(modelInfo) {
    console.log("🤔 BentoBoxDS: Simulating user dialog...");
    console.log('   "Would you like to download the BeeBee model?"');
    console.log('   User clicks: [Download from P2P] [Download from Cloud]');
    console.log("");
    
    // Simulate user choosing cloud download
    setTimeout(() => {
      console.log("👤 User selected: Download from Cloud");
      console.log("");
      
      // Emit download start event
      this.beebee.emit('model:download:start', { source: 'cloud' });
    }, 1000);
  }
  
  simulateDownload(downloadInfo) {
    console.log("⏳ BentoBoxDS: Starting download...");
    console.log("   [===>      ] 30%");
    
    setTimeout(() => {
      console.log("   [======>   ] 60%");
    }, 500);
    
    setTimeout(() => {
      console.log("   [=========>] 90%");
    }, 1000);
    
    setTimeout(() => {
      console.log("   [==========] 100%");
      console.log("✅ Download complete!");
      console.log("");
      
      // In real scenario, BentoBoxDS would:
      // 1. Download the file to downloadInfo.destination
      // 2. Verify the download
      // 3. Emit download complete
      
      console.log("📤 BentoBoxDS: Notifying BeeBee of download completion");
      this.beebee.emit('model:download:complete');
      
      // Note: In this simulation, the model still won't exist
      // so BeeBee will emit another error. In real usage,
      // the file would exist after download.
    }, 1500);
  }
}

// Run the simulation
async function main() {
  console.log("=== BeeBee Model Download Flow Example ===\n");
  console.log("This simulates how BentoBoxDS would handle");
  console.log("model download when BeeBee model is missing.\n");
  console.log("==========================================\n");
  
  const simulator = new BentoBoxDSSimulator();
  await simulator.initialize();
}

main().catch(console.error);