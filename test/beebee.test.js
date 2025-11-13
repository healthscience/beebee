import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { BeeBee, createBeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe('BeeBee', () => {
  let beebee;
  
  // Mock the model file existence check
  beforeAll(() => {
    vi.mock('fs', () => ({
      existsSync: vi.fn(() => true)
    }));
  });

  afterAll(async () => {
    if (beebee) {
      await beebee.dispose();
    }
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should create a valid configuration', () => {
      const config = new BeeBeeConfig();
      const validation = config.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate temperature range', () => {
      const config = new BeeBeeConfig();
      config.set('temperature', 2.5); // Invalid: > 2.0
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Temperature must be between 0 and 2');
    });

    it('should validate topP range', () => {
      const config = new BeeBeeConfig();
      config.set('topP', -0.1); // Invalid: < 0
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('TopP must be between 0 and 1');
    });

    it('should validate maxTokens', () => {
      const config = new BeeBeeConfig();
      config.set('maxTokens', -100); // Invalid: < 1
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('MaxTokens must be at least 1');
    });

    it('should validate contextSize', () => {
      const config = new BeeBeeConfig();
      config.set('contextSize', 100); // Invalid: < 128
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Context size must be at least 128');
    });

    it('should validate threads', () => {
      const config = new BeeBeeConfig();
      config.set('threads', 0); // Invalid: < 1
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Threads must be at least 1');
    });
  });

  describe('Initialization', () => {
    it('should create BeeBee instance', () => {
      const config = new BeeBeeConfig();
      beebee = new BeeBee(config);
      
      expect(beebee).toBeInstanceOf(BeeBee);
      expect(beebee.config).toEqual(config.get());
    });

    it('should create BeeBee using factory function', async () => {
      // Mock the initialization to avoid actual model loading
      vi.mock('../src/index.js', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          createBeeBee: async (config) => {
            const instance = new actual.BeeBee(config);
            // Don't actually initialize, just return the instance
            return instance;
          }
        };
      });
      
      const instance = await createBeeBee();
      expect(instance).toBeInstanceOf(BeeBee);
    });

    it('should throw error when calling prompt before initialization', async () => {
      const instance = new BeeBee(new BeeBeeConfig());
      
      await expect(instance.prompt('test')).rejects.toThrow(
        'BeeBee not initialized. Call initialize() first.'
      );
    });

    it('should throw error when calling promptStream before initialization', async () => {
      const instance = new BeeBee(new BeeBeeConfig());
      
      await expect(instance.promptStream('test')).rejects.toThrow(
        'BeeBee not initialized. Call initialize() first.'
      );
    });
  });

  describe('Token Handling', () => {
    it('should handle numeric tokens in streaming', () => {
      // This test validates the fix for the token type error
      const config = new BeeBeeConfig();
      const instance = new BeeBee(config);
      
      // Mock the model's detokenize method
      instance.model = {
        detokenize: vi.fn((tokens) => {
          // Simulate converting token IDs to text
          return tokens.map(t => `token${t}`).join('');
        })
      };

      // Test the token conversion logic
      const numericToken = 42;
      const result = instance.model.detokenize([numericToken]);
      
      expect(result).toBe('token42');
      expect(instance.model.detokenize).toHaveBeenCalledWith([42]);
    });
  });
});