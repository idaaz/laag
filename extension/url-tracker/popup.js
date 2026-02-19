document.addEventListener('DOMContentLoaded', async () => {
    const userIdInput = document.getElementById('userId');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const historyList = document.getElementById('historyList');

    // Load existing settings
    const { userId, history = [], lastSync, lastError } = await chrome.storage.local.get(['userId', 'history', 'lastSync', 'lastError']);

    if (userId) {
        userIdInput.value = userId;
        updateStatus(true, lastSync, lastError);
    }

    renderHistory(history);

    saveBtn.addEventListener('click', async () => {
        const newUserId = userIdInput.value.trim();
        if (newUserId) {
            await chrome.storage.local.set({ userId: newUserId });
            updateStatus(true);
            saveBtn.textContent = "Saved!";
            setTimeout(() => { saveBtn.textContent = "Save & Connect"; }, 2000);
        }
    });

    function updateStatus(connected, lastSync, lastError) {
        if (lastError) {
            statusDiv.textContent = "Error: " + lastError;
            statusDiv.className = "status disconnected";
            return;
        }

        if (connected) {
            const syncTime = lastSync ? new Date(lastSync).toLocaleTimeString() : "Never";
            statusDiv.textContent = `Connected (Last sync: ${syncTime})`;
            statusDiv.className = "status connected";
        } else {
            statusDiv.textContent = "Not Configured";
            statusDiv.className = "status disconnected";
        }
    }

    function renderHistory(history) {
        if (history.length === 0) return;

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-title">${item.title}</div>
                <div class="history-url">${item.url}</div>
            </div>
        `).join('');
    }
});
