# Contributing to File Watcher Benchmark

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## How to Contribute

### Adding New Watchers

The most valuable contributions are new file watcher implementations. See [ADDING_WATCHERS.md](ADDING_WATCHERS.md) for detailed instructions.

Priority watchers to add:
- **watchman**: Facebook's file watching service
- **turbowatch**: Modern file watcher built on watchman
- **Go-based watchers**: fsnotify
- **Rust-based watchers**: notify
- **Platform-specific**: inotify (Linux), FSEvents (macOS), ReadDirectoryChangesW (Windows)

### Adding Test Scenarios

New test scenarios help simulate real-world use cases:

1. Edit `src/scenarios/definitions.js`
2. Add a new `ScenarioDefinition` to the `scenarios` object
3. Add corresponding `TestPattern` entries if needed
4. Test your scenario with existing watchers

### Improving Metrics

Suggestions for new metrics or improvements to existing ones:

1. Edit `src/core/metrics-collector.js`
2. Add new metric collection methods
3. Update the `getSummary()` method
4. Update `ResultsReporter` to display new metrics

### Bug Reports

When reporting bugs, include:
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Relevant log output

### Feature Requests

Feature requests are welcome! Please:
- Check if it's already been requested
- Explain the use case
- Describe the expected behavior

## Development Setup

```bash
# Clone the repository
git clone https://github.com/rothnic/file-watcher-benchmark.git
cd file-watcher-benchmark

# Install dependencies
npm install

# Run tests
npm start -- --watchers all --patterns single-file-modify
```

## Code Style

- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code structure

## Testing Your Changes

Before submitting a PR:

1. Test with multiple watchers
2. Test with multiple scenarios
3. Verify output formats (text, JSON, CSV)
4. Check that documentation is updated

```bash
# Test with all watchers
node index.js --watchers all --patterns single-file-modify

# Test output formats
node index.js --format json --output test.json
node index.js --format csv --output test.csv
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-watcher`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### PR Guidelines

- Provide a clear description of changes
- Reference any related issues
- Include example output if adding a watcher
- Update documentation as needed

## Project Structure

```
src/
  core/           # Framework core (don't modify unless necessary)
  watchers/       # Watcher implementations (add new watchers here)
  scenarios/      # Test scenarios (add new scenarios here)
  utils/          # Utility functions
```

## Questions?

Open an issue for questions or discussion!

## License

By contributing, you agree that your contributions will be licensed under the ISC License.
