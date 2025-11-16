# BeeBee

A lightweight Node.js LLM service using node-llama-cpp for BentoBoxDS.

## Overview

BeeBee is a standalone LLM service that replaces the previous chain of `beebee-ai → hop-learn → cale-gtp4all` with a simpler, more efficient Node.js implementation using `node-llama-cpp`.

## Features

- 🚀 Direct GGUF model support
- 📡 Streaming responses
- 🔧 Simple API
- ⚡ Native performance with node-llama-cpp
- 🎯 Focused on the OpenHands 1.5B model

## Installation

```bash
npm install
```

### Model Setup

BeeBee requires a GGUF model file. By default, it looks for the model in the HOP models directory:

- **Linux/Mac**: `~/.hop-models/beebee/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf`
- **Windows**: `~/hop-models/beebee/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf`

To set up the model:

```bash
# Create the directory (Linux/Mac)
mkdir -p ~/.hop-models/beebee

# Create the directory (Windows)
mkdir -p ~/hop-models/beebee

# Copy your model file to the directory
cp /path/to/openhands-lm-1.5b-v0.1.i1-Q4_0.gguf ~/.hop-models/beebee/
```

You can also specify a custom model path:

```javascript
const beebee = await createBeeBee({
  modelPath: "/custom/path/to/model.gguf"
});
```

## Quick Start

```javascript
import { createBeeBee } from "beebee";

// Initialize BeeBee with default settings
const beebee = await createBeeBee();

// Generate a response
const response = await beebee.prompt("Can you outline the best way to live life?");
console.log(response);

// Don't forget to dispose when done
await beebee.dispose();
```

## Configuration

BeeBee uses the OpenHands 1.5B model by default. You can customize the configuration:

```javascript
const beebee = await createBeeBee({
  modelPath: "/path/to/your/model.gguf",  // Default: OpenHands 1.5B
  contextSize: 2048,                      // Default: 2048
  threads: 4,                             // Default: 4
  temperature: 0.7,                       // Default: 0.7
  topP: 0.9,                             // Default: 0.9
  maxTokens: 256                         // Default: 256
});
```

## Model Management

BeeBee includes automatic model detection and download support through events. When the model file is missing, BeeBee emits events that BentoBoxDS can handle to download the model from either a P2P network (Hyperdrive) or cloud backup.

### Model Events

**Outgoing Events (BeeBee → BentoBoxDS):**
- `model:missing` - Emitted when model file is not found
- `model:exists` - Emitted when model file exists  
- `model:download:ready` - Ready to receive the model file
- `error` - Emitted with type `model:missing` when model is not found

**Incoming Events (BentoBoxDS → BeeBee):**
- `model:check` - Request to check if model exists
- `model:download:start` - User wants to download the model
- `model:download:complete` - Model download has finished

### Example Model Download Flow

```javascript
// BentoBoxDS handles model download when BeeBee reports missing model
beebee.on('model:missing', (modelInfo) => {
  console.log('Model not found:', modelInfo.path);
  console.log('Download sources:', modelInfo.sources);
  // Show UI to user for download choice
});

// User chooses to download
beebee.emit('model:download:start', { source: 'cloud' });

// BeeBee prepares for download
beebee.on('model:download:ready', (downloadInfo) => {
  // BentoBoxDS downloads file to downloadInfo.destination
  // When complete:
  beebee.emit('model:download:complete');
});
```

See `examples/model-download-flow.js` for a complete demonstration.

## API Reference

### `createBeeBee(config)`

Factory function to create and initialize a BeeBee instance.

### Event-Based API

BeeBee extends EventEmitter and emits the following events:

- **`ready`** - Emitted when BeeBee is initialized and ready to use
- **`token`** - Emitted for each token during streaming (with the token string)
- **`response`** - Emitted when a complete response is generated (with the full response)
- **`error`** - Emitted when an error occurs (with the error object)

```javascript
const beebee = await createBeeBee();

beebee.on('ready', () => {
  console.log('BeeBee is ready!');
});

beebee.on('token', (token) => {
  process.stdout.write(token);
});

beebee.on('response', (fullResponse) => {
  console.log('Complete response:', fullResponse);
});

beebee.on('error', (error) => {
  console.error('Error:', error);
});
```

### `beebee.prompt(text, options)`

Generate a response for the given prompt. Emits `response` event when complete.

