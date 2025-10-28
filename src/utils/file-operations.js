const fs = require('fs').promises;
const path = require('path');

/**
 * Perform file operations for testing watchers
 */
class FileOperations {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.operationLog = [];
  }

  /**
   * Create a new file
   * @param {string} relativePath
   * @param {string} content
   */
  async create(relativePath, content = 'test content') {
    const fullPath = path.join(this.baseDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    
    this.logOperation('create', relativePath);
    return fullPath;
  }

  /**
   * Modify an existing file
   * @param {string} relativePath
   * @param {string} content
   */
  async modify(relativePath, content = null) {
    const fullPath = path.join(this.baseDir, relativePath);
    
    if (!content) {
      // Append timestamp to existing content
      const existing = await fs.readFile(fullPath, 'utf8');
      content = existing + `\n// Modified at ${Date.now()}`;
    }
    
    await fs.writeFile(fullPath, content);
    this.logOperation('modify', relativePath);
    return fullPath;
  }

  /**
   * Delete a file
   * @param {string} relativePath
   */
  async delete(relativePath) {
    const fullPath = path.join(this.baseDir, relativePath);
    await fs.unlink(fullPath);
    this.logOperation('delete', relativePath);
    return fullPath;
  }

  /**
   * Rename a file
   * @param {string} oldPath
   * @param {string} newPath
   */
  async rename(oldPath, newPath) {
    const fullOldPath = path.join(this.baseDir, oldPath);
    const fullNewPath = path.join(this.baseDir, newPath);
    await fs.rename(fullOldPath, fullNewPath);
    this.logOperation('rename', `${oldPath} -> ${newPath}`);
    return fullNewPath;
  }

  /**
   * Create multiple files
   * @param {number} count
   * @param {string} prefix
   */
  async bulkCreate(count, prefix = 'bulk') {
    const operations = [];
    
    for (let i = 0; i < count; i++) {
      const relativePath = `${prefix}_${i}_${Date.now()}.txt`;
      operations.push(this.create(relativePath, `Bulk file ${i}`));
    }
    
    return Promise.all(operations);
  }

  /**
   * Modify multiple files
   * @param {Array<string>} paths
   */
  async bulkModify(paths) {
    const operations = paths.map(p => this.modify(p));
    return Promise.all(operations);
  }

  /**
   * Delete multiple files
   * @param {Array<string>} paths
   */
  async bulkDelete(paths) {
    const operations = paths.map(p => this.delete(p));
    return Promise.all(operations);
  }

  /**
   * Get a random file from the directory
   * @returns {Promise<string|null>}
   */
  async getRandomFile() {
    const files = await this.listFiles(this.baseDir);
    if (files.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * files.length);
    return path.relative(this.baseDir, files[randomIndex]);
  }

  /**
   * Get random files
   * @param {number} count
   * @returns {Promise<Array<string>>}
   */
  async getRandomFiles(count) {
    const files = await this.listFiles(this.baseDir);
    const shuffled = files.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, files.length))
      .map(f => path.relative(this.baseDir, f));
  }

  /**
   * List all files recursively
   * @param {string} dir
   * @returns {Promise<Array<string>>}
   */
  async listFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await this.listFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Log an operation
   * @param {string} type
   * @param {string} details
   */
  logOperation(type, details) {
    this.operationLog.push({
      type,
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Get operation log
   * @returns {Array}
   */
  getOperationLog() {
    return this.operationLog;
  }

  /**
   * Clear operation log
   */
  clearOperationLog() {
    this.operationLog = [];
  }
}

module.exports = FileOperations;
