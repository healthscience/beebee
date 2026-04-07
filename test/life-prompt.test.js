import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';
import { CohereAsrPreTrainedModel, env } from '@huggingface/transformers';


describe.sequential('System Prompt Tests - Life', () => {
  let beebee;

  beforeAll(async () => {
    env.allowRemoteModels = false;
    const config = new BeeBeeConfig();
    console.log('config')
    console.log(config.get())
    beebee = await createBeeBee(config.get());
  }, 120000);

  afterAll(async () => {});

  describe('Reply Functionality', () => {
    it('should return a reply for a given prompt', async () => {
      const prompt = 'How to live a healthy life?';
      const response = await beebee.emulate(prompt);
      console.log('Response:')
      console.log(response)
      expect(response).toBeDefined();
      expect(response).toBeTypeOf('string');
      expect(response.length).toBeGreaterThan(0);
    }, 300000);
  });

  describe('Streaming Reply Functionality', () => {
    it('should return a streaming reply for a given prompt', async () => {
      const prompt = 'Healthy life tips?';
      let fullResponse = '';

      for await (const token of beebee.stream(prompt)) {
        fullResponse += token;
      }
      console.log('Full response:')
      console.log(fullResponse)
      expect(fullResponse.length).toBeGreaterThan(0);
    }, 300000);
  });
});