```javascript
const response = await beebee.prompt("Your prompt here", {
  temperature: 0.8,
  maxTokens: 512,
  includeSystemPrompt: true  // Default: true
});
```

### `beebee.promptStream(text, options, onToken)`

Generate a streaming response. Emits `token` events during streaming and `response` event when complete.

```javascript
await beebee.promptStream(
  "Tell me a story",
  { maxTokens: 300 },
  (token) => process.stdout.write(token)  // Optional callback
);
```

### `beebee.dispose()`

Clean up resources. Always call this when done.

## Examples

### Basic Usage

```bash
npm start
```

This runs the basic example in `examples/basic.js`.

### Streaming Example

```bash
node examples/streaming.js
```

See streaming responses in action.

### Event-Based Example

```bash
node examples/events.js
```

Demonstrates using BeeBee with event listeners for integration with beebee-ai.

## Model Information

Default model: `openhands-lm-1.5b-v0.1.i1-Q4_0.gguf`
- Location: `~/.local/share/nomic.ai/GPT4All/`
- Size: 1.5B parameters
- Quantization: Q4_0

## Architecture

```
beebee/
├── src/
│   ├── index.js      # Main BeeBee class
│   └── config.js     # Configuration management
├── examples/
│   ├── basic.js      # Basic usage examples
│   └── streaming.js  # Streaming examples
└── package.json
```

## Migration from Previous Architecture

If you're migrating from the old `beebee-ai → hop-learn → cale-gtp4all` chain:

1. Replace the entire chain with BeeBee
2. Update your imports to use BeeBee directly
3. The API is simpler and more direct

Old way:
```javascript
// Complex chain through multiple modules
import { BeeBeeAI } from "beebee-ai";
// ... complex setup
```

New way:
```javascript
// Direct and simple
import { createBeeBee } from "beebee";
const beebee = await createBeeBee();
```

## Requirements

- Node.js >= 18.0.0
- A GGUF format model file

## Testing

BeeBee uses Vitest for testing. The test suite includes unit tests for configuration validation and integration tests for the LLM functionality.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
test/
├── beebee.test.js      # Unit tests for BeeBee class and configuration
└── integration.test.js # Integration tests with mocked LLM operations
```

The tests include:
- Configuration validation tests
- Initialization and error handling tests
- Token handling tests (including numeric token conversion)
- Mocked integration tests for prompt and streaming functionality

## BentoBoxDS Integration

BeeBee is designed to integrate seamlessly with BentoBoxDS as an AI agent. It includes:

- **System Prompt**: Pre-configured to assist with BentoBoxDS tools, HealthCues, and HOP
- **Event-Based API**: EventEmitter interface for easy integration with beebee-ai
- **Streaming Support**: Token-by-token streaming for responsive chat UI

### System Prompt

BeeBee includes a built-in system prompt optimized for the BentoBoxDS health science agent. This provides context about:

- BeeBee's role as an AI assistant
- BentoBoxDS platform capabilities
- HealthCues and HOP (Health Orchestration Platform) integration
- Health science domain expertise

The system prompt is automatically included in all prompts unless explicitly disabled:

```javascript
// Use with system prompt (default)
await beebee.prompt("What is HealthCues?");

// Disable system prompt for specific prompts
await beebee.prompt("Hello", { includeSystemPrompt: false });
```

### Integration with beebee-ai Package

BeeBee's event-based API makes it easy to integrate with the beebee-ai package for BentoBoxDS communication:

```javascript
// Inside beebee-ai package
const beebee = await createBeeBee();

// Listen for events
beebee.on('ready', () => {
  // LLM is ready
});

beebee.on('token', (token) => {
  // Stream token to BentoBoxDS via websocket
  websocket.send(JSON.stringify({ type: 'token', data: token }));
});

beebee.on('response', (fullResponse) => {
  // Send complete response to BentoBoxDS
  websocket.send(JSON.stringify({ type: 'response', data: fullResponse }));
});

// Handle prompts from BentoBoxDS
websocket.on('message', async (message) => {
  const { prompt } = JSON.parse(message);
  await beebee.promptStream(prompt);
});
```

See `examples/beebee-ai-integration.js` for a complete integration example.

### Example Usage

```bash
# Run the integration example
node examples/beebee-ai-integration.js
```

## License

GPL-3.0
