import { describe, it, expect, vi } from 'vitest';
import { JSONLogitsProcessor } from '../src/generation/JSONLogitsProcessor.js';
import { Tensor } from '@huggingface/transformers';

describe('JSONLogitsProcessor', () => {
    const mockTokenizer = {
        encode: (text) => {
            if (text === '{') return [1];
            if (text === '}') return [2];
            if (text === '"') return [3];
            if (text === ':') return [4];
            if (text === ',') return [5];
            if (text === ' ') return [6];
            if (text === '\n') return [7];
            return [99];
        },
        decode: (ids) => {
            const map = { 1: '{', 2: '}', 3: '"', 4: ':', 5: ',', 6: ' ', 7: '\n' };
            return ids.map(id => map[id] || '').join('');
        }
    };

    it('should force opening brace at start', () => {
        const processor = new JSONLogitsProcessor(mockTokenizer, 10);
        const inputIds = [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n]]; // length 10
        const logitsData = new Float32Array(100).fill(0);
        const logits = new Tensor('float32', logitsData, [1, 100]);

        const result = processor._call(inputIds, logits);
        const resultData = result.data;

        expect(resultData[1]).toBeGreaterThan(-1000); // '{' is allowed
        expect(resultData[3]).toBeLessThan(-5000);    // '"' is masked
        expect(resultData[99]).toBeLessThan(-5000);   // other is masked
    });

    it('should force quote after opening brace', () => {
        const processor = new JSONLogitsProcessor(mockTokenizer, 10);
        const inputIds = [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 1n]]; // '{' added
        const logitsData = new Float32Array(100).fill(0);
        const logits = new Tensor('float32', logitsData, [1, 100]);

        const result = processor._call(inputIds, logits);
        const resultData = result.data;

        expect(resultData[3]).toBeGreaterThan(-1000); // '"' is allowed
        expect(resultData[1]).toBeLessThan(-5000);    // '{' is masked
    });

    it('should force colon after key', () => {
        const processor = new JSONLogitsProcessor(mockTokenizer, 10);
        // Prompt + {"key"
        const inputIds = [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 1n, 3n, 99n, 3n]]; 
        const logitsData = new Float32Array(100).fill(0);
        const logits = new Tensor('float32', logitsData, [1, 100]);

        const result = processor._call(inputIds, logits);
        const resultData = result.data;

        expect(resultData[4]).toBeGreaterThan(-1000); // ':' is allowed
        expect(resultData[5]).toBeLessThan(-5000);    // ',' is masked
    });

    it('should force quote for value after colon', () => {
        const processor = new JSONLogitsProcessor(mockTokenizer, 10);
        // Prompt + {"key":
        const inputIds = [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 1n, 3n, 99n, 3n, 4n]]; 
        const logitsData = new Float32Array(100).fill(0);
        const logits = new Tensor('float32', logitsData, [1, 100]);

        const result = processor._call(inputIds, logits);
        const resultData = result.data;

        expect(resultData[3]).toBeGreaterThan(-1000); // '"' is allowed
    });

    it('should allow comma or closing brace after value', () => {
        const processor = new JSONLogitsProcessor(mockTokenizer, 10);
        // Prompt + {"key":"value"
        const inputIds = [[1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 1n, 3n, 99n, 3n, 4n, 3n, 99n, 3n]]; 
        const logitsData = new Float32Array(100).fill(0);
        const logits = new Tensor('float32', logitsData, [1, 100]);

        const result = processor._call(inputIds, logits);
        const resultData = result.data;

        expect(resultData[5]).toBeGreaterThan(-1000); // ',' is allowed
        expect(resultData[2]).toBeGreaterThan(-1000); // '}' is allowed
        expect(resultData[3]).toBeLessThan(-5000);    // '"' is masked
    });
});
