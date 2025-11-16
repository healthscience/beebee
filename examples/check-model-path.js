#!/usr/bin/env node

/**
 * Check the model path that BeeBee will use
 */

import { BeeBeeConfig } from "../src/config.js";
import { platform, homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";

console.log("🐝 BeeBee Model Path Check\n");

// Show platform info
console.log(`Platform: ${platform()}`);
console.log(`Home directory: ${homedir()}`);

// Create config and show model path
const config = new BeeBeeConfig();
const modelPath = config.get().modelPath;

console.log(`\nModel path: ${modelPath}`);

// Check if model exists
const exists = existsSync(modelPath);
console.log(`Model exists: ${exists ? '✅ Yes' : '❌ No'}`);

if (!exists) {
  console.log("\n📝 To use BeeBee, please place the model file at:");
  console.log(`   ${modelPath}`);
  
  // Show directory that needs to be created
  const modelDir = platform() === 'win32' 
    ? join(homedir(), 'hop-models', 'beebee')
    : join(homedir(), '.hop-models', 'beebee');
  
  console.log("\n📁 You may need to create the directory:");
  console.log(`   mkdir -p "${modelDir}"`);
  
  console.log("\n📥 Then copy the model file:");
  console.log(`   cp /path/to/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf "${modelPath}"`);
}

console.log("\n💡 You can also specify a custom model path:");
console.log('   const beebee = await createBeeBee({ modelPath: "/custom/path/model.gguf" });');