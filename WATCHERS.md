# File Watcher Comparison

This document provides detailed information about each file watcher implementation, their features, performance characteristics, and ideal use cases.

## Available Watchers

### 1. fs.watch (Node.js Native)
**Status**: ✅ Built-in  
**Language**: JavaScript (Node.js C++ bindings)  
**Library**: Node.js core module

**Features**:
- Built into Node.js, no installation required
- Recursive watching on supported platforms (macOS, Windows)
- Uses native OS APIs (FSEvents on macOS, ReadDirectoryChangesW on Windows, inotify on Linux)
- Very low memory footprint

**Performance**:
- **Latency**: Very low (1-5ms typical)
- **Memory**: Minimal (~4-5 MB)
- **CPU**: Low overhead
- **Scalability**: Good for moderate number of files (<10,000)

**Pros**:
- No dependencies
- Fast event delivery
- Native performance

**Cons**:
- Limited recursive support on Linux
- Platform-specific behavior differences
- Less reliable on network file systems

**Best for**:
- Small to medium projects
- Local file systems
- When you want zero dependencies

---

### 2. fs.watchFile (Node.js Native)
**Status**: ✅ Built-in  
**Language**: JavaScript (Node.js polling)  
**Library**: Node.js core module

**Features**:
- Built into Node.js
- Uses polling (stat checking)
- Works on all platforms consistently
- Watches individual files, not directories

**Performance**:
- **Latency**: Higher due to polling interval (100-1000ms)
- **Memory**: Moderate (~5-8 MB for small sets)
- **CPU**: Higher due to continuous polling
- **Scalability**: Poor for large number of files

**Pros**:
- Extremely reliable
- Consistent cross-platform behavior
- Works on network file systems
- No native dependencies

**Cons**:
- High CPU usage with many files
- Slower change detection
- Doesn't detect all file system events

**Best for**:
- Network file systems
- When reliability > performance
- Watching specific critical files

---

### 3. chokidar (npm package)
**Status**: ✅ Available (requires `npm install chokidar`)  
**Language**: JavaScript  
**Library**: npm package wrapping native watchers

**Features**:
- Intelligent wrapper around fs.watch and fs.watchFile
- Automatically handles platform differences
- Filters out duplicate events
- Supports globs and ignore patterns
- Debouncing built-in

**Performance**:
- **Latency**: Low (5-15ms typical)
- **Memory**: Moderate (~6-12 MB)
- **CPU**: Low to moderate
- **Scalability**: Excellent (handles 50,000+ files)

**Pros**:
- Most popular Node.js watcher (100M+ downloads/month)
- Excellent cross-platform support
- Rich feature set
- Well-maintained
- Handles edge cases

**Cons**:
- Additional dependency
- Slightly higher memory than native
- Some overhead from abstraction layer

**Best for**:
- Production applications
- Cross-platform projects
- Build tools and bundlers (used by Webpack, Vite, etc.)
- When you need reliability AND features

---

### 4. go-fsnotify (Go Binary)
**Status**: ⚙️ Requires build  
**Language**: Go  
**Library**: github.com/fsnotify/fsnotify

**Features**:
- Pure Go implementation
- Cross-platform native watching
- Single binary, no runtime dependencies
- Uses platform-specific APIs efficiently

**Performance**:
- **Latency**: Very low (1-3ms typical)
- **Memory**: Very low (~2-4 MB including runtime)
- **CPU**: Minimal overhead
- **Scalability**: Excellent (designed for high loads)

**Pros**:
- Extremely efficient
- Small memory footprint
- Fast startup time
- Single compiled binary
- Used by major projects (Docker, Kubernetes)

**Cons**:
- Requires Go toolchain to build
- Need to compile for each platform
- Communication overhead with Node.js parent

**Best for**:
- High-performance requirements
- Large monorepos
- Microservices watching many files
- When memory is constrained

**Build**:
```bash
cd watchers/go-fsnotify
go build -o go-fsnotify main.go
```

---

### 5. rust-notify (Rust Binary)
**Status**: ⚙️ Requires build  
**Language**: Rust  
**Library**: notify crate

**Features**:
- High-performance Rust implementation
- Multiple backend options (inotify, FSEvents, etc.)
- Zero-cost abstractions
- Memory-safe native code

**Performance**:
- **Latency**: Extremely low (<1-2ms)
- **Memory**: Minimal (~1-3 MB)
- **CPU**: Negligible overhead
- **Scalability**: Excellent (handles massive file counts)

