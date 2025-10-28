const fs = require('fs');
const path = require('path');
const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

/**
 * Native Node.js fs.watchFile watcher (polling-based)
 */
class FSWatchFileWatcher extends WatcherInterface {
  constructor() {
    super('fs.watchFile', 'Native Node.js fs.watchFile (polling-based)');
    this.watchedFiles = new Map();
    this.metrics = new MetricsCollector();
  }

  async initialize() {
    // No initialization needed
  }

  async watch(watchPath, options = {}) {
    this.metrics.start();
    this.watchPath = watchPath;

    try {
      // fs.watchFile doesn't support directory watching, so we need to watch individual files
      await this.watchDirectory(watchPath);

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

  async watchDirectory(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.watchDirectory(fullPath);
      } else {
        this.watchFile(fullPath);
      }
    }
  }

  watchFile(filePath) {
    if (this.watchedFiles.has(filePath)) {
      return;
    }

    fs.watchFile(filePath, { interval: 100 }, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        this.metrics.recordEvent('change', filePath);
      }
    });

    this.watchedFiles.set(filePath, true);
  }

  async stop() {
    this.metrics.stop();
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    for (const filePath of this.watchedFiles.keys()) {
      fs.unwatchFile(filePath);
    }
    
    this.watchedFiles.clear();
    this.isWatching = false;
  }

  getMetrics() {
    return this.metrics.getSummary();
  }

  resetMetrics() {
    this.metrics.reset();
  }

  async isAvailable() {
    // fs.watchFile is always available in Node.js
    return true;
  }
}

module.exports = FSWatchFileWatcher;
