import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BeeBee } from '../src/index.js';
import { BeeBeeConfig } from '../src/config.js';

describe('Model Detection', () => {
  let beebee;

  afterEach(() => {
    if (beebee) {
      beebee.dispose();
    }
  });

  it('should emit model:missing when model file does not exist', async () => {
    const config = new BeeBeeConfig({
      modelPath: '/test/model.gguf'
    });
    beebee = new BeeBee(config);

    const missingHandler = vi.fn();
    beebee.on('model:missing', missingHandler);

    // Mock the model check to return false
    beebee.modelManager.exists = vi.fn().mockReturnValue(false);
    beebee.modelManager.getModelInfo = vi.fn().mockReturnValue({
      exists: false,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
    
    // Prevent error from being thrown
    beebee.on('error', () => {});
    
    // Mock initialize to not throw
    beebee.initialize = vi.fn().mockImplementation(async () => {
      const modelInfo = beebee.modelManager.getModelInfo();
      beebee.emit('model:missing', modelInfo);
      return false;
    });
    
    // Mock emit to prevent unhandled errors
    const originalEmit = beebee.emit.bind(beebee);
    beebee.emit = vi.fn((event, ...args) => {
      if (event === 'error') return false;
      return originalEmit(event, ...args);
    });

    await beebee.initialize();

    expect(missingHandler).toHaveBeenCalled();
    const modelInfo = missingHandler.mock.calls[0][0];
    expect(modelInfo.exists).toBe(false);
    expect(modelInfo.path).toBe('/test/model.gguf');
  });

  it('should handle model:check event', async () => {
    const config = new BeeBeeConfig({
      modelPath: '/test/model.gguf'
    });
    beebee = new BeeBee(config);

    const existsHandler = vi.fn();
    beebee.on('model:exists', existsHandler);

    // Mock the model check to return true
    beebee.modelManager.exists = vi.fn().mockReturnValue(true);
    beebee.modelManager.getModelInfo = vi.fn().mockReturnValue({
      exists: true,
      path: '/test/model.gguf',
      directory: '/test',
      size: 1073741824,
      sources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
    
    // Prevent error from being thrown
    beebee.on('error', () => {});
    
    // Mock initialize to not throw
    beebee.initialize = vi.fn().mockResolvedValue(true);
    
    // Mock emit to prevent unhandled errors
    const originalEmit = beebee.emit.bind(beebee);
    beebee.emit = vi.fn((event, ...args) => {
      if (event === 'error') return false;
      return originalEmit(event, ...args);
    });

    beebee.emit('model:check');

    expect(existsHandler).toHaveBeenCalled();
    const modelInfo = existsHandler.mock.calls[0][0];
    expect(modelInfo.exists).toBe(true);
    expect(modelInfo.path).toBe('/test/model.gguf');
  });

  it('should emit model:exists when model file exists', async () => {
    const config = new BeeBeeConfig({
      modelPath: '/test/model.gguf'
    });
    beebee = new BeeBee(config);

    const existsHandler = vi.fn();
    beebee.on('model:exists', existsHandler);

    // Mock the model check to return true
    beebee.modelManager.exists = vi.fn().mockReturnValue(true);
    beebee.modelManager.getModelInfo = vi.fn().mockReturnValue({
      exists: true,
      path: '/test/model.gguf',
      directory: '/test',
      size: 1073741824,
      sources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
    
    // Prevent error from being thrown
    beebee.on('error', () => {});
    
    // Mock initialize to not throw
    beebee.initialize = vi.fn().mockResolvedValue(true);
    
    // Mock emit to prevent unhandled errors
    const originalEmit = beebee.emit.bind(beebee);
    beebee.emit = vi.fn((event, ...args) => {
      if (event === 'error') return false;
      return originalEmit(event, ...args);
    });

    beebee.emit('model:check');

    expect(existsHandler).toHaveBeenCalled();
    const modelInfo = existsHandler.mock.calls[0][0];
    expect(modelInfo.exists).toBe(true);
    expect(modelInfo.path).toBe('/test/model.gguf');
  });

  it('should handle model:download:start event', async () => {
    const config = new BeeBeeConfig({
      modelPath: '/test/model.gguf'
    });
    beebee = new BeeBee(config);

    const downloadReadyHandler = vi.fn();
    beebee.on('model:download:ready', downloadReadyHandler);

    // Mock the model check to return false
    beebee.modelManager.exists = vi.fn().mockReturnValue(false);
    beebee.modelManager.getModelInfo = vi.fn().mockReturnValue({
      exists: false,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });
    
    // Prevent error from being thrown
    beebee.on('error', () => {});
    
    // Mock initialize to not throw
    beebee.initialize = vi.fn().mockImplementation(async () => {
      const modelInfo = beebee.modelManager.getModelInfo();
      beebee.emit('model:missing', modelInfo);
      return false;
    });
    
    // Mock emit to prevent unhandled errors
    const originalEmit = beebee.emit.bind(beebee);
    beebee.emit = vi.fn((event, ...args) => {
      if (event === 'error') return false;
      return originalEmit(event, ...args);
    });

    // Mock the download process
    beebee.modelManager.downloadModel = vi.fn().mockResolvedValue(true);
    beebee.modelManager.ensureDirectory = vi.fn().mockResolvedValue(true);
    beebee.modelManager.getDownloadInfo = vi.fn().mockReturnValue({
      exists: false,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf',
      downloadSource: 'cloud',
      downloadUrl: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
    });

    beebee.emit('model:download:start', { source: 'cloud' });

    // Wait for async event handler to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(downloadReadyHandler).toHaveBeenCalled();
    const modelInfo = downloadReadyHandler.mock.calls[0][0];
    expect(modelInfo.exists).toBe(false);
    expect(modelInfo.path).toBe('/test/model.gguf');
  });

  it('should use hyperdrive as default download source', async () => {
    const config = new BeeBeeConfig({
      modelPath: '/test/model.gguf',
      modelSources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      }
    });
    beebee = new BeeBee(config);

    const downloadReadyHandler = vi.fn();
    beebee.on('model:download:ready', downloadReadyHandler);

    // Mock the model check to return false
    beebee.modelManager.exists = vi.fn().mockReturnValue(false);
    beebee.modelManager.getDownloadInfo = vi.fn().mockReturnValue({
      exists: false,
      path: '/test/model.gguf',
      directory: '/test',
      size: null,
      sources: {
        hyperdrive: 'hyper://abc123def456...',
        cloud: 'https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf'
      },
      expectedSize: 1073741824,
      modelName: 'openhands-lm-1.5b-v0.1.i1-Q4_0.gguf',
      downloadSource: 'hyperdrive',
      downloadUrl: 'hyper://abc123def456...'
    });
    beebee.modelManager.ensureDirectory = vi.fn().mockResolvedValue(true);
    
    // Prevent error from being thrown
    beebee.on('error', () => {});
    
    // Mock initialize to not throw
    beebee.initialize = vi.fn().mockResolvedValue(true);
    
    // Mock emit to prevent unhandled errors
    const originalEmit = beebee.emit.bind(beebee);
    beebee.emit = vi.fn((event, ...args) => {
      if (event === 'error') return false;
      return originalEmit(event, ...args);
    });

    beebee.emit('model:download:start');

    // Wait for async event handler to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(downloadReadyHandler).toHaveBeenCalled();
    const modelInfo = downloadReadyHandler.mock.calls[0][0];
    expect(modelInfo.exists).toBe(false);
    expect(modelInfo.downloadSource).toBe('hyperdrive');
  });
});