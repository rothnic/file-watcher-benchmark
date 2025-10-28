const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

/**
 * Go fsnotify watcher
 * Uses Go's fsnotify library which provides cross-platform file system notifications
 */
class GoFsnotifyWatcher extends WatcherInterface {
  constructor() {
    super('go-fsnotify', 'Go fsnotify - High-performance cross-platform file watcher');
    this.metrics = new MetricsCollector();
    this.process = null;
  }

  async initialize() {
    // Check if Go binary exists
    const binaryPath = path.join(__dirname, '../../watchers/go-fsnotify/go-fsnotify');
    try {
      await fs.access(binaryPath);
    } catch {
      throw new Error('Go fsnotify binary not found. Build it with: cd watchers/go-fsnotify && go build');
    }
  }

  async watch(watchPath, options = {}) {
    this.metrics.start();

    const binaryPath = path.join(__dirname, '../../watchers/go-fsnotify/go-fsnotify');
    this.process = spawn(binaryPath, [watchPath]);

    let ready = false;

    this.process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      lines.forEach(line => {
        try {
          const event = JSON.parse(line);
          
          if (event.type === 'ready') {
            ready = true;
            return;
          }
          
          if (event.type === 'error') {
            this.metrics.recordError(new Error(event.message));
            return;
          }
          
          this.metrics.recordEvent(event.type, event.path, event.timestamp);
        } catch (error) {
          this.metrics.recordError(error);
        }
      });
    });

    this.process.stderr.on('data', (data) => {
      console.error('Go watcher error:', data.toString());
    });

    this.process.on('error', (error) => {
      this.metrics.recordError(error);
    });

    this.isWatching = true;

    this.memoryInterval = setInterval(() => {
      this.metrics.recordMemorySnapshot();
    }, 1000);

    // Wait for ready signal
    await new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (ready) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        resolve();
      }, 5000);
    });
  }

  async stop() {
    this.metrics.stop();

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    if (this.process) {
      this.process.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (this.process && !this.process.killed) {
        this.process.kill('SIGKILL');
      }
      
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
      await fs.access(binaryPath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = GoFsnotifyWatcher;
