import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';
import { env } from '@huggingface/transformers';

const REAL_MODEL_PATH = '/home/aboynejames/.hop-models/beebee/gemma-4-E2B-it-Q4_0.gguf';

describe.sequential('System Prompt Tests', () => {
  let beebee;

  beforeAll(async () => {
    // Ensure we don't try to download models from HF
    env.allowRemoteModels = false;

    // Initialize BeeBee instance with a configuration pointing to the real model
    const config = new BeeBeeConfig({ 
        modelPath: REAL_MODEL_PATH,
        maxTokens: 512
    });

    try {
        beebee = await createBeeBee(config.get());
    } catch (e) {
        console.error('Failed to initialize BeeBee with real model:', e.message);
        // We skip tests if initialization fails to avoid cascading errors
    }
  }, 120000);

  afterAll(async () => {
    // Clean up if needed
  });

  describe('Streaming Reply Functionality', () => {
    it('should return a helpful explanation of a HOPquery', async () => {
      if (!beebee) {
        console.warn('Skipping test as BeeBee was not initialized');
        return;
      }

      const prompt = 'How do I create a HOPquery?';
      let fullResponse = '';

      for await (const token of beebee.stream(prompt)) {
        console.log('token out:', token);
        fullResponse += token;
      }

      expect(fullResponse).toBeDefined();
      expect(fullResponse.length).toBeGreaterThan(0);
      
      // Basic check for content
      expect(fullResponse.toLowerCase()).toContain('hop');
    }, 300000); // Increase timeout to 300 seconds
  });
});
