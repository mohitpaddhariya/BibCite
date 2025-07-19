/**
* @file content.js
* This script adds a "BibTeX" button that messages a background script to
* fetch the BibTeX content and stores it for the popup.
*/

function addBibtexButtonToResult(resultContainer) {
  const citeLink = resultContainer.querySelector("a.gs_or_cit");
  if (!citeLink) return;

  const buttonContainer = citeLink.parentElement;
  if (!buttonContainer || buttonContainer.querySelector(".direct-bibtex-btn")) return;

  const bibtexBtn = document.createElement("a");
  bibtexBtn.href = "#";
  bibtexBtn.textContent = "BibTeX";
  bibtexBtn.classList.add("direct-bibtex-btn");
  bibtexBtn.style.marginLeft = "10px";
  bibtexBtn.style.cursor = "pointer";

  bibtexBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const originalText = bibtexBtn.textContent;
    bibtexBtn.textContent = "Saving...";

    const cid = resultContainer.dataset.cid;
    const citeUrl = `https://scholar.google.com/scholar?q=info:${cid}:scholar.google.com/&output=cite`;

    fetch(citeUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok`);
        return response.text();
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const bibtexLinkInPopup = doc.querySelector('a[href*="scholar.bib"]');

        if (bibtexLinkInPopup) {
          const correctBibtexUrl = bibtexLinkInPopup.href;
          chrome.runtime.sendMessage({ action: "fetchBibtex", url: correctBibtexUrl }, (response) => {
            const resetButton = (text, delay = 2000) => {
              bibtexBtn.textContent = text;
              setTimeout(() => { bibtexBtn.textContent = originalText; }, delay);
            };

            if (response && response.success) {
              // Store the fetched BibTeX data. The popup will react to this change.
              chrome.storage.local.set({ lastBibtex: response.data }, () => {
                resetButton("Copied to clipboard!");
              });
            } else {
              console.error("BibTeX Extension: Failed to fetch content.", response ? response.error : "No response");
              resetButton("Error!");
            }
          });
        } else {
          console.error("BibTeX Extension: Could not find the BibTeX link.");
          bibtexBtn.textContent = "Error!";
          setTimeout(() => { bibtexBtn.textContent = originalText; }, 2000);
        }
      })
      .catch(error => {
        console.error("BibTeX Extension: Failed to fetch citation content.", error);
        bibtexBtn.textContent = "Error!";
        setTimeout(() => { bibtexBtn.textContent = originalText; }, 2000);
      });
  });

  citeLink.insertAdjacentElement("afterend", bibtexBtn);
}

function processPage() {
  const resultContainers = document.querySelectorAll("div.gs_r[data-cid]");
  resultContainers.forEach(addBibtexButtonToResult);
}

function initializeExtension() {
  processPage();
  const observer = new MutationObserver((mutations) => {
    const needsProcessing = mutations.some(mutation => mutation.addedNodes.length > 0);
    if (needsProcessing) processPage();
  });
  const resultsNode = document.getElementById("gs_res_ccl_mid");
  if (resultsNode) {
    observer.observe(resultsNode, { childList: true, subtree: true });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
  initializeExtension();
}
