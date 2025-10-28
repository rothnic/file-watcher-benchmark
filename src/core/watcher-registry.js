/**
 * Registry for file watchers
 * Allows easy registration and discovery of watchers
 */
class WatcherRegistry {
  constructor() {
    this.watchers = new Map();
  }

  /**
   * Register a watcher
   * @param {WatcherInterface} WatcherClass - Watcher class to register
   */
  register(WatcherClass) {
    const instance = new WatcherClass();
    this.watchers.set(instance.name, WatcherClass);
  }

  /**
   * Get a watcher by name
   * @param {string} name - Watcher name
   * @returns {WatcherInterface|null}
   */
  get(name) {
    const WatcherClass = this.watchers.get(name);
    return WatcherClass ? new WatcherClass() : null;
  }

  /**
   * Get all registered watchers
   * @returns {Array<Object>} Array of {name, description}
   */
  list() {
    return Array.from(this.watchers.entries()).map(([name, WatcherClass]) => {
      const instance = new WatcherClass();
      return {
        name: instance.name,
        description: instance.description
      };
    });
  }

  /**
   * Get available watchers (that can run on current system)
   * @returns {Promise<Array<Object>>}
   */
  async getAvailable() {
    const results = [];
    for (const [name, WatcherClass] of this.watchers.entries()) {
      const instance = new WatcherClass();
      if (await instance.isAvailable()) {
        results.push({
          name: instance.name,
          description: instance.description
        });
      }
    }
    return results;
  }
}

// Singleton instance
const registry = new WatcherRegistry();

module.exports = registry;
