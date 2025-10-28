/**
 * Base interface for all file watchers
 * All watchers must implement these methods
 */
class WatcherInterface {
  constructor(name, description) {
    if (new.target === WatcherInterface) {
      throw new TypeError('Cannot construct WatcherInterface instances directly');
    }
    this.name = name;
    this.description = description;
    this.isWatching = false;
  }

  /**
   * Initialize the watcher (install dependencies, setup, etc.)
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented');
  }

  /**
   * Start watching a directory
   * @param {string} path - Directory to watch
   * @param {Object} options - Watcher-specific options
   * @returns {Promise<void>}
   */
  async watch(path, options = {}) {
    throw new Error('watch() must be implemented');
  }

  /**
   * Stop watching
   * @returns {Promise<void>}
   */
  async stop() {
    throw new Error('stop() must be implemented');
  }

  /**
   * Get collected metrics
   * @returns {Object} Metrics object with various measurements
   */
  getMetrics() {
    throw new Error('getMetrics() must be implemented');
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    throw new Error('resetMetrics() must be implemented');
  }

  /**
   * Check if watcher is available on current system
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return true;
  }
}

module.exports = WatcherInterface;
