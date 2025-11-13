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

### `beebee.prompt(text, options)`

Generate a response for the given prompt.

```javascript
const response = await beebee.prompt("Your prompt here", {
  temperature: 0.8,
  maxTokens: 512
});
```

### `beebee.promptStream(text, options, onToken)`

Generate a streaming response.

```javascript
await beebee.promptStream(
  "Tell me a story",
  { maxTokens: 300 },
  (token) => process.stdout.write(token)
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

## License

GPL-3.0
