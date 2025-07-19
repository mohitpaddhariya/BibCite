/**
 * @file: background.js
 * @description: Handles background tasks for the BibCite extension, specifically fetching BibTeX content from URLs.
 * This script listens for messages from the content script and fetches the BibTeX data from the provided URL.
 * It then sends the fetched data back to the content script.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // This script now only handles fetching the BibTeX content.
    if (request.action === "fetchBibtex") {
        fetch(request.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network error: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                // Send a success response with the BibTeX data.
                sendResponse({ success: true, data: text });
            })
            .catch(error => {
                console.error("Background fetch failed:", error);
                // Send a failure response with the error message.
                sendResponse({ success: false, error: error.message });
            });

        // 'return true' is essential here. It tells Chrome that the
        // sendResponse function will be called asynchronously.
        return true;
    }
});
