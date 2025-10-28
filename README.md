# File Watcher Benchmark

A comprehensive benchmarking framework for comparing performance of file watching utilities across different scenarios and workloads.

## Overview

This framework provides:
- **Standardized test scenarios** simulating different repository structures (small repos, large monorepos, deep nesting, etc.)
- **Comprehensive metrics collection** including latency, CPU usage, memory consumption, and accuracy
- **Extensible watcher registry** for easily adding new file watching implementations
- **Multiple output formats** for analyzing and comparing results

## Features

### Test Scenarios

The framework includes several predefined scenarios:

- **small-repo**: ~100 files, shallow structure (typical small project)
- **medium-repo**: ~1,000 files, moderate nesting (typical application)
- **large-repo**: ~10,000 files, deep structure (monorepo simulation)
- **deep-nesting**: Files in very deep directory structures (20+ levels)
- **many-small-files**: 50,000+ small files (node_modules simulation)
- **large-files**: Large binary files (images, videos, archives)
- **mixed**: Varied file types and sizes

### Test Patterns

Test patterns define what operations to perform:

- **single-file-create**: Create a single file
- **single-file-modify**: Modify a single file
- **single-file-delete**: Delete a single file
- **burst-creates**: Create multiple files rapidly
- **burst-modifies**: Modify multiple files rapidly
- **mixed-operations**: Combination of creates, modifies, and deletes
- **large-repo-single-change**: Single change in a large repository
- **deep-nesting-change**: Change deep in directory structure

### Metrics Collected

- **Latency**: Average, min, max, P50, P95, P99
- **Event Detection**: Total events, detected changes, missed changes, false positives
- **Memory**: Average heap usage, peak usage, delta
- **CPU**: User time, system time, total
- **Accuracy**: Percentage of expected events detected
- **Errors**: Number of errors encountered

### Supported Watchers

Built-in watchers:
- **fs.watch**: Native Node.js recursive file watching
- **fs.watchFile**: Native Node.js polling-based watching
- **chokidar**: Popular npm package for file watching

Easy to add:
- **watchman**: Facebook's file watching service
- **turbowatch**: Modern file watcher
- **Go-based watchers**: fsnotify and others
- **Rust-based watchers**: notify and others

## Installation

```bash
git clone https://github.com/rothnic/file-watcher-benchmark.git
cd file-watcher-benchmark
npm install
```

### Optional Dependencies

Install optional watchers:

```bash
# Install chokidar
npm install chokidar

# Add other watchers as needed
```

## Quick Start

Run a quick benchmark comparison:

```bash
node examples/quickstart.js
```

This will:
1. Detect all available watchers on your system
2. Run a simple file modification test
3. Show a ranked comparison
4. Suggest next steps

For a quick test with all options:

```bash
# Run all watchers with a simple test
npm start -- --patterns single-file-modify
```

## Usage

Run all benchmarks with all available watchers:

```bash
npm start
```

Or use the command directly:

```bash
node index.js
```

### List Available Options

List all available watchers:

```bash
npm run list-watchers
# or
node index.js --list-watchers
```

List all test patterns:

```bash
npm run list-patterns
# or
node index.js --list-patterns
```

### Run Specific Tests

Test specific watchers:

```bash
node index.js --watchers fs.watch,chokidar
```

Run specific test patterns:

```bash
node index.js --patterns single-file-modify,burst-creates
```

Combine options:

```bash
node index.js --watchers chokidar --patterns large-repo-single-change
```

### Save Results

Save results to a file:

```bash
node index.js --output results.txt
```

Save as JSON:

```bash
node index.js --format json --output results.json
```

Save as CSV:

```bash
node index.js --format csv --output results.csv
```

## Adding New Watchers

The framework is designed to make adding new watchers easy. Here's how:

### 1. Create Watcher Implementation

Create a new file in `src/watchers/` that extends `WatcherInterface`:

