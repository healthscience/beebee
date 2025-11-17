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
    beebee.modelManager.checkModelExists = vi.fn().mockResolvedValue(false);

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

    const checkHandler = vi.fn();
    beebee.on('model:check', checkHandler);

    // Mock the model check to return true
    beebee.modelManager.checkModelExists = vi.fn().mockResolvedValue(true);

    await beebee.initialize();

    expect(checkHandler).toHaveBeenCalled();
    const modelInfo = checkHandler.mock.calls[0][0];
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
    beebee.modelManager.checkModelExists = vi.fn().mockResolvedValue(true);

    await beebee.initialize();

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

    const downloadStartHandler = vi.fn();
    beebee.on('model:download:start', downloadStartHandler);

    // Mock the model check to return false
    beebee.modelManager.checkModelExists = vi.fn().mockResolvedValue(false);

    // Mock the download process
    beebee.modelManager.downloadModel = vi.fn().mockResolvedValue(true);

    await beebee.initialize();

    expect(downloadStartHandler).toHaveBeenCalled();
    const modelInfo = downloadStartHandler.mock.calls[0][0];
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

    const downloadStartHandler = vi.fn();
    beebee.on('model:download:start', downloadStartHandler);

    // Mock the model check to return false
    beebee.modelManager.checkModelExists = vi.fn().mockResolvedValue(false);

    // Mock the download process
    beebee.modelManager.downloadModel = vi.fn().mockResolvedValue(true);

    await beebee.initialize();

    expect(downloadStartHandler).toHaveBeenCalled();
    const modelInfo = downloadStartHandler.mock.calls[0][0];
    expect(modelInfo.sources.hyperdrive).toBe('hyper://abc123def456...');
  });
});