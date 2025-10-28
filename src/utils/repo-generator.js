const fs = require('fs').promises;
const path = require('path');

/**
 * Generate test repository structure based on scenario
 */
class RepositoryGenerator {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  /**
   * Generate repository structure from scenario definition
   * @param {ScenarioDefinition} scenario
   */
  async generate(scenario) {
    const config = scenario.config;
    
    // Create base directory
    await fs.mkdir(this.baseDir, { recursive: true });

    // Generate directory structure
    const dirs = await this.generateDirectories(config);
    
    // Generate files
    await this.generateFiles(config, dirs);

    return {
      baseDir: this.baseDir,
      totalFiles: config.totalFiles,
      totalDirs: dirs.length
    };
  }

  /**
   * Generate directory structure
   * @param {Object} config
   * @returns {Array<string>} Array of directory paths
   */
  async generateDirectories(config) {
    const dirs = [this.baseDir];
    const targetDirs = config.directories || 10;

    for (let i = 0; i < targetDirs; i++) {
      const depth = Math.floor(Math.random() * config.maxDepth) + 1;
      let currentPath = this.baseDir;

      for (let d = 0; d < depth; d++) {
        const dirName = `dir_${i}_${d}_${this.randomString(4)}`;
        currentPath = path.join(currentPath, dirName);
      }

      dirs.push(currentPath);
      await fs.mkdir(currentPath, { recursive: true });
    }

    return dirs;
  }

  /**
   * Generate files
   * @param {Object} config
   * @param {Array<string>} dirs
   */
  async generateFiles(config, dirs) {
    const filesPerDir = Math.ceil(config.totalFiles / dirs.length);

    for (const dir of dirs) {
      const numFiles = Math.min(filesPerDir, config.totalFiles);
      
      for (let i = 0; i < numFiles; i++) {
        const ext = config.fileTypes[Math.floor(Math.random() * config.fileTypes.length)];
        const fileName = `file_${this.randomString(8)}${ext}`;
        const filePath = path.join(dir, fileName);
        
        const content = this.generateFileContent(config.avgFileSize);
        await fs.writeFile(filePath, content);
      }
    }
  }

  /**
   * Generate file content
   * @param {number} size - Target size in bytes
   * @returns {string}
   */
  generateFileContent(size) {
    const lines = Math.ceil(size / 80); // ~80 chars per line
    let content = '';
    
    for (let i = 0; i < lines; i++) {
      content += `// Line ${i}: ${this.randomString(60)}\n`;
    }
    
    return content;
  }

  /**
   * Generate random string
   * @param {number} length
   * @returns {string}
   */
  randomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up generated repository
   */
  async cleanup() {
    try {
      await fs.rm(this.baseDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error cleaning up ${this.baseDir}:`, error);
    }
  }
}

module.exports = RepositoryGenerator;