```javascript
const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

class MyWatcher extends WatcherInterface {
  constructor() {
    super('my-watcher', 'Description of my watcher');
    this.metrics = new MetricsCollector();
  }

  async initialize() {
    // Initialize your watcher (install dependencies, setup, etc.)
  }

  async watch(path, options = {}) {
    this.metrics.start();
    
    // Start watching the path
    // Record events using: this.metrics.recordEvent(eventType, path)
    
    this.isWatching = true;
  }

  async stop() {
    this.metrics.stop();
    
    // Stop watching and cleanup
    
    this.isWatching = false;
  }

  getMetrics() {
    return this.metrics.getSummary();
  }

  resetMetrics() {
    this.metrics.reset();
  }

  async isAvailable() {
    // Check if watcher can run on current system
    return true;
  }
}

module.exports = MyWatcher;
```

### 2. Register the Watcher

Add your watcher to `index.js`:

```javascript
const MyWatcher = require('./watchers/my-watcher');
WatcherRegistry.register(MyWatcher);
```

### 3. Test It

```bash
node index.js --list-watchers  # Verify it's listed
node index.js --watchers my-watcher
```

## Adding External Tool Watchers

For watchers that are external tools (like watchman, written in other languages):

1. Create a wrapper that spawns the process
2. Parse the tool's output and record events
3. Handle process lifecycle (start, stop, errors)

Example structure:

```javascript
class ExternalToolWatcher extends WatcherInterface {
  async initialize() {
    // Check if tool is installed
    // e.g., check if 'watchman' command exists
  }

  async watch(path, options = {}) {
    // Spawn the external process
    // Parse stdout/stderr and record events
    // Handle process events
  }

  async stop() {
    // Kill the process gracefully
  }

  async isAvailable() {
    // Check if external tool is installed
    try {
      // e.g., exec('watchman version')
      return true;
    } catch {
      return false;
    }
  }
}
```

## Architecture

```
file-watcher-benchmark/
├── index.js                 # Main entry point and CLI
├── src/
│   ├── core/
│   │   ├── watcher-interface.js      # Base interface for all watchers
│   │   ├── watcher-registry.js       # Registry for managing watchers
│   │   ├── metrics-collector.js      # Metrics collection system
│   │   ├── benchmark-runner.js       # Orchestrates benchmark execution
│   │   └── results-reporter.js       # Formats and exports results
│   ├── watchers/
│   │   ├── fs-watch.js               # Native fs.watch implementation
│   │   ├── fs-watchfile.js           # Native fs.watchFile implementation
│   │   └── chokidar.js               # Chokidar implementation
│   ├── scenarios/
│   │   └── definitions.js            # Test scenario and pattern definitions
│   └── utils/
│       ├── repo-generator.js         # Generates test repositories
│       └── file-operations.js        # Performs file operations
├── benchmarks/              # Saved benchmark results
└── test-data/              # Temporary test data (auto-generated)
```

## Benchmark Factors

The framework considers these key factors:

1. **Repository Size**: Number of files and directories
2. **Directory Depth**: How deeply nested the file structure is
3. **File Types**: Different file extensions and types
4. **File Sizes**: From small (bytes) to large (megabytes)
5. **Operation Types**: Create, modify, delete, rename, bulk operations
6. **Operation Frequency**: Single operations vs. rapid bursts
7. **System Load**: Memory and CPU usage during watching

## Interpreting Results

### Latency
- **Lower is better**: Measures time to detect changes
- **P95/P99**: Important for understanding worst-case behavior

### Memory
- **Lower is better**: Especially important for large repositories
- **Delta**: Shows memory growth over time

### CPU
- **Lower is better**: Less CPU = less system overhead
- Important for background processes

### Accuracy
- **Higher is better**: Should be close to 100%
- Measures missed events and false positives

## Contributing

To add new watchers or test scenarios:

1. Follow the patterns in existing implementations
2. Extend `WatcherInterface` for new watchers
3. Add new scenarios to `src/scenarios/definitions.js`
4. Register new watchers in `index.js`
5. Test thoroughly with various patterns

## Roadmap

- [ ] Add watchman wrapper
- [ ] Add turbowatch wrapper  
- [ ] Add Go-based watcher examples (fsnotify)
- [ ] Add Rust-based watcher examples (notify)
- [ ] Add network file system tests
- [ ] Add Docker volume tests
- [ ] Add CI/CD integration examples
- [ ] Add historical result tracking
- [ ] Add web-based results viewer

## License

ISC
