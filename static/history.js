// ============================================
// HISTORY MANAGEMENT SYSTEM
// Save as: static/history.js
// ============================================

let historyData = [];
let currentFilter = 'all';

// Initialize history when switching to history screen
function initializeHistory() {
    loadHistory();
    updateStatistics();
}

// Load history from backend
async function loadHistory() {
    try {
        const typeParam = currentFilter !== 'all' ? `&type=${currentFilter}` : '';
        const response = await fetch(`/get_history?limit=100${typeParam}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            historyData = data.history;
            displayHistory(historyData);
        } else {
            console.error('Failed to load history');
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Display history entries
function displayHistory(history) {
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    
    if (!historyList) return;
    
    historyCount.textContent = history.length;
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; color: var(--muted-lavender); padding: 40px;">
                <i class='bx bx-history' style="font-size: 48px; opacity: 0.3;"></i>
                <p>No history yet. Start converting to see your history here!</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = history.map(entry => createHistoryEntryHTML(entry)).join('');
    historyList.innerHTML = historyHTML;
}

// Create HTML for a single history entry
function createHistoryEntryHTML(entry) {
    const typeColors = {
        'asl-to-text': { bg: '#e0e7ff', text: '#4338ca', icon: 'bx-video' },
        'lip-reading': { bg: '#dbeafe', text: '#1e40af', icon: 'bx-face' },
        'text-to-asl': { bg: '#fce7f3', text: '#be185d', icon: 'bx-text' },
        'voice-to-asl': { bg: '#d1fae5', text: '#047857', icon: 'bx-microphone' }
    };
    
    const typeInfo = typeColors[entry.conversion_type] || { bg: '#f3f4f6', text: '#6b7280', icon: 'bx-info-circle' };
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const confidence = entry.confidence ? `${(entry.confidence * 100).toFixed(1)}%` : 'N/A';
    
    return `
        <div class="history-entry">
            <div class="history-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="history-type" style="background: ${typeInfo.bg}; color: ${typeInfo.text};">
                        <i class='bx ${typeInfo.icon}'></i>
                        ${formatTypeName(entry.conversion_type)}
                    </span>
                    <span class="history-timestamp">${timestamp}</span>
                </div>
                <div class="history-actions">
                    <button class="history-btn copy-btn" onclick="copyToClipboard('${escapeHtml(entry.output_text)}')">
                        <i class='bx bx-copy'></i> Copy
                    </button>
                    <button class="history-btn delete-btn" onclick="deleteHistoryEntry(${entry.id})">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
            
            <div class="history-content">
                <div class="history-input">
                    <div class="history-label">Input</div>
                    <div class="history-text">${entry.input_text || 'Camera/Microphone Input'}</div>
                </div>
                <div class="history-output">
                    <div class="history-label">Output</div>
                    <div class="history-text">${entry.output_text || 'No output'}</div>
                </div>
            </div>
            
            <div class="history-meta">
                <span><i class='bx bx-bar-chart'></i> Confidence: ${confidence}</span>
                <span><i class='bx bx-chip'></i> Method: ${entry.method || 'Unknown'}</span>
                ${entry.duration ? `<span><i class='bx bx-time'></i> ${entry.duration.toFixed(2)}s</span>` : ''}
            </div>
        </div>
    `;
}

// Format type name for display
function formatTypeName(type) {
    const names = {
        'asl-to-text': 'ASL to Text',
        'lip-reading': 'Lip Reading',
        'text-to-asl': 'Text to ASL',
        'voice-to-asl': 'Voice to ASL'
    };
    return names[type] || type;
}

// Update statistics display
async function updateStatistics() {
    try {
        const response = await fetch('/get_statistics');
        const data = await response.json();
        
        if (data.status === 'success') {
            const stats = data.statistics;
            
            document.getElementById('totalConversions').textContent = stats.total_conversions || 0;
            document.getElementById('aslToTextCount').textContent = stats.by_type['asl-to-text'] || 0;
            document.getElementById('lipReadingCount').textContent = stats.by_type['lip-reading'] || 0;
            document.getElementById('avgConfidence').textContent = 
                `${(stats.average_confidence * 100).toFixed(1)}%`;
        }
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Filter history by type
function filterHistory() {
    const filterSelect = document.getElementById('typeFilter');
    currentFilter = filterSelect.value;
    loadHistory();
}

// Refresh history
function refreshHistory() {
    loadHistory();
    updateStatistics();
}

// Delete a single history entry
async function deleteHistoryEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete_history/${entryId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            loadHistory();
            updateStatistics();
        } else {
            alert('Failed to delete entry');
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry');
    }
}

// Clear all history
async function clearAllHistory() {
    if (!confirm('Are you sure you want to clear ALL history? This cannot be undone!')) {
        return;
    }
    
    try {
        const response = await fetch('/clear_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: currentFilter !== 'all' ? currentFilter : null })
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            loadHistory();
            updateStatistics();
        } else {
            alert('Failed to clear history');
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Error clearing history');
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    // Unescape HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    const decodedText = textarea.value;
    
    navigator.clipboard.writeText(decodedText).then(() => {
        // Show temporary success message
        const msg = document.createElement('div');
        msg.textContent = 'Copied to clipboard!';
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Escape HTML for safe display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, '&apos;');
}

// Save history entry (called from other modules)
async function saveToHistory(type, input, output, confidence = 0, method = '', duration = 0, metadata = {}) {
    try {
        const response = await fetch('/save_history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                input: input,
                output: output,
                confidence: confidence,
                method: method,
                duration: duration,
                metadata: metadata
            })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            console.log('✅ Saved to history:', type);
        }
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

// Export functions for use in other modules
window.historyModule = {
    saveToHistory,
    initializeHistory,
    refreshHistory
};

// Auto-load when history screen is shown
document.addEventListener('DOMContentLoaded', function() {
    // Check if on history screen
    const historyScreen = document.getElementById('history-screen');
    if (historyScreen && historyScreen.classList.contains('active')) {
        initializeHistory();
    }
});