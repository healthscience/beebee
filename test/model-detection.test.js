import { describe, it, expect } from 'vitest';
import { BeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe('Model Detection (GGUF Migration Note)', () => {
  it('should create BeeBee with provided model path', () => {
    const config = new BeeBeeConfig({
      modelPath: '/home/aboynejames/.hop-models/beebee/gemma-4-E2B-it-Q4_0.gguf'
    });
    const beebee = new BeeBee(config.get());
    
    expect(beebee.modelId).toBe('/home/aboynejames/.hop-models/beebee/gemma-4-E2B-it-Q4_0.gguf');
  });

  it('should have initialize method', () => {
    const beebee = new BeeBee({});
    expect(beebee.initialize).toBeTypeOf('function');
  });
});
