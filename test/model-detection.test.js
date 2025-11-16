import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BeeBee } from '../src/index.js';
import { existsSync } from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

// Mock node-llama-cpp
vi.mock('node-llama-cpp', () => ({
  getLlama: vi.fn(),
  LlamaChatSession: vi.fn(),
  LlamaChat: vi.fn()
}));

describe('Model Detection', () => {
  let beebee;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should emit model:missing when model file does not exist', async () => {
    // Mock model doesn't exist
    existsSync.mockReturnValue(false);
    
    const modelMissingHandler = vi.fn();
    const errorHandler = vi.fn();
    
    beebee = new BeeBee({
      modelPath: '/test/model.gguf'
    });
    
    beebee.on('model:missing', modelMissingHandler);
    beebee.on('error', errorHandler);
    
    const result = await beebee.initialize();
    
    expect(result).toBe(false);
    expect(modelMissingHandler).toHaveBeenCalledWith({
      exists: false,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: {
        hyperdrive: expect.any(String),
        cloud: expect.stringContaining('coherencestream.com')
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
    
    expect(errorHandler).toHaveBeenCalledWith({
      type: 'model:missing',
      message: expect.stringContaining('Model file not found'),
      modelInfo: expect.any(Object)
    });
  });
  
  it('should handle model:check event', async () => {
    existsSync.mockReturnValue(false);
    
    beebee = new BeeBee({
      modelPath: '/test/model.gguf'
    });
    
    const modelMissingHandler = vi.fn();
    beebee.on('model:missing', modelMissingHandler);
    
    // Trigger model check
    beebee.emit('model:check');
    
    expect(modelMissingHandler).toHaveBeenCalledWith({
      exists: false,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: expect.any(Object),
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
  });
  
  it('should emit model:exists when model file exists', async () => {
    existsSync.mockReturnValue(true);
    
    beebee = new BeeBee({
      modelPath: '/test/model.gguf'
    });
    
    const modelExistsHandler = vi.fn();
    beebee.on('model:exists', modelExistsHandler);
    
    // Trigger model check
    beebee.emit('model:check');
    
    expect(modelExistsHandler).toHaveBeenCalledWith({
      exists: true,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: expect.any(Object),
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
  });
  
  it('should handle model:download:start event', async () => {
    existsSync.mockReturnValue(false);
    
    beebee = new BeeBee({
      modelPath: '/test/model.gguf'
    });
    
    const downloadReadyHandler = vi.fn();
    beebee.on('model:download:ready', downloadReadyHandler);
    
    // Trigger download start
    beebee.emit('model:download:start', { source: 'cloud' });
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(downloadReadyHandler).toHaveBeenCalledWith({
      source: 'cloud',
      url: expect.stringContaining('coherencestream.com'),
      destination: '/test/model.gguf',
      directory: '/test',
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
  });
  
  it('should use hyperdrive as default download source', async () => {
    existsSync.mockReturnValue(false);
    
    beebee = new BeeBee({
      modelPath: '/test/model.gguf'
    });
    
    const downloadReadyHandler = vi.fn();
    beebee.on('model:download:ready', downloadReadyHandler);
    
    // Trigger download without specifying source
    beebee.emit('model:download:start', {});
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(downloadReadyHandler).toHaveBeenCalledWith({
      source: 'hyperdrive',
      url: expect.stringContaining('hyper://'),
      destination: '/test/model.gguf',
      directory: '/test',
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
  });
});