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
- **Server Mode**: HTTP and WebSocket endpoints for real-time communication
- **Streaming Support**: Token-by-token streaming for responsive chat UI

### Starting the Server

```bash
# Install dependencies
npm install

# Start the BeeBee server
npm run server

# Or run in development mode with auto-reload
npm run dev:server
```

The server provides:
- HTTP endpoint: `http://localhost:3000/chat` (non-streaming)
- HTTP SSE endpoint: `http://localhost:3000/chat/stream` (streaming)
- WebSocket endpoint: `ws://localhost:3000` (bidirectional streaming)

### Client Example

```bash
# Run the example client
npm run client
```

### API Usage

#### HTTP Request (Non-streaming)
```javascript
const response = await fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is BentoBoxDS?',
    options: { temperature: 0.7 }
  })
});
const data = await response.json();
console.log(data.response);
```

#### WebSocket (Streaming)
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'token') {
    process.stdout.write(msg.token);
  }
});

ws.send(JSON.stringify({
  type: 'stream',
  message: 'Tell me about HealthCues'
}));
```

### Server Configuration

```javascript
const config = {
  port: 3000,
  beebee: {
    temperature: 0.7,
    maxTokens: 512,
    // System prompt is pre-configured for BentoBoxDS
  }
};
```

## License

GPL-3.0
