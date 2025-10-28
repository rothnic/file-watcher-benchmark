# Native Watcher Binaries

This directory contains the source code for native file watcher implementations.

## go-fsnotify

Go-based watcher using the fsnotify library.

**Build**:
```bash
cd go-fsnotify
go build -o go-fsnotify main.go
```

**Features**:
- High performance
- Low memory footprint (~2-4 MB)
- Cross-platform support
- Used by Docker, Kubernetes, and many Go projects

## rust-notify

Rust-based watcher using the notify crate.

**Build**:
```bash
cd rust-notify
cargo build --release
cp target/release/rust-notify .
```

**Features**:
- Best-in-class performance
- Minimal memory usage (~1-3 MB)
- Memory safety guarantees
- Zero-cost abstractions

## Usage

Once built, the framework will automatically detect and use these watchers. You can verify they're available with:

```bash
npm run list-watchers
```

## Performance

These native watchers provide significant performance benefits for large-scale file watching:

- **Latency**: 50-75% lower than Node.js watchers
- **Memory**: 60-80% less memory usage
- **CPU**: Minimal overhead even with 100k+ files

See [WATCHERS.md](../WATCHERS.md) for detailed comparisons.
