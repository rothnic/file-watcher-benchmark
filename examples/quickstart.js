#!/usr/bin/env node

/**
 * Quick Start - Run a simple benchmark comparison
 * 
 * This runs a basic comparison of all available watchers
 * using the single-file-modify test pattern.
 */

const { WatcherRegistry, BenchmarkRunner, ResultsReporter } = require('../index.js');
const { testPatterns } = require('../src/scenarios/definitions');

async function quickStart() {
  console.log('='.repeat(60));
  console.log('FILE WATCHER BENCHMARK - QUICK START');
  console.log('='.repeat(60));
  console.log();

  // Get all available watchers
  const availableWatchers = await WatcherRegistry.getAvailable();
  
  if (availableWatchers.length === 0) {
    console.error('No watchers available!');
    process.exit(1);
  }

  console.log(`Found ${availableWatchers.length} available watcher(s):`);
  availableWatchers.forEach(w => {
    console.log(`  ✓ ${w.name}`);
  });
  console.log();

  // Get watcher instances
  const watchers = availableWatchers.map(w => WatcherRegistry.get(w.name));

  // Use single-file-modify as a quick test
  const pattern = testPatterns.SINGLE_FILE_MODIFY;

  console.log(`Running quick test: ${pattern.name}`);
  console.log(`Scenario: ${pattern.scenario.name} (${pattern.scenario.description})`);
  console.log();

  // Run benchmark
  const runner = new BenchmarkRunner('./test-data');
  const results = await runner.runMultiple(watchers, [pattern]);

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60) + '\n');

  // Sort by latency
  const sorted = results
    .filter(r => !r.error)
    .sort((a, b) => a.metrics.latency.avg - b.metrics.latency.avg);

  console.log('Ranking by Average Latency (lower is better):\n');
  sorted.forEach((result, index) => {
    const m = result.metrics;
    console.log(`${index + 1}. ${result.watcher}`);
    console.log(`   Avg Latency: ${m.latency.avg.toFixed(2)}ms`);
    console.log(`   Peak Memory: ${(m.memory.peak / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Events Detected: ${m.events.detected}`);
    console.log();
  });

  console.log('='.repeat(60));
  console.log('NEXT STEPS:');
  console.log('='.repeat(60));
  console.log();
  console.log('1. Run more comprehensive tests:');
  console.log('   node index.js --watchers all --patterns all');
  console.log();
  console.log('2. Compare specific watchers:');
  console.log('   node index.js --watchers fs.watch,chokidar');
  console.log();
  console.log('3. Save results to file:');
  console.log('   node index.js --output results.txt');
  console.log();
  console.log('4. See all options:');
  console.log('   node index.js --help');
  console.log();
}

if (require.main === module) {
  quickStart().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { quickStart };
