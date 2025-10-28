# CI/CD and GitHub Pages Setup

This document explains how the continuous integration and GitHub Pages deployment works for this project.

## Overview

The benchmark framework uses GitHub Actions to automatically run benchmarks and deploy results to GitHub Pages. There are two deployment targets:

1. **Main Site** (`/`): Updated when changes are pushed to `main` or `master` branch
2. **PR Previews** (`/pr-{number}/`): Created for each Pull Request

## Workflow Files

### `benchmark.yml`

Main workflow that runs on every push and pull request:

**Triggers:**
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches
- Manual workflow dispatch

**Steps:**
1. Setup environments (Node.js, Go, Rust)
2. Install dependencies
3. Build native watchers (Go and Rust)
4. Run benchmarks with all available watchers
5. Generate results pages
6. Upload artifacts for review
7. Deploy to GitHub Pages:
   - **Main branch**: Deploys to root directory
   - **PRs**: Deploys to `pr-{number}/` subdirectory
8. Comment on PR with preview link (PRs only)

### `cleanup-pr-preview.yml`

Cleanup workflow that runs when PRs are closed:

**Triggers:**
- Pull request closed (merged or abandoned)

**Steps:**
1. Checkout the `gh-pages` branch
2. Remove the `pr-{number}/` directory
3. Commit and push the cleanup

## PR Preview System

### How It Works

When you open a Pull Request:

1. **Benchmarks Run**: The workflow automatically runs all benchmarks
2. **Results Deploy**: Results are deployed to `https://rothnic.github.io/file-watcher-benchmark/pr-{number}/`
3. **Comment Posted**: A bot comments on the PR with:
   - Direct link to preview results
   - Summary of tests run
   - List of watchers tested
   - Timestamp of last update
4. **Updates**: Each new push to the PR updates the preview
5. **Cleanup**: When PR is merged/closed, the preview is automatically removed

### Example PR Comment

```markdown
## 📊 Benchmark Results Preview

Your benchmark results are ready for review!

🔗 **[View Results](https://rothnic.github.io/file-watcher-benchmark/pr-123/)**

### Quick Summary
The benchmark ran the following tests:
- `single-file-modify`: Tests single file modification detection
- `burst-creates`: Tests rapid file creation (50 files)

**Watchers tested:**
- fs.watch (Node.js native)
- fs.watchFile (Node.js polling)
- chokidar (npm package)
- go-fsnotify (Go binary)
- rust-notify (Rust binary - if available)

Results will be automatically cleaned up after this PR is merged.
```

## GitHub Pages Setup

To enable this feature in your fork:

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
3. Click **Save**

The `gh-pages` branch is automatically created and managed by the workflow.

## Directory Structure on gh-pages Branch

```
gh-pages/
├── index.html              # Main results page
├── results.js              # JavaScript for visualization
├── results/
│   ├── latest.json        # Latest benchmark data
│   └── timestamp.txt      # Last update time
├── pr-123/                # PR #123 preview
│   ├── index.html
│   ├── results.js
│   └── results/
│       ├── latest.json
│       └── timestamp.txt
├── pr-456/                # PR #456 preview
│   └── ...
└── pr-789/                # PR #789 preview
    └── ...
```

## Benefits

### For Maintainers
- Review performance impact before merging
- Compare PR results with main branch
- Catch performance regressions early
- No manual benchmark running needed

### For Contributors
- See results of your changes immediately
- Verify watchers work correctly
- Compare different approaches
- Share results with reviewers

## Best Practices

### Running Benchmarks Locally

Before pushing, test locally:

```bash
# Run quick benchmark
npm run quickstart

# Run specific tests
node index.js --watchers all --patterns single-file-modify,burst-creates
```

### Interpreting CI Results

The CI runs a subset of benchmarks for speed:
- **Patterns tested**: `single-file-modify`, `burst-creates`
- **All available watchers**: Includes Node.js, Go, and Rust (if built)

For comprehensive benchmarks, run locally with more patterns:

```bash
node index.js --watchers all --patterns all
```

### Performance Considerations

The CI workflow:
- Builds Go and Rust watchers from source
- Runs on Ubuntu latest
- Uses standardized test scenarios
- Results are comparable across PRs

Note: Results may vary from local runs due to CI environment differences.

## Troubleshooting

### Preview Not Deploying

If PR preview doesn't deploy:

1. Check workflow run in **Actions** tab
2. Verify GitHub Pages is enabled
3. Check that `gh-pages` branch exists
4. Ensure workflow has `contents: write` permission

### Comment Not Posted

If bot doesn't comment:

1. Check workflow permissions include `issues: write`
2. Verify PR is from same repository (not a fork)
3. Check Actions logs for errors

### Preview Not Cleaning Up

If preview directories remain after PR closure:

1. Check `cleanup-pr-preview.yml` workflow ran
2. Verify workflow has `contents: write` permission
3. Manually remove directory if needed:
   ```bash
   git checkout gh-pages
   git rm -rf pr-{number}
   git commit -m "Clean up PR preview"
   git push
   ```

## Customization

### Change Benchmark Tests

Edit `.github/workflows/benchmark.yml`, line 60:

```yaml
node index.js --watchers all --patterns single-file-modify,burst-creates,mixed-operations
```

### Disable PR Previews

Remove or comment out the "Deploy to GitHub Pages (PR Preview)" step in `benchmark.yml`.

### Change Preview URL Pattern

Modify `destination_dir` in the PR deploy step:

```yaml
destination_dir: preview/pr-${{ github.event.number }}
```

This changes URLs to `https://rothnic.github.io/file-watcher-benchmark/preview/pr-123/`

## Security

- Workflows use `GITHUB_TOKEN` (automatically provided)
- No additional secrets required
- PR previews only deploy from PRs in the same repository
- External forks require approval for first-time contributors

## Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)
