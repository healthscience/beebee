import { existsSync, statSync } from "fs";
import { dirname } from "path";
import { mkdir } from "fs/promises";

/**
 * Model manager for BeeBee
 * Handles model detection, download sources, and metadata
 */
export class ModelManager {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.modelDir = dirname(modelPath);
    
    // Download sources
    this.sources = {
      hyperdrive: "hyper://abc123def456...", // TODO: Real hyperdrive address
      cloud: "https://coherencestream.com/beebeemodel/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf"
    };
  }
  
  /**
   * Check if model file exists
   */
  exists() {
    return existsSync(this.modelPath);
  }
  
  /**
   * Get model file size (if exists)
   */
  getSize() {
    if (!this.exists()) return null;
    try {
      const stats = statSync(this.modelPath);
      return stats.size;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Ensure model directory exists
   */
  async ensureDirectory() {
    try {
      await mkdir(this.modelDir, { recursive: true });
      return true;
    } catch (error) {
      console.error("Failed to create model directory:", error);
      return false;
    }
  }
  
  /**
   * Get model info for events
   */
  getModelInfo() {
    const exists = this.exists();
    const size = this.getSize();
    
    return {
      exists,
      path: this.modelPath,
      directory: this.modelDir,
      size,
      sources: this.sources,
      expectedSize: 1073741824, // ~1GB expected size
      modelName: "openhands-lm-1.5b-v0.1.i1-Q4_0.gguf"
    };
  }
  
  /**
   * Get download request info
   */
  getDownloadInfo(source = 'hyperdrive') {
    return {
      source,
      url: this.sources[source],
      destination: this.modelPath,
      directory: this.modelDir,
      modelName: "openhands-lm-1.5b-v0.1.i1-Q4_0.gguf"
    };
  }
}