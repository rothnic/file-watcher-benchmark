const WatcherInterface = require('../core/watcher-interface');
const MetricsCollector = require('../core/metrics-collector');

/**
 * Chokidar file watcher
 */
class ChokidarWatcher extends WatcherInterface {
  constructor() {
    super('chokidar', 'Chokidar - popular file watching library');
    this.watcher = null;
    this.metrics = new MetricsCollector();
  }

  async initialize() {
    // Chokidar will be lazy-loaded when needed
    try {
      this.chokidar = require('chokidar');
    } catch (error) {
      throw new Error('chokidar is not installed. Run: npm install chokidar');
    }
  }

  async watch(watchPath, options = {}) {
    if (!this.chokidar) {
      await this.initialize();
    }

    this.metrics.start();

    const watchOptions = {
      ignoreInitial: true,
      persistent: true,
      ...options
    };

    try {
      this.watcher = this.chokidar.watch(watchPath, watchOptions);

      this.watcher
        .on('add', (path) => this.metrics.recordEvent('add', path))
        .on('change', (path) => this.metrics.recordEvent('change', path))
        .on('unlink', (path) => this.metrics.recordEvent('unlink', path))
        .on('addDir', (path) => this.metrics.recordEvent('addDir', path))
        .on('unlinkDir', (path) => this.metrics.recordEvent('unlinkDir', path))
        .on('error', (error) => this.metrics.recordError(error));

      this.isWatching = true;

      // Record memory snapshot periodically
      this.memoryInterval = setInterval(() => {
        this.metrics.recordMemorySnapshot();
      }, 1000);

      // Wait for initial scan to complete
      await new Promise((resolve) => {
        this.watcher.on('ready', resolve);
      });

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

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
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
    try {
      require.resolve('chokidar');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ChokidarWatcher;
