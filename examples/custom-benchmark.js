/**
 * Example: Using the benchmark framework programmatically
 * 
 * This shows how to use the framework from code instead of the CLI
 */

const { WatcherRegistry, BenchmarkRunner, ResultsReporter } = require('../index.js');
const { scenarios, TestPattern, operations } = require('../src/scenarios/definitions');

async function runCustomBenchmark() {
  console.log('Running custom benchmark example...\n');

  // Get watchers
  const fsWatch = WatcherRegistry.get('fs.watch');
  const chokidar = WatcherRegistry.get('chokidar');

  // Create a custom test pattern
  const customPattern = new TestPattern(
    'custom-test',
    'Custom test: 10 rapid file creations',
    scenarios.SMALL_REPO,
    [operations.BULK_CREATE],
    {
      warmupTime: 1000,
      operationDelay: 50,
      verificationTime: 2000,
      bulkCount: 10
    }
  );

  // Run benchmarks
  const runner = new BenchmarkRunner('./test-data');
  
  const watchers = [fsWatch];
  if (chokidar && await chokidar.isAvailable()) {
    watchers.push(chokidar);
  }

  const results = await runner.runMultiple(watchers, [customPattern]);

  // Display results
  console.log('\n' + ResultsReporter.generateTextReport(results));
  console.log(ResultsReporter.generateComparisonTable(results));

  // Save as JSON
  await ResultsReporter.saveToFile(results, './benchmarks/custom-results.json', 'json');
  
  console.log('\nCustom benchmark complete!');
}

// Run the example
if (require.main === module) {
  runCustomBenchmark().catch(error => {
    console.error('Error running custom benchmark:', error);
    process.exit(1);
  });
}

module.exports = { runCustomBenchmark };
