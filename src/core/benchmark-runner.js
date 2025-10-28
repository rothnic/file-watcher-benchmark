const path = require('path');
const RepositoryGenerator = require('../utils/repo-generator');
const FileOperations = require('../utils/file-operations');

/**
 * Benchmark runner for file watchers
 */
class BenchmarkRunner {
  constructor(testDataDir = './test-data') {
    this.testDataDir = testDataDir;
    this.results = [];
  }

  /**
   * Run a benchmark test
   * @param {WatcherInterface} watcher
   * @param {TestPattern} testPattern
   * @returns {Promise<Object>}
   */
  async run(watcher, testPattern) {
    console.log(`\nRunning benchmark: ${testPattern.name}`);
    console.log(`Watcher: ${watcher.name}`);
    console.log(`Scenario: ${testPattern.scenario.name}`);

    const testDir = path.join(this.testDataDir, `test_${Date.now()}`);
    const generator = new RepositoryGenerator(testDir);
    
    try {
      // Generate test repository
      console.log('Generating test repository...');
      await generator.generate(testPattern.scenario);

      // Initialize watcher
      console.log('Initializing watcher...');
      await watcher.initialize();

      // Start watching
      console.log('Starting watcher...');
      await watcher.watch(testDir);

      // Warmup period
      console.log(`Warmup period: ${testPattern.config.warmupTime}ms...`);
      await this.sleep(testPattern.config.warmupTime);

      // Execute operations
      console.log('Executing operations...');
      const fileOps = new FileOperations(testDir);
      await this.executeOperations(fileOps, testPattern);

      // Verification period - wait for watcher to catch up
      console.log(`Verification period: ${testPattern.config.verificationTime}ms...`);
      await this.sleep(testPattern.config.verificationTime);

      // Stop watcher and collect metrics
      console.log('Stopping watcher and collecting metrics...');
      await watcher.stop();
      
      const metrics = watcher.getMetrics();
      const operationLog = fileOps.getOperationLog();

      const result = {
        watcher: watcher.name,
        testPattern: testPattern.name,
        scenario: testPattern.scenario.name,
        timestamp: new Date().toISOString(),
        metrics,
        operationLog,
        config: testPattern.config
      };

      this.results.push(result);
      
      // Cleanup
      console.log('Cleaning up...');
      await generator.cleanup();

      console.log('Benchmark complete!');
      return result;

    } catch (error) {
      console.error('Benchmark failed:', error);
      await generator.cleanup();
      throw error;
    }
  }

  /**
   * Execute file operations based on test pattern
   * @param {FileOperations} fileOps
   * @param {TestPattern} testPattern
   */
  async executeOperations(fileOps, testPattern) {
    const { operations, config } = testPattern;

    for (const operation of operations) {
      switch (operation) {
        case 'create':
          await fileOps.create(`test_file_${Date.now()}.txt`, 'test content');
          break;

        case 'modify':
          const fileToModify = await fileOps.getRandomFile();
          if (fileToModify) {
            await fileOps.modify(fileToModify);
          }
          break;

        case 'delete':
          const fileToDelete = await fileOps.getRandomFile();
          if (fileToDelete) {
            await fileOps.delete(fileToDelete);
          }
          break;

        case 'rename':
          const fileToRename = await fileOps.getRandomFile();
          if (fileToRename) {
            const newName = `renamed_${Date.now()}.txt`;
            await fileOps.rename(fileToRename, newName);
          }
          break;

        case 'bulk_create':
          const createCount = config.bulkCount || 10;
          await fileOps.bulkCreate(createCount);
          break;

        case 'bulk_modify':
          const modifyCount = config.bulkCount || 10;
          const filesToModify = await fileOps.getRandomFiles(modifyCount);
          await fileOps.bulkModify(filesToModify);
          break;

        case 'bulk_delete':
          const deleteCount = config.bulkCount || 10;
          const filesToDelete = await fileOps.getRandomFiles(deleteCount);
          await fileOps.bulkDelete(filesToDelete);
          break;
      }

      await this.sleep(config.operationDelay);
    }
  }

  /**
   * Run multiple benchmarks
   * @param {Array<WatcherInterface>} watchers
   * @param {Array<TestPattern>} testPatterns
   */
  async runMultiple(watchers, testPatterns) {
    const results = [];

    for (const watcher of watchers) {
      for (const testPattern of testPatterns) {
        try {
          const result = await this.run(watcher, testPattern);
          results.push(result);
        } catch (error) {
          console.error(`Failed to run ${watcher.name} on ${testPattern.name}:`, error);
          results.push({
            watcher: watcher.name,
            testPattern: testPattern.name,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all results
   */
  getResults() {
    return this.results;
  }

  /**
   * Clear results
   */
  clearResults() {
    this.results = [];
  }

  /**
   * Sleep utility
   * @param {number} ms
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BenchmarkRunner;
