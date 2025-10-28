/**
 * Test scenario definitions
 * Each scenario represents a different type of repository structure
 */
class ScenarioDefinition {
  constructor(name, description, config) {
    this.name = name;
    this.description = description;
    this.config = config;
  }
}

/**
 * Predefined test scenarios
 */
const scenarios = {
  SMALL_REPO: new ScenarioDefinition(
    'small-repo',
    'Small repository with ~100 files, shallow structure',
    {
      totalFiles: 100,
      maxDepth: 3,
      fileTypes: ['.js', '.json', '.md', '.txt'],
      avgFileSize: 1024, // 1KB
      directories: 10
    }
  ),

  MEDIUM_REPO: new ScenarioDefinition(
    'medium-repo',
    'Medium repository with ~1,000 files, moderate nesting',
    {
      totalFiles: 1000,
      maxDepth: 5,
      fileTypes: ['.js', '.ts', '.json', '.md', '.txt', '.css', '.html'],
      avgFileSize: 5120, // 5KB
      directories: 50
    }
  ),

  LARGE_REPO: new ScenarioDefinition(
    'large-repo',
    'Large repository with ~10,000 files, typical monorepo',
    {
      totalFiles: 10000,
      maxDepth: 8,
      fileTypes: ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.css', '.scss', '.html'],
      avgFileSize: 10240, // 10KB
      directories: 500
    }
  ),

  DEEP_NESTING: new ScenarioDefinition(
    'deep-nesting',
    'Repository with very deep directory nesting (20+ levels)',
    {
      totalFiles: 500,
      maxDepth: 25,
      fileTypes: ['.js', '.json', '.md'],
      avgFileSize: 2048,
      directories: 100
    }
  ),

  MANY_SMALL_FILES: new ScenarioDefinition(
    'many-small-files',
    'Many small files (like node_modules)',
    {
      totalFiles: 50000,
      maxDepth: 10,
      fileTypes: ['.js', '.json', '.d.ts'],
      avgFileSize: 512, // 512 bytes
      directories: 5000
    }
  ),

  LARGE_FILES: new ScenarioDefinition(
    'large-files',
    'Repository with large files (images, videos, etc.)',
    {
      totalFiles: 50,
      maxDepth: 3,
      fileTypes: ['.jpg', '.png', '.mp4', '.zip', '.pdf'],
      avgFileSize: 1048576, // 1MB
      directories: 5
    }
  ),

  MIXED: new ScenarioDefinition(
    'mixed',
    'Mixed repository with varied file types and sizes',
    {
      totalFiles: 5000,
      maxDepth: 10,
      fileTypes: ['.js', '.ts', '.json', '.md', '.txt', '.css', '.html', '.jpg', '.png'],
      avgFileSize: 20480, // 20KB
      directories: 200,
      mixed: true
    }
  )
};

/**
 * File change operations for benchmarking
 */
const operations = {
  CREATE: 'create',
  MODIFY: 'modify',
  DELETE: 'delete',
  RENAME: 'rename',
  BULK_CREATE: 'bulk_create',
  BULK_MODIFY: 'bulk_modify',
  BULK_DELETE: 'bulk_delete'
};

/**
 * Test patterns - combinations of scenarios and operations
 */
class TestPattern {
  constructor(name, description, scenario, operations, config = {}) {
    this.name = name;
    this.description = description;
    this.scenario = scenario;
    this.operations = operations;
    this.config = {
      warmupTime: 1000, // ms to wait before starting
      operationDelay: 100, // ms between operations
      verificationTime: 2000, // ms to wait for watcher to catch up
      ...config
    };
  }
}

/**
 * Predefined test patterns
 */
const testPatterns = {
  SINGLE_FILE_CREATE: new TestPattern(
    'single-file-create',
    'Create a single file',
    scenarios.SMALL_REPO,
    [operations.CREATE]
  ),

  SINGLE_FILE_MODIFY: new TestPattern(
    'single-file-modify',
    'Modify a single file',
    scenarios.SMALL_REPO,
    [operations.MODIFY]
  ),

  SINGLE_FILE_DELETE: new TestPattern(
    'single-file-delete',
    'Delete a single file',
    scenarios.SMALL_REPO,
    [operations.DELETE]
  ),

  BURST_CREATES: new TestPattern(
    'burst-creates',
    'Create multiple files in quick succession',
    scenarios.MEDIUM_REPO,
    [operations.BULK_CREATE],
    { operationDelay: 10, bulkCount: 50 }
  ),

  BURST_MODIFIES: new TestPattern(
    'burst-modifies',
    'Modify multiple files in quick succession',
    scenarios.MEDIUM_REPO,
    [operations.BULK_MODIFY],
    { operationDelay: 10, bulkCount: 50 }
  ),

  MIXED_OPERATIONS: new TestPattern(
    'mixed-operations',
    'Mix of creates, modifies, and deletes',
    scenarios.MEDIUM_REPO,
    [operations.CREATE, operations.MODIFY, operations.DELETE],
    { operationDelay: 50 }
  ),

  LARGE_REPO_SINGLE_CHANGE: new TestPattern(
    'large-repo-single-change',
    'Single file change in large repository',
    scenarios.LARGE_REPO,
    [operations.MODIFY]
  ),

  DEEP_NESTING_CHANGE: new TestPattern(
    'deep-nesting-change',
    'File change deep in directory structure',
    scenarios.DEEP_NESTING,
    [operations.MODIFY]
  )
};

module.exports = {
  ScenarioDefinition,
  scenarios,
  operations,
  TestPattern,
  testPatterns
};
