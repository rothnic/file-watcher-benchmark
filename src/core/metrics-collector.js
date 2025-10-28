/**
 * Metrics collector for file watcher performance
 */
class MetricsCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.events = [];
    this.startTime = null;
    this.endTime = null;
    this.memorySnapshots = [];
    this.cpuSnapshots = [];
    this.detectedChanges = 0;
    this.missedChanges = 0;
    this.falsePositives = 0;
    this.errors = [];
  }

  /**
   * Start collecting metrics
   */
  start() {
    this.startTime = Date.now();
    this.recordMemorySnapshot();
  }

  /**
   * Stop collecting metrics
   */
  stop() {
    this.endTime = Date.now();
    this.recordMemorySnapshot();
  }

  /**
   * Record a file system event
   * @param {string} eventType - Type of event (add, change, unlink, etc.)
   * @param {string} path - Path affected
   * @param {number} timestamp - When event was detected
   */
  recordEvent(eventType, path, timestamp = Date.now()) {
    this.events.push({
      type: eventType,
      path,
      timestamp,
      latency: timestamp - this.startTime
    });
    this.detectedChanges++;
  }

  /**
   * Record a memory snapshot
   */
  recordMemorySnapshot() {
    const usage = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    });
  }

  /**
   * Record CPU usage
   */
  recordCPUSnapshot() {
    const usage = process.cpuUsage();
    this.cpuSnapshots.push({
      timestamp: Date.now(),
      user: usage.user,
      system: usage.system
    });
  }

  /**
   * Record an error
   * @param {Error|string} error
   */
  recordError(error) {
    this.errors.push({
      timestamp: Date.now(),
      error: error.toString()
    });
  }

  /**
   * Calculate and return summary metrics
   * @returns {Object}
   */
  getSummary() {
    const duration = this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime;
    
    // Calculate latencies
    const latencies = this.events.map(e => e.latency).filter(l => l >= 0);
    const avgLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    
    // Calculate memory stats
    const memoryStats = this.calculateMemoryStats();
    
    // Calculate CPU stats
    const cpuStats = this.calculateCPUStats();

    return {
      duration,
      events: {
        total: this.events.length,
        detected: this.detectedChanges,
        missed: this.missedChanges,
        falsePositives: this.falsePositives
      },
      latency: {
        avg: avgLatency,
        min: minLatency,
        max: maxLatency,
        p50: this.calculatePercentile(latencies, 50),
        p95: this.calculatePercentile(latencies, 95),
        p99: this.calculatePercentile(latencies, 99)
      },
      memory: memoryStats,
      cpu: cpuStats,
      errors: this.errors.length,
      accuracy: this.calculateAccuracy()
    };
  }

  /**
   * Calculate memory statistics
   * @returns {Object}
   */
  calculateMemoryStats() {
    if (this.memorySnapshots.length === 0) {
      return { avg: 0, peak: 0, delta: 0 };
    }

    const heapUsages = this.memorySnapshots.map(s => s.heapUsed);
    const avgHeap = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length;
    const peakHeap = Math.max(...heapUsages);
    const deltaHeap = heapUsages[heapUsages.length - 1] - heapUsages[0];

    return {
      avg: avgHeap,
      peak: peakHeap,
      delta: deltaHeap
    };
  }

  /**
   * Calculate CPU statistics
   * @returns {Object}
   */
  calculateCPUStats() {
    if (this.cpuSnapshots.length < 2) {
      return { user: 0, system: 0, total: 0 };
    }

    const first = this.cpuSnapshots[0];
    const last = this.cpuSnapshots[this.cpuSnapshots.length - 1];
    
    const userDelta = last.user - first.user;
    const systemDelta = last.system - first.system;

    return {
      user: userDelta,
      system: systemDelta,
      total: userDelta + systemDelta
    };
  }

  /**
   * Calculate percentile value
   * @param {Array<number>} values
   * @param {number} percentile
   * @returns {number}
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate accuracy (detected / expected)
   * @returns {number}
   */
  calculateAccuracy() {
    const expected = this.detectedChanges + this.missedChanges;
    if (expected === 0) return 1.0;
    return this.detectedChanges / expected;
  }

  /**
   * Get raw event data
   * @returns {Array}
   */
  getRawEvents() {
    return this.events;
  }
}

module.exports = MetricsCollector;
