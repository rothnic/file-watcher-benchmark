#!/usr/bin/env node

/**
 * Generate results page from benchmark data
 * This script processes the latest.json file and ensures it's formatted correctly
 */

const fs = require('fs').promises;
const path = require('path');

async function generateResultsPage() {
  console.log('Generating results page...');
  
  const resultsPath = path.join(__dirname, '../docs/results/latest.json');
  
  try {
    // Read the results file
    const data = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(data);
    
    console.log(`Loaded ${results.length} benchmark results`);
    
    // Validate results structure
    results.forEach((result, index) => {
      if (!result.watcher || !result.testPattern) {
        console.warn(`Warning: Result ${index} missing watcher or testPattern`);
      }
    });
    
    // Write back formatted JSON
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('Results page generated successfully!');
    console.log(`Results available at: docs/index.html`);
    
  } catch (error) {
    console.error('Error generating results page:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  generateResultsPage();
}

module.exports = { generateResultsPage };
