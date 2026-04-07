import { LogitsProcessor } from "@huggingface/transformers";

/**
 * A simplified LogitsProcessor that enforces a basic JSON object structure.
 * This is a "best-effort" implementation for Transformers.js v4.x
 * which lacks native grammar/JSON schema support in generate().
 */
export class JSONLogitsProcessor extends LogitsProcessor {
    /**
     * @param {Object} tokenizer The tokenizer instance.
     * @param {number} promptLength The length of the prompt in tokens.
     * @param {Object} schema Optional JSON schema (unused for now, but for future expansion).
     */
    constructor(tokenizer, promptLength, schema = null) {
        super();
        this.tokenizer = tokenizer;
        this.promptLength = promptLength;
        this.schema = schema;

        // Cache common JSON token IDs
        this.lbraceId = this.getTokenId("{");
        this.rbraceId = this.getTokenId("}");
        this.quoteId = this.getTokenId('"');
        this.colonId = this.getTokenId(":");
        this.commaId = this.getTokenId(",");
        this.spaceId = this.getTokenId(" ");
        this.newlineId = this.getTokenId("\n");
    }

    getTokenId(text) {
        try {
            const ids = this.tokenizer.encode(text, { add_special_tokens: false });
            return ids[ids.length - 1];
        } catch (e) {
            return null;
        }
    }

    /**
     * Enforce a basic state machine for JSON:
     * 1. Start with '{'
     * 2. After '{' or ',', expect '"' (key start)
     * 3. After key, expect ':'
     * 4. After ':', expect value (simplified to '"' or number for now)
     * 5. After value, expect ',' or '}'
     */
    _call(inputIds, logits) {
        for (let i = 0; i < logits.dims[0]; ++i) {
            const batchLogits = logits[i].data;
            const generatedIds = inputIds[i].slice(this.promptLength);
            const currentText = this.tokenizer.decode(generatedIds);
            const trimmedText = currentText.trim();

            // Very basic state machine based on the end of the current string
            if (generatedIds.length === 0) {
                this.maskAllExcept(batchLogits, [this.lbraceId]);
            } else if (trimmedText === "{") {
                this.maskAllExcept(batchLogits, [this.quoteId]);
            } else if (trimmedText.endsWith("{") || trimmedText.endsWith(",")) {
                 this.maskAllExcept(batchLogits, [this.quoteId]);
            } else if (trimmedText.match(/"\s*$/)) {
                // If we just finished a key or string value
                if (this.isExpectingColon(trimmedText)) {
                    this.maskAllExcept(batchLogits, [this.colonId]);
                } else {
                    this.maskAllExcept(batchLogits, [this.commaId, this.rbraceId]);
                }
            } else if (trimmedText.endsWith(":")) {
                // Expect value - for now, just force a quote for a string value
                this.maskAllExcept(batchLogits, [this.quoteId]);
            }
        }
        return logits;
    }

    isExpectingColon(text) {
        // Count quotes to see if we are at the end of a key
        const quotes = (text.match(/"/g) || []).length;
        // Simplified: if odd number of quotes after last '{' or ',', we are in a string.
        // If even, we just closed one.
        const lastStructural = Math.max(text.lastIndexOf("{"), text.lastIndexOf(","));
        const sinceLast = text.substring(lastStructural + 1);
        const quotesSince = (sinceLast.match(/"/g) || []).length;
        
        // If we just closed a quote and there are no colons since last structural, it was a key.
        return quotesSince === 2 && !sinceLast.includes(":");
    }

    maskAllExcept(data, allowedTokens) {
        const validTokens = allowedTokens.filter(id => id !== null);
        if (validTokens.length === 0) return;

        const originalValues = validTokens.map(id => data[id]);
        data.fill(-10000); // Use a large negative value instead of -Infinity to avoid NaN issues
        for (let i = 0; i < validTokens.length; ++i) {
            data[validTokens[i]] = originalValues[i];
        }
    }
}
