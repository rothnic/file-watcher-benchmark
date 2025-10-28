const fs = require('fs');
const path = require('path');
const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

/**
 * Native Node.js fs.watch watcher
 */
class FSWatchWatcher extends WatcherInterface {
  constructor() {
    super('fs.watch', 'Native Node.js fs.watch (recursive)');
    this.watchers = [];
    this.metrics = new MetricsCollector();
  }

  async initialize() {
    // No initialization needed for native fs.watch
  }

  async watch(watchPath, options = {}) {
    this.metrics.start();

    try {
      // fs.watch with recursive option (works on Windows, macOS, Linux with limitations)
      const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          this.metrics.recordEvent(eventType, path.join(watchPath, filename));
        }
      });

      watcher.on('error', (error) => {
        this.metrics.recordError(error);
      });

      this.watchers.push(watcher);
      this.isWatching = true;

      // Record memory snapshot periodically
      this.memoryInterval = setInterval(() => {
        this.metrics.recordMemorySnapshot();
      }, 1000);

    } catch (error) {
      this.metrics.recordError(error);
      throw error;
    }
  }

  async stop() {
    this.metrics.stop();
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    for (const watcher of this.watchers) {
      watcher.close();
    }
    
    this.watchers = [];
    this.isWatching = false;
  }

  getMetrics() {
    return this.metrics.getSummary();
  }

  resetMetrics() {
    this.metrics.reset();
  }

  async isAvailable() {
    // fs.watch is always available in Node.js
    return true;
  }
}

module.exports = FSWatchWatcher;
