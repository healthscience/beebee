import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';
import { env } from '@huggingface/transformers';

const REAL_MODEL_PATH = '/home/aboynejames/.hop-models/beebee/gemma-4-E2B-it-Q4_0.gguf';

describe.sequential('System Prompt Tests - Product', () => {
  let beebee;

  beforeAll(async () => {
    env.allowRemoteModels = false;
    const config = new BeeBeeConfig({ modelPath: REAL_MODEL_PATH });
    beebee = await createBeeBee(config.get());
  }, 120000);

  afterAll(async () => {});

  describe('Streaming Reply Functionality', () => {
    it('should identify a product query and stream a response', async () => {
      const prompt = 'What skin care products would you recommend for a swimmer?';
      let fullResponse = '';

      for await (const token of beebee.stream(prompt)) {
        fullResponse += token;
      }
      console.log('Full Response:')
      console.log(fullResponse)
      expect(fullResponse.length).toBeGreaterThan(0);
    }, 300000);
  });
});
