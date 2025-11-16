import { createBeeBee } from '../src/index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Example demonstrating BeeBee fine-tuning functionality
 * 
 * This shows how to:
 * 1. Start fine-tuning with training data
 * 2. Monitor progress
 * 3. Stop fine-tuning
 * 4. Check for network upgrades
 */

async function main() {
  console.log('BeeBee Fine-tuning Example\n');
  
  // Create BeeBee instance
  const beebee = await createBeeBee({
    modelPath: join(__dirname, '..', 'models', 'beebee-1b.gguf'),
    systemPrompt: 'You are BeeBee, a helpful AI assistant.'
  });
  
  // Set up fine-tuning event listeners
  beebee.on('finetune:start', (data) => {
    console.log('Fine-tuning started:', data);
  });
  
  beebee.on('finetune:progress', (data) => {
    console.log('Progress:', data);
  });
  
  beebee.on('finetune:metrics', (metrics) => {
    console.log('Training metrics:', metrics);
  });
  
  beebee.on('finetune:complete', (data) => {
    console.log('Fine-tuning complete:', data);
  });
  
  beebee.on('finetune:error', (error) => {
    console.error('Fine-tuning error:', error);
  });
  
  beebee.on('finetune:stopped', (data) => {
    console.log('Fine-tuning stopped:', data);
  });
  
  // Set up network upgrade event listeners
  beebee.on('upgrade:available', (upgradeInfo) => {
    console.log('Network upgrade available:', upgradeInfo);
  });
  
  beebee.on('upgrade:checking', () => {
    console.log('Checking for network upgrades...');
  });
  
  // Example 1: Check for network upgrades
  console.log('\n--- Checking for Network Upgrades ---');
  const upgradeInfo = await beebee.checkNetworkUpgrade();
  console.log('Upgrade check result:', upgradeInfo);
  
  // Example 2: Start fine-tuning (mock data)
  console.log('\n--- Starting Fine-tuning ---');
  
  // Prepare training data
  const trainingData = [
    {
      input: "What is the capital of France?",
      output: "The capital of France is Paris.",
      context: "You are a helpful geography assistant."
    },
    {
      input: "How do I make a sandwich?",
      output: "To make a sandwich: 1) Get two slices of bread, 2) Add your favorite fillings like meat, cheese, lettuce, 3) Put the slices together.",
      context: "You are a helpful cooking assistant."
    },
    {
      input: "What is machine learning?",
      output: "Machine learning is a type of artificial intelligence that enables computers to learn from data without being explicitly programmed.",
      context: "You are a helpful AI educator."
    }
  ];
  
  try {
    // Start fine-tuning
    await beebee.startFineTuning({
      trainingData: trainingData,
      epochs: 3,
      batchSize: 2,
      learningRate: 5e-5,
      method: 'lora'  // Use LoRA for efficient fine-tuning
    });
    
    // Get status
    console.log('\nFine-tuning status:', beebee.getFineTuneStatus());
    
    // Simulate stopping after a delay (in real usage, this would be based on user action)
    setTimeout(async () => {
      console.log('\n--- Stopping Fine-tuning ---');
      await beebee.stopFineTuning();
    }, 5000);
    
  } catch (error) {
    console.error('Error during fine-tuning:', error);
  }
  
  // Keep the process running to see events
  setTimeout(() => {
    console.log('\n--- Cleaning up ---');
    beebee.dispose();
    process.exit(0);
  }, 10000);
}

// Run the example
main().catch(console.error);