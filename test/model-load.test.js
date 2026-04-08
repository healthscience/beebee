import { describe, it, expect } from 'vitest';
import { env, AutoModelForCausalLM, AutoTokenizer } from '@huggingface/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = path.resolve(__dirname, '../model');

// Configure environment to use local files only
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = modelPath;

describe('Gemma 4 Model Loading', () => {
  it('should load the tokenizer and model successfully', async () => {
    console.log(`Loading model from: ${modelPath}`);
    
    // Load tokenizer
    const tokenizer = await AutoTokenizer.from_pretrained(modelPath);
    expect(tokenizer).toBeDefined();
    console.log('Tokenizer loaded successfully');

    // Load model
    // Note: Gemma 4 is a complex model, loading it might take time and memory
    const model = await AutoModelForCausalLM.from_pretrained(modelPath, {
        device: 'cpu',
    });
    
    expect(model).toBeDefined();
    console.log('Model loaded successfully');
  }, 300000); // 5 minute timeout for large model loading
});
