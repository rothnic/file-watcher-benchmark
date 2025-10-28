# Adding a Custom Watcher - Example

This guide shows how to add a new file watcher to the benchmark framework.

## Example: Adding Watchman Support

Here's a complete example of adding Facebook's Watchman:

### Step 1: Create the Watcher Implementation

Create `src/watchers/watchman.js`:

```javascript
const { spawn } = require('child_process');
const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

class WatchmanWatcher extends WatcherInterface {
  constructor() {
    super('watchman', 'Facebook Watchman - fast file watching service');
    this.metrics = new MetricsCollector();
    this.process = null;
  }

  async initialize() {
    // Check if watchman is installed
    const isInstalled = await this.checkWatchmanInstalled();
    if (!isInstalled) {
      throw new Error('Watchman is not installed. Install from: https://facebook.github.io/watchman/');
    }
  }

  async checkWatchmanInstalled() {
    return new Promise((resolve) => {
      const proc = spawn('watchman', ['version']);
      proc.on('error', () => resolve(false));
      proc.on('exit', (code) => resolve(code === 0));
    });
  }

  async watch(path, options = {}) {
    this.metrics.start();
    this.watchPath = path;

    // Start watchman watch
    await this.executeCommand(['watch-project', path]);

    // Subscribe to changes
    const subscription = JSON.stringify([
      'subscribe',
      path,
      'benchmark-subscription',
      {
        expression: ['allof', ['type', 'f']],
        fields: ['name', 'size', 'mtime', 'exists']
      }
    ]);

    this.process = spawn('watchman', ['-j', '--server-encoding=json']);
    
    this.process.stdin.write(subscription + '\n');

    this.process.stdout.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.subscription === 'benchmark-subscription' && response.files) {
          response.files.forEach((file) => {
            this.metrics.recordEvent('change', file.name);
          });
        }
      } catch (error) {
        this.metrics.recordError(error);
      }
    });

    this.process.stderr.on('data', (data) => {
      console.error('Watchman error:', data.toString());
    });

    this.isWatching = true;

    // Record memory snapshots periodically
    this.memoryInterval = setInterval(() => {
      this.metrics.recordMemorySnapshot();
    }, 1000);
  }

  async executeCommand(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('watchman', args);
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('exit', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Watchman command failed with code ${code}`));
        }
      });
    });
  }

  async stop() {
    this.metrics.stop();

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    // Unwatch the directory
    if (this.watchPath) {
      await this.executeCommand(['watch-del', this.watchPath]).catch(() => {});
    }

    this.isWatching = false;
  }

  getMetrics() {
    return this.metrics.getSummary();
  }

  resetMetrics() {
    this.metrics.reset();
  }

  async isAvailable() {
    return await this.checkWatchmanInstalled();
  }
}

module.exports = WatchmanWatcher;
```

### Step 2: Register the Watcher

In `index.js`, add:

```javascript
// Add to imports
const WatchmanWatcher = require('./watchers/watchman');

// Add to registrations
WatcherRegistry.register(WatchmanWatcher);
```

### Step 3: Test It

```bash
# Check if it's detected
node index.js --list-watchers

# Run a test with it
node index.js --watchers watchman --patterns single-file-modify
```

## Example: Adding a Go-Based Watcher

For Go-based watchers using fsnotify:

### Step 1: Create a Go Wrapper

Create `watchers/go-fsnotify/main.go`:

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "os"
    "github.com/fsnotify/fsnotify"
)

type Event struct {
    Type string `json:"type"`
    Path string `json:"path"`
    Timestamp int64 `json:"timestamp"`
}

func main() {
    if len(os.Args) < 2 {
        log.Fatal("Usage: go-fsnotify <path>")
    }

    path := os.Args[1]

    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        log.Fatal(err)
    }
    defer watcher.Close()

    err = watcher.Add(path)
    if err != nil {
        log.Fatal(err)
    }

    for {
        select {
        case event := <-watcher.Events:
            e := Event{
                Type: event.Op.String(),
                Path: event.Name,
                Timestamp: time.Now().UnixNano() / 1000000,
            }
            json.NewEncoder(os.Stdout).Encode(e)
        case err := <-watcher.Errors:
            log.Println("error:", err)
        }
    }
}
```

### Step 2: Create Node.js Wrapper

Create `src/watchers/go-fsnotify.js`:

```javascript
const { spawn } = require('child_process');
const path = require('path');
const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

class GoFsnotifyWatcher extends WatcherInterface {
  constructor() {
    super('go-fsnotify', 'Go fsnotify wrapper');
    this.metrics = new MetricsCollector();
    this.process = null;
  }

  async initialize() {
    // Check if Go binary exists
    const binaryPath = path.join(__dirname, '../../watchers/go-fsnotify/go-fsnotify');
    try {
      await fs.promises.access(binaryPath);
    } catch {
      throw new Error('Go fsnotify binary not found. Run: cd watchers/go-fsnotify && go build');
    }
  }

  async watch(watchPath, options = {}) {
    this.metrics.start();

    const binaryPath = path.join(__dirname, '../../watchers/go-fsnotify/go-fsnotify');
    this.process = spawn(binaryPath, [watchPath]);

    this.process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => {
        try {
          const event = JSON.parse(line);
          this.metrics.recordEvent(event.type, event.path, event.timestamp);
        } catch (error) {
          this.metrics.recordError(error);
        }
      });
    });

    this.process.stderr.on('data', (data) => {
      console.error('Go watcher error:', data.toString());
    });

    this.isWatching = true;

    this.memoryInterval = setInterval(() => {
      this.metrics.recordMemorySnapshot();
    }, 1000);
  }

  async stop() {
    this.metrics.stop();

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.isWatching = false;
  }

  getMetrics() {
    return this.metrics.getSummary();
  }

  resetMetrics() {
    this.metrics.reset();
  }

  async isAvailable() {
    const binaryPath = path.join(__dirname, '../../watchers/go-fsnotify/go-fsnotify');
    try {
      await fs.promises.access(binaryPath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = GoFsnotifyWatcher;
```

## Tips for Adding Watchers

1. **Always extend WatcherInterface**: This ensures compatibility with the framework
2. **Use MetricsCollector**: Provides consistent metrics across all watchers
3. **Implement isAvailable()**: Allows graceful handling when dependencies aren't installed
4. **Handle errors gracefully**: Record errors using `metrics.recordError()`
5. **Clean up resources**: Properly close watchers and clear intervals in `stop()`
6. **Test thoroughly**: Run with different scenarios to ensure reliability

## Common Patterns

### Pattern 1: NPM Package Watcher
- Check if package is installed in `isAvailable()`
- Lazy-load the package in `initialize()`
- Use package's API to watch files
- Map package events to standard event types

### Pattern 2: External Tool Watcher  
- Check if tool is installed via `spawn()` or `exec()`
- Parse tool's output (JSON, text, etc.)
- Handle process lifecycle carefully
- Consider performance overhead of process communication

### Pattern 3: Custom Binary Watcher
- Build binary as part of setup
- Check binary exists in `isAvailable()`
- Use JSON for communication protocol
- Handle cross-platform differences

## Testing Your Watcher

```bash
# Quick test
node index.js --watchers your-watcher --patterns single-file-modify

# Comprehensive test
node index.js --watchers your-watcher --patterns all

# Compare with others
node index.js --watchers your-watcher,chokidar,fs.watch --patterns single-file-modify
```
