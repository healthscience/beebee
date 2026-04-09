import { pipeline } from '@huggingface/transformers';
// Note: Transformers.js handles ONNX Runtime internally. 
// We don't usually need to create a separate 'session' manually 
// unless we are doing custom low-level tensor work.

/**
 * Setup and Prompt Gemma 4
 */
async function runGemmaLongevity() {
    console.log("Checking environment and initializing Gemma 4...");

    // 1. Initialize the pipeline
    // In Node.js, we don't have navigator.gpu. 
    // We set device to 'cpu' for maximum inclusion/stability on laptops.
    const generator = await pipeline('text-generation', 'onnx-community/gemma-4-E2B-it-ONNX', {
        dtype: 'q4',
        device: 'cpu', // Forced to CPU to avoid those CUDA/Shared Library errors
        progress_callback: (info) => {
            if (info.status === 'progress') {
                console.log(`[Loading] ${info.file}: ${info.progress.toFixed(1)}%`);
            }
            if (info.status === 'ready') {
                console.log("✅ Gemma 4 is cached and ready.");
            }
        }
    });

    /**
     * Internal prompting function
     */
    async function promptGemma(userQuestion, enableThinking = true) {
        const messages = [
            { 
                role: "system", 
                content: enableThinking 
                    ? "You are a helpful assistant. <|think|>" 
                    : "You are a helpful assistant." 
            },
            { role: "user", content: userQuestion }
        ];

        console.log("\n--- Thinking... ---\n");

        const output = await generator(messages, {
            max_new_tokens: 1024, // Increased for longevity answers
            temperature: 0.7,
            do_sample: true,
            top_p: 0.95,
            // return_full_text: false makes it easier to extract just the answer
            return_full_text: false, 
        });

        // Transformers.js v4 returns the full conversation array or the new text
        // Depending on the version, we extract the content string:
        const response = output[0].generated_text;
        
        // If it's the full array, get the last content; if string, return string.
        return typeof response === 'string' 
            ? response 
            : response[response.length - 1].content;
    }

    // 2. Execute the prompt
    try {
        const question = "How to live for longevity? Provide 3 actionable pillars.";
        const answer = await promptGemma(question);
        
        console.log("\n--- Gemma's Wisdom ---\n");
        console.log(answer);
    } catch (err) {
        console.error("Error during generation:", err);
    }
}

// Start the process
runGemmaLongevity();
