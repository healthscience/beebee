import { 
    AutoModelForCausalLM, 
    AutoTokenizer, 
    TextStreamer, 
    LogitsProcessorList,
    env 
} from "@huggingface/transformers";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { JSONLogitsProcessor } from "./generation/JSONLogitsProcessor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// HOP Protocol Config: Local-first, no remote calls
env.allowRemoteModels = false; 
env.localModelPath = process.env.HOP_MODELS_PATH || join(__dirname, "../models/");

class BeeBee {
    constructor(config = {}) {
        this.config = config;
        this.model = null;
        this.tokenizer = null;
        // Support both modelId (HF style) and modelPath (local file style)
        this.modelId = config.modelId || config.modelPath || "onnx-community/gemma-4-E2B-it-ONNX";
        
        // Ensure env.localModelPath is updated if a custom HOP_MODELS_PATH is used in config
        if (config.modelsPath) {
            env.localModelPath = config.modelsPath;
        }
    }

    async initialize() {
        console.log(`🐝 Initializing BeeBee via Transformers.js...`);
        
        // Load the model
        // Transformers.js v3+ supports local ONNX models. 
        // We will attempt to load the modelId/Path provided.
        // If it's an absolute path, transformers.js will look there.
        this.model = await AutoModelForCausalLM.from_pretrained(this.modelId, {
            dtype: this.config.dtype || "fp32", 
            device: this.config.gpu ? "webgpu" : "cpu", 
            local_files_only: true,
        });

        this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId, {
            local_files_only: true,
        });
        return this;
    }

    /**
     * The Story -> Simulation -> EMULATION Pipeline
     * Uses JSON Schema to constrain the model's energy-based logic.
     */
    async emulate(prompt, schema = null) {
        if (!this.model || !this.tokenizer) {
            throw new Error("BeeBee not initialized. Call initialize() first.");
        }

        const inputs = await this.tokenizer(prompt);
        const promptLength = inputs.input_ids.dims[1];
        
        const generationOptions = {
            ...inputs,
            max_new_tokens: this.config.maxTokens || 512,
            temperature: this.config.temperature || 0.7,
            repetition_penalty: 1.1, 
        };

        // Apply JSON Logic (Custom LogitsProcessor)
        if (schema) {
            const processorList = new LogitsProcessorList();
            processorList.push(new JSONLogitsProcessor(this.tokenizer, promptLength, schema));
            generationOptions.logits_processor = processorList;
        }

        const result = await this.model.generate(generationOptions);
        return this.tokenizer.batch_decode(result, { skip_special_tokens: true })[0];
    }

    async *stream(prompt) {
        if (!this.model || !this.tokenizer) {
            throw new Error("BeeBee not initialized. Call initialize() first.");
        }

        const inputs = await this.tokenizer(prompt);
        
        const queue = [];
        let done = false;

        const streamer = new TextStreamer(this.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text) => {
                queue.push(text);
            }
        });

        // Run generation in background
        const generationPromise = this.model.generate({ 
            ...inputs, 
            streamer, 
            max_new_tokens: this.config.maxTokens || 1024,
            temperature: this.config.temperature || 0.7,
        }).finally(() => {
            done = true;
        });

        while (!done || queue.length > 0) {
            if (queue.length > 0) {
                yield queue.shift();
            } else {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        await generationPromise;
    }
}

export { BeeBee };

export const createBeeBee = async (config) => {
    const agent = new BeeBee(config);
    return await agent.initialize();
};
