#!/usr/bin/env node

const WatcherRegistry = require('./src/core/watcher-registry');
const BenchmarkRunner = require('./src/core/benchmark-runner');
const ResultsReporter = require('./src/core/results-reporter');
const { testPatterns } = require('./src/scenarios/definitions');

// Register built-in watchers
const FSWatchWatcher = require('./src/watchers/fs-watch');
const FSWatchFileWatcher = require('./src/watchers/fs-watchfile');
const ChokidarWatcher = require('./src/watchers/chokidar');

WatcherRegistry.register(FSWatchWatcher);
WatcherRegistry.register(FSWatchFileWatcher);
WatcherRegistry.register(ChokidarWatcher);

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--list-watchers')) {
    await listWatchers();
    return;
  }

  if (args.includes('--list-patterns')) {
    listPatterns();
    return;
  }

  // Parse arguments
  const watcherNames = getArgValue(args, '--watchers') || 'all';
  const patternNames = getArgValue(args, '--patterns') || 'all';
  const outputFormat = getArgValue(args, '--format') || 'text';
  const outputFile = getArgValue(args, '--output');

  // Run benchmarks
  await runBenchmarks(watcherNames, patternNames, outputFormat, outputFile);
}

/**
 * Run benchmarks
 */
async function runBenchmarks(watcherNames, patternNames, outputFormat, outputFile) {
  console.log('File Watcher Benchmark\n');

  // Get watchers to test
  const watchers = await getWatchers(watcherNames);
  if (watchers.length === 0) {
    console.error('No available watchers to test');
    return;
  }

  console.log(`Testing ${watchers.length} watcher(s):`);
  watchers.forEach(w => console.log(`  - ${w.name}: ${w.description}`));
  console.log();

  // Get test patterns
  const patterns = getPatterns(patternNames);
  console.log(`Running ${patterns.length} test pattern(s):`);
  patterns.forEach(p => console.log(`  - ${p.name}: ${p.description}`));
  console.log();

  // Run benchmarks
  const runner = new BenchmarkRunner('./test-data');
  const results = await runner.runMultiple(watchers, patterns);

  // Display results
  console.log('\n' + ResultsReporter.generateTextReport(results));
  console.log(ResultsReporter.generateComparisonTable(results));

  // Save to file if requested
  if (outputFile) {
    await ResultsReporter.saveToFile(results, outputFile, outputFormat);
  }
}

/**
 * Get watchers based on argument
 */
async function getWatchers(watcherNames) {
  const available = await WatcherRegistry.getAvailable();
  
  if (watcherNames === 'all') {
    return available.map(w => WatcherRegistry.get(w.name));
  }

  const names = watcherNames.split(',').map(n => n.trim());
  const watchers = [];

  for (const name of names) {
    const watcher = WatcherRegistry.get(name);
    if (watcher && await watcher.isAvailable()) {
      watchers.push(watcher);
    } else {
      console.warn(`Warning: Watcher '${name}' is not available`);
    }
  }

  return watchers;
}

/**
 * Get test patterns based on argument
 */
function getPatterns(patternNames) {
  if (patternNames === 'all') {
    return Object.values(testPatterns);
  }

  const names = patternNames.split(',').map(n => n.trim());
  const patterns = [];

  for (const name of names) {
    const pattern = testPatterns[name.toUpperCase().replace(/-/g, '_')];
    if (pattern) {
      patterns.push(pattern);
    } else {
      console.warn(`Warning: Test pattern '${name}' not found`);
    }
  }

  return patterns.length > 0 ? patterns : [testPatterns.SINGLE_FILE_MODIFY];
}

/**
 * List available watchers
 */
async function listWatchers() {
  console.log('Available Watchers:\n');
  
  const all = WatcherRegistry.list();
  const available = await WatcherRegistry.getAvailable();
  const availableNames = new Set(available.map(w => w.name));

  for (const watcher of all) {
    const status = availableNames.has(watcher.name) ? '✓' : '✗';
    console.log(`  ${status} ${watcher.name}: ${watcher.description}`);
  }
  
  console.log('\n✓ = Available, ✗ = Not installed/unavailable');
}

/**
 * List available test patterns
 */
function listPatterns() {
  console.log('Available Test Patterns:\n');
  
  for (const [key, pattern] of Object.entries(testPatterns)) {
    console.log(`  - ${pattern.name}`);
    console.log(`    ${pattern.description}`);
    console.log(`    Scenario: ${pattern.scenario.name}`);
    console.log();
  }
}

/**
 * Get argument value
 */
function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return null;
  }
  return args[index + 1];
}

/**
 * Print help
 */
function printHelp() {
  console.log(`
File Watcher Benchmark

Usage:
  node index.js [options]

Options:
  --help, -h              Show this help message
  --list-watchers         List all available watchers
  --list-patterns         List all available test patterns
  --watchers <names>      Comma-separated list of watchers to test (default: all)
  --patterns <names>      Comma-separated list of test patterns to run (default: all)
  --format <format>       Output format: text, json, csv (default: text)
  --output <file>         Save results to file

Examples:
  node index.js
  node index.js --watchers fs.watch,chokidar --patterns single-file-modify
  node index.js --watchers all --patterns burst-creates --output results.txt
  node index.js --format json --output results.json
  `);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = {
  WatcherRegistry,
  BenchmarkRunner,
  ResultsReporter
};
