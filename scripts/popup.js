// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const editorView = document.getElementById('editor-view');
    const welcomeView = document.getElementById('welcome-view');
    const bibtexContent = document.getElementById('bibtex-content');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusMessage = document.getElementById('status-message');

    // Function to switch the view to the editor
    function showEditor(content) {
        bibtexContent.value = content;
        editorView.style.display = 'block';
        welcomeView.style.display = 'none';
    }

    // Function to switch the view to the welcome screen
    function showWelcome() {
        editorView.style.display = 'none';
        welcomeView.style.display = 'block';
    }

    // Check storage when the popup is first opened
    chrome.storage.local.get(['lastBibtex'], (result) => {
        if (result.lastBibtex) {
            showEditor(result.lastBibtex);
        } else {
            showWelcome();
        }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.lastBibtex) {
            // If the 'lastBibtex' value has changed, update the view.
            if (changes.lastBibtex.newValue) {
                // If new data is saved, show the editor.
                showEditor(changes.lastBibtex.newValue);
            } else {
                // If data is cleared, show the welcome screen.
                showWelcome();
            }
        }
    });

    function showStatus(message, duration = 2000) {
        statusMessage.textContent = message;
        setTimeout(() => {
            statusMessage.textContent = '';
        }, duration);
    }

    copyBtn.addEventListener('click', () => {
        if (bibtexContent.value) {
            navigator.clipboard.writeText(bibtexContent.value)
                .then(() => showStatus('Copied to clipboard!'))
                .catch(() => showStatus('Failed to copy.'));
        } else {
            showStatus('Nothing to copy!');
        }
    });

    clearBtn.addEventListener('click', () => {
        bibtexContent.value = '';
        // This will trigger the onChanged listener to show the welcome screen.
        chrome.storage.local.remove('lastBibtex');
    });

    // Save any manual edits back to storage.
    bibtexContent.addEventListener('input', () => {
        chrome.storage.local.set({ lastBibtex: bibtexContent.value });
    });
});
