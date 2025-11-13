import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe('System Prompt Tests', () => {
  let beebee;

  afterEach(() => {
    if (beebee) {
      beebee.dispose();
    }
  });

  describe('Prompt Method', () => {
    it('should include system prompt by default', async () => {
      const config = new BeeBeeConfig({
        systemPrompt: 'You are BeeBee, a helpful BentoBoxDS agent.'
      });
      beebee = new BeeBee(config);
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn(async (text) => {
          expect(text).toContain('You are BeeBee, a helpful BentoBoxDS agent.');
          expect(text).toContain('User: Hello');
          expect(text).toContain('Assistant:');
          return 'Hello! I am BeeBee, ready to help with BentoBoxDS.';
        })
      };
      
      const response = await beebee.prompt('Hello');
      expect(beebee.session.prompt).toHaveBeenCalled();
      expect(response).toBe('Hello! I am BeeBee, ready to help with BentoBoxDS.');
    });

    it('should skip system prompt when includeSystemPrompt is false', async () => {
      const config = new BeeBeeConfig({
        systemPrompt: 'You are BeeBee, a helpful BentoBoxDS agent.'
      });
      beebee = new BeeBee(config);
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn(async (text) => {
          expect(text).toBe('Hello');
          expect(text).not.toContain('You are BeeBee');
          return 'Direct response';
        })
      };
      
      const response = await beebee.prompt('Hello', { includeSystemPrompt: false });
      expect(beebee.session.prompt).toHaveBeenCalled();
      expect(response).toBe('Direct response');
    });

    it('should work without system prompt in config', async () => {
      const config = new BeeBeeConfig({
        systemPrompt: '' // Explicitly set to empty
      });
      beebee = new BeeBee(config);
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn(async (text) => {
          expect(text).toBe('Hello');
          return 'Response without system prompt';
        })
      };
      
      const response = await beebee.prompt('Hello');
      expect(beebee.session.prompt).toHaveBeenCalled();
      expect(response).toBe('Response without system prompt');
    });
  });

  describe('PromptStream Method', () => {
    it('should include system prompt in streaming by default', async () => {
      const config = new BeeBeeConfig({
        systemPrompt: 'You are BeeBee, a helpful BentoBoxDS agent.'
      });
      beebee = new BeeBee(config);
      
      // Mock the session and model
      beebee.model = {
        detokenize: vi.fn((tokens) => tokens.map(t => `token${t}`).join(''))
      };
      
      beebee.session = {
        prompt: vi.fn(async (text, options) => {
          expect(text).toContain('You are BeeBee, a helpful BentoBoxDS agent.');
          expect(text).toContain('User: What is BentoBoxDS?');
          
          // Simulate streaming tokens
          if (options.onToken) {
            options.onToken([1, 2, 3]);
            options.onToken([4, 5]);
          }
          return 'Full response';
        })
      };
      
      const tokens = [];
      const response = await beebee.promptStream(
        'What is BentoBoxDS?', 
        {}, 
        (token) => tokens.push(token)
      );
      
      expect(beebee.session.prompt).toHaveBeenCalled();
      expect(tokens).toEqual(['token1', 'token2', 'token3', 'token4', 'token5']);
      expect(response).toBe('token1token2token3token4token5');
    });

    it('should skip system prompt in streaming when includeSystemPrompt is false', async () => {
      const config = new BeeBeeConfig({
        systemPrompt: 'You are BeeBee, a helpful BentoBoxDS agent.'
      });
      beebee = new BeeBee(config);
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn(async (text, options) => {
          expect(text).toBe('Direct question');
          expect(text).not.toContain('You are BeeBee');
          
          if (options.onToken) {
            options.onToken('Direct ');
            options.onToken('streaming ');
            options.onToken('response');
          }
          return 'Full response';
        })
      };
      
      const tokens = [];
      const response = await beebee.promptStream(
        'Direct question', 
        { includeSystemPrompt: false }, 
        (token) => tokens.push(token)
      );
      
      expect(beebee.session.prompt).toHaveBeenCalled();
      expect(tokens).toEqual(['Direct ', 'streaming ', 'response']);
      expect(response).toBe('Direct streaming response');
    });
  });

  describe('BentoBoxDS System Prompt', () => {
    it('should use the default BentoBoxDS system prompt', () => {
      const config = new BeeBeeConfig();
      
      expect(config.systemPrompt).toMatch(/BeeBee/);
      expect(config.systemPrompt).toMatch(/BentoBoxDS/);
      expect(config.systemPrompt).toMatch(/HealthCues/);
      expect(config.systemPrompt).toMatch(/HOP/);
    });
  });

  describe('Event-Based API', () => {
    it('should emit ready event when initialized', async () => {
      const config = new BeeBeeConfig({
        modelPath: '/fake/model.gguf'
      });
      beebee = new BeeBee(config);
      
      const readyHandler = vi.fn();
      beebee.on('ready', readyHandler);
      
      // Mock the initialization - skip file check
      beebee.llama = { loadModel: vi.fn().mockResolvedValue({
        createContext: vi.fn().mockResolvedValue({
          getSequence: vi.fn().mockReturnValue({})
        })
      })};
      
      // Mock the session creation
      vi.mock('node-llama-cpp', () => ({
        getLlama: vi.fn(),
        LlamaChatSession: vi.fn().mockImplementation(() => ({}))
      }));
      
      // Call initialize without file check
      beebee.model = await beebee.llama.loadModel();
      beebee.context = await beebee.model.createContext();
      beebee.session = {};
      beebee.emit('ready');
      
      expect(readyHandler).toHaveBeenCalled();
    });

    it('should emit response event on prompt completion', async () => {
      const config = new BeeBeeConfig();
      beebee = new BeeBee(config);
      
      const responseHandler = vi.fn();
      beebee.on('response', responseHandler);
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn().mockResolvedValue('Test response')
      };
      
      const response = await beebee.prompt('Test message');
      
      expect(responseHandler).toHaveBeenCalledWith('Test response');
      expect(response).toBe('Test response');
    });

    it('should emit token events during streaming', async () => {
      const config = new BeeBeeConfig();
      beebee = new BeeBee(config);
      
      const tokenHandler = vi.fn();
      const responseHandler = vi.fn();
      
      beebee.on('token', tokenHandler);
      beebee.on('response', responseHandler);
      
      // Mock the model for detokenization
      beebee.model = {
        detokenize: vi.fn((tokens) => `token${tokens[0]}`)
      };
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn(async (text, options) => {
          // Simulate streaming by calling onToken
          if (options.onToken) {
            options.onToken([1]);
            options.onToken([2, 3]);
            options.onToken('direct');
          }
          return 'Full response';
        })
      };
      
      const response = await beebee.promptStream('Test streaming');
      
      // Check token events were emitted
      expect(tokenHandler).toHaveBeenCalledTimes(4);
      expect(tokenHandler).toHaveBeenNthCalledWith(1, 'token1');
      expect(tokenHandler).toHaveBeenNthCalledWith(2, 'token2');
      expect(tokenHandler).toHaveBeenNthCalledWith(3, 'token3');
      expect(tokenHandler).toHaveBeenNthCalledWith(4, 'direct');
      
      // Check response event was emitted
      expect(responseHandler).toHaveBeenCalledWith('token1token2token3direct');
      expect(response).toBe('token1token2token3direct');
    });

    it('should emit error event on failure', async () => {
      const config = new BeeBeeConfig();
      beebee = new BeeBee(config);
      
      const errorHandler = vi.fn();
      beebee.on('error', errorHandler);
      
      const testError = new Error('Test error');
      
      // Mock the session to throw error
      beebee.session = {
        prompt: vi.fn().mockRejectedValue(testError)
      };
      
      await expect(beebee.prompt('Test')).rejects.toThrow('Test error');
      expect(errorHandler).toHaveBeenCalledWith(testError);
    });

    it('should support both callback and event listeners for streaming', async () => {
      const config = new BeeBeeConfig();
      beebee = new BeeBee(config);
      
      const tokenHandler = vi.fn();
      const callbackHandler = vi.fn();
      
      beebee.on('token', tokenHandler);
      
      // Mock the model
      beebee.model = {
        detokenize: vi.fn(() => 'token')
      };
      
      // Mock the session
      beebee.session = {
        prompt: vi.fn(async (text, options) => {
          if (options.onToken) {
            options.onToken([1]);
            options.onToken([2]);
          }
          return 'Full response';
        })
      };
      
      await beebee.promptStream('Test', {}, callbackHandler);
      
      // Both event listener and callback should be called
      expect(tokenHandler).toHaveBeenCalledTimes(2);
      expect(callbackHandler).toHaveBeenCalledTimes(2);
      expect(tokenHandler).toHaveBeenCalledWith('token');
      expect(callbackHandler).toHaveBeenCalledWith('token');
    });
  });
});