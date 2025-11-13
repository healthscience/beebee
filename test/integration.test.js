import { describe, it, expect, vi } from 'vitest';
import { BeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe('BeeBee Integration Tests', () => {
  // Skip these tests if no model file is available
  const modelPath = '/home/aboynejames/.local/share/nomic.ai/GPT4All/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf';
  
  describe('Mock Integration', () => {
    it('should simulate prompt response', async () => {
      const config = new BeeBeeConfig();
      const beebee = new BeeBee(config);
      
      // Mock the entire initialization and prompt flow
      beebee.llama = {};
      beebee.model = {
        detokenize: vi.fn((tokens) => tokens.map(t => `word${t}`).join(' '))
      };
      beebee.context = {};
      beebee.session = {
        prompt: vi.fn(async (text, options) => {
          // Simulate calling onToken callback with numeric tokens
          if (options.onToken) {
            options.onToken([1, 2, 3]); // Numeric tokens
            options.onToken([4, 5]);    // More numeric tokens
          }
          return 'Mocked response';
        })
      };
      
      const response = await beebee.prompt('Test prompt');
      
      expect(beebee.session.prompt).toHaveBeenCalledWith(
        'Test prompt',
        expect.objectContaining({
          temperature: expect.any(Number),
          topP: expect.any(Number),
          maxTokens: expect.any(Number)
        })
      );
      expect(response).toBe('Mocked response');
    });

    it('should simulate streaming response', async () => {
      const config = new BeeBeeConfig();
      const beebee = new BeeBee(config);
      
      // Mock the components
      beebee.llama = {};
      beebee.model = {
        detokenize: vi.fn((tokens) => {
          // Simulate converting token IDs to words
          const wordMap = { 1: 'Hello', 2: 'world', 3: '!', 4: 'How', 5: 'are', 6: 'you?' };
          if (Array.isArray(tokens)) {
            const words = tokens.map(t => wordMap[t] || `token${t}`);
            return words.join(' ');
          }
          return wordMap[tokens] || `token${tokens}`;
        })
      };
      beebee.context = {};
      beebee.session = {
        prompt: vi.fn(async (text, options) => {
          // Simulate streaming by calling onToken multiple times
          if (options.onToken) {
            options.onToken(1);  // "Hello"
            options.onToken(2);  // "world"
            options.onToken(3);  // "!"
          }
          return 'Hello world !';
        })
      };
      
      const tokens = [];
      const response = await beebee.promptStream(
        'Test streaming',
        {},
        (token) => tokens.push(token)
      );
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toBe('Hello');
      expect(tokens[1]).toBe('world');
      expect(tokens[2]).toBe('!');
      expect(response).toBe('Helloworld!');
    });

    it('should handle errors gracefully', async () => {
      const config = new BeeBeeConfig();
      const beebee = new BeeBee(config);
      
      // Mock a session that throws an error
      beebee.session = {
        prompt: vi.fn(async () => {
          throw new Error('Model error');
        })
      };
      
      await expect(beebee.prompt('Test error')).rejects.toThrow('Model error');
    });
  });
});