**Pros**:
- Best-in-class performance
- Lowest memory usage
- Memory safety guarantees
- No garbage collection pauses
- Growing ecosystem

**Cons**:
- Requires Rust toolchain to build
- Longer compilation times
- Communication overhead with Node.js

**Best for**:
- Maximum performance requirements
- Very large repositories (100,000+ files)
- Real-time systems
- Memory-constrained environments

**Build**:
```bash
cd watchers/rust-notify
cargo build --release
cp target/release/rust-notify .
```

---

## Performance Comparison Summary

| Watcher | Latency | Memory | CPU | Scalability | Reliability |
|---------|---------|---------|-----|-------------|-------------|
| fs.watch | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent | 🟡 Good | 🟡 Good |
| fs.watchFile | 🔴 Poor | 🟡 Good | 🔴 Poor | 🔴 Poor | ⚡ Excellent |
| chokidar | 🟢 Good | 🟢 Good | 🟢 Good | ⚡ Excellent | ⚡ Excellent |
| go-fsnotify | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent |
| rust-notify | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent | ⚡ Excellent |

---

## Use Case Recommendations

### Small Projects (<1,000 files)
**Recommendation**: `fs.watch` or `chokidar`
- Native performance sufficient
- Easy to set up
- No build step required

### Medium Projects (1,000-10,000 files)
**Recommendation**: `chokidar` or `go-fsnotify`
- Chokidar: Best Node.js integration, battle-tested
- go-fsnotify: Better performance if you can build

### Large Projects/Monorepos (10,000+ files)
**Recommendation**: `go-fsnotify` or `rust-notify`
- Superior memory efficiency
- Lower CPU overhead
- Proven at scale

### Network File Systems
**Recommendation**: `fs.watchFile` or `chokidar` with polling
- Native watchers unreliable on NFS
- Polling works consistently

### Multiple Independent Watch Tasks
**Recommendation**: Separate `go-fsnotify` or `rust-notify` processes
- Run one watcher per task
- Communicate via scripts/webhooks
- Better isolation and resource management
- Easier to scale horizontally

### Build Tools / Development Servers
**Recommendation**: `chokidar`
- Industry standard (Webpack, Vite, etc.)
- Great DX features (debouncing, filtering)
- Excellent documentation

---

## Technical Notes

### Platform-Specific Backends

Different watchers use different OS APIs:

**macOS**:
- FSEvents (fs.watch, chokidar, go-fsnotify, rust-notify)
- Most efficient and reliable

**Linux**:
- inotify (fs.watch, chokidar, go-fsnotify, rust-notify)
- Requires watches per directory
- Has system limits (fs.inotify.max_user_watches)

**Windows**:
- ReadDirectoryChangesW (fs.watch, chokidar, go-fsnotify, rust-notify)
- Good performance
- Some quirks with rapid changes

### When to Use Multiple Watchers

If you're watching files for different purposes, consider running separate watcher processes:

**Example**: Dev server + test runner + linter
```javascript
// Instead of one watcher handling all:
// Option A: One chokidar instance with complex logic
watcher.on('change', (path) => {
  if (path.endsWith('.js')) runLinter(path);
  if (path.endsWith('.test.js')) runTests(path);
  if (path.endsWith('.css')) reloadStyles(path);
});

// Option B: Separate optimized watchers
// - go-fsnotify → triggers build (C binary, fast)
// - rust-notify → triggers tests (Rust binary, isolated)
// - chokidar → dev server HMR (Node.js, integrated)
```

Benefits of separate watchers:
- Failures isolated
- Different performance requirements
- Easier to scale across machines
- Can use optimal tool for each task

### Build Dependencies

Most projects will use chokidar or native watchers. Binary watchers are opt-in for performance:

```json
{
  "scripts": {
    "build:watchers": "cd watchers/go-fsnotify && go build && cd ../rust-notify && cargo build --release",
    "postinstall": "npm run build:watchers || echo 'Binary watchers not built (optional)'"
  }
}
```

---

## Benchmark Methodology

Our benchmarks test:
- **Latency**: Time from file change to event detection
- **Memory**: Heap usage during watching
- **CPU**: Processor overhead
- **Accuracy**: % of events correctly detected
- **Scalability**: Performance with varying file counts

Test scenarios include:
- Single file modifications
- Burst operations (many rapid changes)
- Large repositories
- Deep directory nesting
- Various file types

See [README.md](README.md) for running benchmarks yourself.
