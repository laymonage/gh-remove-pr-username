(function () {
  const COPY_LABEL = 'Copy head branch name to clipboard';
  const BRANCH_LINK_SELECTOR = 'a[href*="/tree/"][class*="BranchName"]';

  function getNormalizedBranchName(branchLink) {
    const text = branchLink.textContent.trim();
    const colonIndex = text.indexOf(':');
    return colonIndex === -1 ? text : text.slice(colonIndex + 1).trim();
  }

  function updateBranchDisplay() {
    const branchLinks = document.querySelectorAll(BRANCH_LINK_SELECTOR);
    for (const branchLink of branchLinks) {
      branchLink.textContent = getNormalizedBranchName(branchLink);
    }
  }

  function isHeadBranchCopyButton(button) {
    return button
      .getAttribute('aria-labelledby')
      .split(/\s+/)
      .filter(Boolean)
      .some((id) => document.getElementById(id)?.getAttribute('aria-label') === COPY_LABEL);
  }

  function handleCopyButtonClick(event) {
    const copyControl = event.target.closest('button[aria-labelledby]');
    if (!copyControl) return;
    if (!isHeadBranchCopyButton(copyControl)) return;
    const branchName = getNormalizedBranchName(copyControl.parentElement.querySelector(BRANCH_LINK_SELECTOR));

    event.preventDefault();
    event.stopImmediatePropagation();
    navigator.clipboard.writeText(branchName).catch((error) => {
      console.debug('gh-remove-pr-username: failed to write clipboard text', error);
    });
  }

  function start() {
    updateBranchDisplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  document.addEventListener('turbo:load', start);
  document.addEventListener('click', handleCopyButtonClick, true);
})();
