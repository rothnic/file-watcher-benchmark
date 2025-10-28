// Load and display benchmark results
async function loadResults() {
    try {
        const response = await fetch('results/latest.json');
        
        // Check if the file exists
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const results = await response.json();
        
        // Check if results is empty or not an array
        if (!Array.isArray(results) || results.length === 0) {
            showNoResults();
            return;
        }
        
        // Load timestamp
        const timestampResponse = await fetch('results/timestamp.txt');
        if (timestampResponse.ok) {
            const timestamp = await timestampResponse.text();
            document.getElementById('timestamp').textContent = `Last updated: ${new Date(timestamp.trim()).toLocaleString()}`;
        } else {
            document.getElementById('timestamp').textContent = 'Waiting for first benchmark run...';
        }
        
        displayResults(results);
    } catch (error) {
        console.error('Error loading results:', error);
        showNoResults();
    }
}

function showNoResults() {
    document.getElementById('content').innerHTML = `
        <div class="info-box">
            <h2 style="color: #667eea;">⏳ No Benchmark Results Yet</h2>
            <p>Benchmarks haven't run yet. Results will appear here after:</p>
            <ul style="margin: 1rem 0; padding-left: 2rem;">
                <li>The first commit to the main branch, or</li>
                <li>A PR is opened (for PR previews)</li>
            </ul>
            <p>The GitHub Actions workflow will automatically run benchmarks and update this page.</p>
            <p style="margin-top: 1rem;"><strong>Note:</strong> This is a PR preview. Results will be generated when the workflow completes.</p>
        </div>
    `;
    document.getElementById('timestamp').textContent = 'Waiting for first benchmark run...';
}

function displayResults(results) {
    const content = document.getElementById('content');
    
    // Group results by test pattern
    const grouped = {};
    results.forEach(result => {
        if (result.error) return;
        if (!grouped[result.testPattern]) {
            grouped[result.testPattern] = [];
        }
        grouped[result.testPattern].push(result);
    });
    
    let html = '';
    
    // Create watcher cards
    html += '<h2 style="margin-bottom: 1.5rem;">Watcher Overview</h2>';
    html += '<div class="watcher-grid">';
    
    const watcherInfo = {
        'fs.watch': 'Native Node.js recursive file watcher. Built-in, fast, but limited platform support.',
        'fs.watchFile': 'Native Node.js polling-based watcher. Reliable but higher CPU usage.',
        'chokidar': 'Popular npm package. Wraps native watchers with better cross-platform support.',
        'go-fsnotify': 'Go-based watcher using fsnotify. High performance with minimal overhead.',
        'rust-notify': 'Rust-based watcher using notify. Extremely efficient native performance.'
    };
    
    const uniqueWatchers = [...new Set(results.map(r => r.watcher))];
    uniqueWatchers.forEach(watcher => {
        const watcherResults = results.filter(r => r.watcher === watcher);
        if (watcherResults.length === 0) return;
        
        const avgLatency = watcherResults.reduce((sum, r) => sum + (r.metrics?.latency?.avg || 0), 0) / watcherResults.length;
        const avgMemory = watcherResults.reduce((sum, r) => sum + (r.metrics?.memory?.peak || 0), 0) / watcherResults.length;
        
        html += `
            <div class="watcher-card">
                <div class="watcher-name">${watcher}</div>
                <div class="watcher-desc">${watcherInfo[watcher] || 'File watching utility'}</div>
                <div class="metric">
                    <span class="metric-label">Avg Latency</span>
                    <span class="metric-value">${avgLatency.toFixed(2)}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Avg Memory</span>
                    <span class="metric-value">${(avgMemory / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tests Run</span>
                    <span class="metric-value">${watcherResults.length}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    // Create charts for each test pattern
    for (const [pattern, patternResults] of Object.entries(grouped)) {
        html += `
            <div class="chart-container">
                <h2 class="chart-title">Test: ${pattern}</h2>
                <canvas id="chart-${pattern.replace(/[^a-z0-9]/gi, '-')}"></canvas>
            </div>
        `;
    }
    
    // Create comparison table
    html += '<div class="comparison-table">';
    html += '<h2 class="chart-title">Detailed Comparison</h2>';
    html += '<table>';
    html += '<thead><tr>';
    html += '<th>Watcher</th>';
    html += '<th>Test Pattern</th>';
    html += '<th>Avg Latency (ms)</th>';
    html += '<th>P95 Latency (ms)</th>';
    html += '<th>Peak Memory (MB)</th>';
    html += '<th>Events Detected</th>';
    html += '<th>Accuracy</th>';
    html += '</tr></thead>';
    html += '<tbody>';
    
    results.forEach(result => {
        if (result.error) return;
        const m = result.metrics;
        html += '<tr>';
        html += `<td>${result.watcher}</td>`;
        html += `<td>${result.testPattern}</td>`;
        html += `<td>${m.latency.avg.toFixed(2)}</td>`;
        html += `<td>${m.latency.p95.toFixed(2)}</td>`;
        html += `<td>${(m.memory.peak / 1024 / 1024).toFixed(2)}</td>`;
        html += `<td>${m.events.detected}</td>`;
        html += `<td>${(m.accuracy * 100).toFixed(1)}%</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '</div>';
    
    content.innerHTML = html;
    
    // Create charts
    for (const [pattern, patternResults] of Object.entries(grouped)) {
        createChart(pattern, patternResults);
    }
}

function createChart(pattern, results) {
    const canvasId = `chart-${pattern.replace(/[^a-z0-9]/gi, '-')}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const labels = results.map(r => r.watcher);
    const latencies = results.map(r => r.metrics.latency.avg);
    const memories = results.map(r => r.metrics.memory.peak / 1024 / 1024);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Avg Latency (ms)',
                    data: latencies,
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Peak Memory (MB)',
                    data: memories,
                    backgroundColor: 'rgba(118, 75, 162, 0.6)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Latency (ms)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Memory (MB)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            }
        }
    });
}

// Load results when page loads
loadResults();
