import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';
import { env } from '@huggingface/transformers';

const REAL_MODEL_PATH = '/home/aboynejames/.hop-models/beebee/gemma-4-E2B-it-Q4_0.gguf';

describe.sequential('System Prompt Tests - Sequential', () => {
  let beebee;

  beforeAll(async () => {
    env.allowRemoteModels = false;
    const config = new BeeBeeConfig({ modelPath: REAL_MODEL_PATH });
    beebee = await createBeeBee(config.get());
  }, 120000);

  afterAll(async () => {});

  describe('Sequential Streaming', () => {
    it('should handle multiple sequential prompts', async () => {
      const prompts = [
        'How to create a HOPquery?',
        'How to use a bentobox?'
      ];

      for (const prompt of prompts) {
        let fullResponse = '';
        for await (const token of beebee.stream(prompt)) {
          fullResponse += token;
        }
        expect(fullResponse.length).toBeGreaterThan(0);
      }
    }, 600000);
  });
});
