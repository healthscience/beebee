import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe.sequential('System Prompt Tests', () => {
  let beebee;

  beforeAll(async () => {
    // Initialize BeeBee instance with a configuration
    const config = new BeeBeeConfig();

    beebee = await createBeeBee(config);

    if (!beebee.isInitialized) {
      await new Promise((resolve, reject) => {
        beebee.on('ready', resolve);
        beebee.on('error', reject);
      });
    }
  });

  afterAll(async () => {
    // Clean up resources
    if (beebee) {
      await beebee.dispose();
    }
  });

  describe('Streaming Reply Functionality', () => {
    it('should return a helpful explaination of a HOPquery', async () => {
      const prompt = 'How to I create a HOPquery?';
      const promptTwo = 'How to use a bentobox in cue space?';
      const bboxid = '67890';
      const bboxidTwo = '43211122334'

      // setup new session for this chat id
      beebee.startNewChatSession(bboxid);
      beebee.startNewChatSession(bboxidTwo);

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
        const handler = (response, receivedBboxID) => {
          if (receivedBboxID === bboxid) {
            beebee.off('response', handler);
            resolve({ response, receivedBboxID });
          }
        };
        beebee.on('response', handler);
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

      // start second prompt
      fullResponse = '';
      const response2 = await beebee.promptStream(promptTwo, {}, onToken, bboxidTwo);
      console.log('response two')
      console.log(response2);

      // Ensure the response has two parts
      const parts = response.split('\n');
      expect(parts.length).toBeGreaterThanOrEqual(2);

      // Validate that each token event has the correct bboxid
      tokenEvents.forEach(({ token, receivedBboxID }) => {
        expect([bboxid, bboxidTwo]).toContain(receivedBboxID);
      });

      // Validate that each token in the tokensWithBboxID array has the correct bboxid
      tokensWithBboxID.forEach(({ token, bboxid: tokenBboxID }) => {
        expect([bboxid, bboxidTwo]).toContain(tokenBboxID);
      });
    }, 300000); // Increase timeout to 300 seconds
  });
});