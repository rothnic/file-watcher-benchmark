const fs = require('fs').promises;
const path = require('path');

/**
 * Format and report benchmark results
 */
class ResultsReporter {
  /**
   * Generate a text report
   * @param {Array<Object>} results
   * @returns {string}
   */
  static generateTextReport(results) {
    let report = '='.repeat(80) + '\n';
    report += 'FILE WATCHER BENCHMARK RESULTS\n';
    report += '='.repeat(80) + '\n\n';

    for (const result of results) {
      if (result.error) {
        report += this.formatError(result);
        continue;
      }

      report += this.formatResult(result);
      report += '\n' + '-'.repeat(80) + '\n\n';
    }

    return report;
  }

  /**
   * Format a single result
   * @param {Object} result
   * @returns {string}
   */
  static formatResult(result) {
    let output = '';
    
    output += `Watcher: ${result.watcher}\n`;
    output += `Test Pattern: ${result.testPattern}\n`;
    output += `Scenario: ${result.scenario}\n`;
    output += `Timestamp: ${result.timestamp}\n\n`;

    const m = result.metrics;

    output += 'PERFORMANCE METRICS:\n';
    output += `  Duration: ${m.duration}ms\n`;
    output += `  Events Detected: ${m.events.detected}\n`;
    output += `  Events Missed: ${m.events.missed}\n`;
    output += `  False Positives: ${m.events.falsePositives}\n`;
    output += `  Accuracy: ${(m.accuracy * 100).toFixed(2)}%\n`;
    output += `  Errors: ${m.errors}\n\n`;

    output += 'LATENCY (ms):\n';
    output += `  Average: ${m.latency.avg.toFixed(2)}\n`;
    output += `  Min: ${m.latency.min.toFixed(2)}\n`;
    output += `  Max: ${m.latency.max.toFixed(2)}\n`;
    output += `  P50: ${m.latency.p50.toFixed(2)}\n`;
    output += `  P95: ${m.latency.p95.toFixed(2)}\n`;
    output += `  P99: ${m.latency.p99.toFixed(2)}\n\n`;

    output += 'MEMORY (bytes):\n';
    output += `  Average Heap: ${this.formatBytes(m.memory.avg)}\n`;
    output += `  Peak Heap: ${this.formatBytes(m.memory.peak)}\n`;
    output += `  Delta: ${this.formatBytes(m.memory.delta)}\n\n`;

    output += 'CPU (microseconds):\n';
    output += `  User: ${m.cpu.user}\n`;
    output += `  System: ${m.cpu.system}\n`;
    output += `  Total: ${m.cpu.total}\n`;

    return output;
  }

  /**
   * Format error result
   * @param {Object} result
   * @returns {string}
   */
  static formatError(result) {
    let output = '';
    output += `Watcher: ${result.watcher}\n`;
    output += `Test Pattern: ${result.testPattern}\n`;
    output += `ERROR: ${result.error}\n`;
    output += `Timestamp: ${result.timestamp}\n\n`;
    return output;
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes
   * @returns {string}
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate JSON report
   * @param {Array<Object>} results
   * @returns {string}
   */
  static generateJSONReport(results) {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Generate CSV report
   * @param {Array<Object>} results
   * @returns {string}
   */
  static generateCSVReport(results) {
    const headers = [
      'Watcher',
      'Test Pattern',
      'Scenario',
      'Duration (ms)',
      'Events Detected',
      'Avg Latency (ms)',
      'P95 Latency (ms)',
      'P99 Latency (ms)',
      'Avg Memory (MB)',
      'Peak Memory (MB)',
      'CPU Total (μs)',
      'Accuracy (%)',
      'Errors'
    ];

    let csv = headers.join(',') + '\n';

    for (const result of results) {
      if (result.error) {
        csv += `${result.watcher},${result.testPattern},ERROR,,,,,,,,,\n`;
        continue;
      }

      const m = result.metrics;
      const row = [
        result.watcher,
        result.testPattern,
        result.scenario,
        m.duration,
        m.events.detected,
        m.latency.avg.toFixed(2),
        m.latency.p95.toFixed(2),
        m.latency.p99.toFixed(2),
        (m.memory.avg / 1024 / 1024).toFixed(2),
        (m.memory.peak / 1024 / 1024).toFixed(2),
        m.cpu.total,
        (m.accuracy * 100).toFixed(2),
        m.errors
      ];

      csv += row.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Generate comparison table
   * @param {Array<Object>} results
   * @returns {string}
   */
  static generateComparisonTable(results) {
    // Group by test pattern
    const grouped = {};
    
    for (const result of results) {
      if (result.error) continue;
      
      if (!grouped[result.testPattern]) {
        grouped[result.testPattern] = [];
      }
      grouped[result.testPattern].push(result);
    }

    let table = '\n='.repeat(80) + '\n';
    table += 'COMPARISON TABLE\n';
    table += '='.repeat(80) + '\n\n';

    for (const [testPattern, results] of Object.entries(grouped)) {
      table += `Test Pattern: ${testPattern}\n\n`;
      
      // Sort by average latency
      const sorted = results.sort((a, b) => a.metrics.latency.avg - b.metrics.latency.avg);
      
      table += '| Watcher | Avg Latency | P95 Latency | Events | Memory | Accuracy |\n';
      table += '|---------|-------------|-------------|--------|--------|----------|\n';
      
      for (const result of sorted) {
        const m = result.metrics;
        table += `| ${result.watcher.padEnd(7)} `;
        table += `| ${m.latency.avg.toFixed(2).padEnd(11)} `;
        table += `| ${m.latency.p95.toFixed(2).padEnd(11)} `;
        table += `| ${String(m.events.detected).padEnd(6)} `;
        table += `| ${this.formatBytes(m.memory.peak).padEnd(6)} `;
        table += `| ${(m.accuracy * 100).toFixed(1).padEnd(8)}% |\n`;
      }
      
      table += '\n';
    }

    return table;
  }

  /**
   * Save results to file
   * @param {Array<Object>} results
   * @param {string} outputPath
   * @param {string} format - 'text', 'json', or 'csv'
   */
  static async saveToFile(results, outputPath, format = 'text') {
    let content;

    switch (format) {
      case 'json':
        content = this.generateJSONReport(results);
        break;
      case 'csv':
        content = this.generateCSVReport(results);
        break;
      case 'text':
      default:
        content = this.generateTextReport(results);
        content += this.generateComparisonTable(results);
        break;
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);
    
    console.log(`\nResults saved to: ${outputPath}`);
  }
}

module.exports = ResultsReporter;
