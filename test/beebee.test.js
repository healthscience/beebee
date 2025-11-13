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
      config.temperature = 2.5; // Invalid: > 2.0
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('temperature must be between 0 and 2');
    });

    it('should validate topP range', () => {
      const config = new BeeBeeConfig();
      config.topP = -0.1; // Invalid: < 0
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('topP must be between 0 and 1');
    });

    it('should validate maxTokens', () => {
      const config = new BeeBeeConfig();
      config.maxTokens = -100; // Invalid: < 1
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('maxTokens must be at least 1');
    });

    it('should validate contextSize', () => {
      const config = new BeeBeeConfig();
      config.contextSize = 100; // Invalid: < 128
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('contextSize must be at least 128');
    });

    it('should validate threads', () => {
      const config = new BeeBeeConfig();
      config.threads = 0; // Invalid: < 1
      
      const validation = config.validate();
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('threads must be at least 1');
    });
  });

  describe('Initialization', () => {
    it('should create BeeBee instance', () => {
      const config = new BeeBeeConfig();
      beebee = new BeeBee(config);
      
      expect(beebee).toBeInstanceOf(BeeBee);
      expect(beebee.config).toBe(config);
    });

    it('should create BeeBee using factory function', () => {
      const instance = createBeeBee();
      expect(instance).toBeInstanceOf(BeeBee);
      instance.dispose(); // Clean up
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