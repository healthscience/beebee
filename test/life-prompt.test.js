import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe('System Prompt Tests', () => {
  let beebee;

  beforeAll(async () => {
    // Initialize BeeBee instance with a configuration
    const config = new BeeBeeConfig();

    beebee = await createBeeBee(config);

    // Wait for the 'ready' event to ensure BeeBee is initialized
    await new Promise((resolve, reject) => {
      beebee.on('ready', resolve);
      beebee.on('error', reject);
    });
  });

  afterAll(async () => {
    // Clean up resources
    if (beebee) {
      await beebee.dispose();
    }
  });

  describe('Reply Functionality', () => {
    it('should return a reply for a given prompt and bboxid', async () => {
      const prompt = 'How to life a healthy life in less then 100 worlds please?';
      const bboxid = '12345';

      // Listen for the 'response' event
      const responsePromise = new Promise((resolve) => {
        beebee.once('response', (response, receivedBboxID) => {
          resolve({ response, receivedBboxID });
        });
      });

      const response = await beebee.prompt(prompt, {}, bboxid);
      const { response: eventResponse, receivedBboxID } = await responsePromise;

      expect(response).toBeDefined();
      expect(response).toBeTypeOf('string');
      expect(response.length).toBeGreaterThan(0);
      expect(eventResponse).toBe(response);
      expect(receivedBboxID).toBe(bboxid);

      // Ensure the response has two parts
      const parts = response.split('\n');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    }, 120000); // Increase timeout to 30 seconds
  });

describe('Streaming Reply Functionality', () => {
    it('should return a streaming reply for a given prompt and bboxid', async () => {
      const prompt = 'How to life a healthy life in less then 100 worlds please?';
      const bboxid = '67890';

      let fullResponse = '';
      const tokensWithBboxID = [];

      const onToken = (token, tokenBboxID) => {
        fullResponse += token;
        tokensWithBboxID.push({ token, bboxid: tokenBboxID });
      };

      // Listen for the 'token' event
      const tokenEvents = [];
      beebee.on('token', (token, receivedBboxID) => {
        console.log('toekn out')
        console.log(token)
        tokenEvents.push({ token, receivedBboxID });
      });

      // Listen for the 'response' event
      const responsePromise = new Promise((resolve) => {
        beebee.once('response', (response, receivedBboxID) => {
          resolve({ response, receivedBboxID });
        });
      });

      const response = await beebee.promptStream(prompt, {}, onToken, bboxid);
      console.log(response);
      const { response: eventResponse, receivedBboxID } = await responsePromise;

      expect(response).toBeDefined();
      expect(response).toBeTypeOf('string');
      expect(response.length).toBeGreaterThan(0);
      expect(fullResponse).toBe(response);
      expect(eventResponse).toBe(response);
      expect(receivedBboxID).toBe(bboxid);

      // Ensure the response has two parts
      const parts = response.split('\n');
      expect(parts.length).toBeGreaterThanOrEqual(2);

      // Validate that each token event has the correct bboxid
      tokenEvents.forEach(({ token, receivedBboxID }) => {
        expect(receivedBboxID).toBe(bboxid);
      });

      // Validate that each token in the tokensWithBboxID array has the correct bboxid
      tokensWithBboxID.forEach(({ token, bboxid: tokenBboxID }) => {
        expect(tokenBboxID).toBe(bboxid);
      });
    }, 120000); // Increase timeout to 120 seconds
  });
});