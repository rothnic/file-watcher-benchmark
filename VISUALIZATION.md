# GitHub Pages Results Visualization

The GitHub Pages site will display benchmark results with:

## Features

### 1. Interactive Dashboard
- **Header**: Beautiful gradient header with title "📊 File Watcher Benchmark Results"
- **Last Updated**: Timestamp showing when benchmarks were last run
- **Overview Cards**: Grid of cards showing each watcher with:
  - Watcher name and description
  - Average latency across all tests
  - Average memory usage
  - Number of tests run

### 2. Visual Charts
For each test pattern, an interactive chart showing:
- Bar chart comparing latency across watchers
- Line overlay showing memory usage
- Hover tooltips with detailed metrics

### 3. Detailed Comparison Table
Sortable table with columns:
- Watcher name
- Test pattern
- Avg Latency (ms)
- P95 Latency (ms)
- Peak Memory (MB)
- Events Detected
- Accuracy (%)

### 4. Automatic Updates
- GitHub Actions workflow runs on every push
- Builds all watchers (Node.js, Go, Rust)
- Runs standardized benchmarks
- Generates JSON results
- Deploys to GitHub Pages
- Page automatically reloads latest data

## Example Results Display

```
📊 File Watcher Benchmark Results
Last updated: 2025-10-28 16:31:55 UTC

┌──────────────────┬──────────────┬──────────────┬───────────┐
│ Watcher          │ Avg Latency  │ Peak Memory  │ Tests Run │
├──────────────────┼──────────────┼──────────────┼───────────┤
│ fs.watch         │ 1013.50ms    │ 4.97 MB      │ 3         │
│ go-fsnotify      │ 1030.00ms    │ 5.09 MB      │ 3         │
│ chokidar         │ 1034.00ms    │ 6.74 MB      │ 3         │
│ rust-notify      │ 1002.00ms    │ 3.21 MB      │ 3         │
└──────────────────┴──────────────┴──────────────┴───────────┘
```

## Access

Once GitHub Pages is enabled for the repository:
- URL: https://rothnic.github.io/file-watcher-benchmark/
- Updates automatically on every commit to main
- Mobile responsive design
- No setup required - just enable GitHub Pages in repo settings

## Watcher Information

The page includes descriptions for each watcher:

- **fs.watch**: Native Node.js recursive file watcher. Built-in, fast, but limited platform support.
- **fs.watchFile**: Native Node.js polling-based watcher. Reliable but higher CPU usage.
- **chokidar**: Popular npm package. Wraps native watchers with better cross-platform support.
- **go-fsnotify**: Go-based watcher using fsnotify. High performance with minimal overhead.
- **rust-notify**: Rust-based watcher using notify. Extremely efficient native performance.

Each card shows key metrics and links to detailed documentation in WATCHERS.md.
