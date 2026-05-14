(function () {
  const COPY_LABEL = 'Copy head branch name to clipboard';
  const BRANCH_LINK_SELECTOR = 'a[href*="/tree/"][class*="BranchName"]';

  function branchNameFromHref(href) {
    if (!href) return null;

    try {
      const url = new URL(href, window.location.origin);
      const marker = '/tree/';
      const idx = url.pathname.indexOf(marker);

      if (idx === -1) return null;

      return decodeURIComponent(url.pathname.slice(idx + marker.length));
    } catch {
      return null;
    }
  }

  function stripOwnerPrefix(text) {
    const match = /^([^:\s]+):(.*)$/.exec(text.trim());
    return match ? match[2].trim() : null;
  }

  function getNormalizedBranchName(branchLink) {
    const fromHref = branchNameFromHref(branchLink.getAttribute('href'));
    if (fromHref) return fromHref;

    const fromText = stripOwnerPrefix(branchLink.textContent || '');
    return fromText || null;
  }

  function updateBranchLinkText(branchLink, branchName) {
    if (branchLink.textContent?.trim() !== branchName) {
      branchLink.textContent = branchName;
    }
  }

  function findBranchLinkInAncestors(startElement) {
    let scope = startElement;
    let depth = 0;
    const maxDepth = 8;

    while (scope && scope !== document.body && depth < maxDepth) {
      const branchLink = scope.querySelector(BRANCH_LINK_SELECTOR);
      if (branchLink) {
        return branchLink;
      }

      scope = scope.parentElement;
      depth += 1;
    }

    return null;
  }

  function updateBranchDisplay() {
    const branchLinks = document.querySelectorAll(BRANCH_LINK_SELECTOR);
    for (const branchLink of branchLinks) {
      const branchName = getNormalizedBranchName(branchLink);
      if (!branchName) continue;

      updateBranchLinkText(branchLink, branchName);
    }
  }

  function isHeadBranchCopyButton(button) {
    if (!(button instanceof Element)) return false;

    const labelledBy = button.getAttribute('aria-labelledby');
    if (!labelledBy) return false;

    return labelledBy
      .split(/\s+/)
      .filter(Boolean)
      .some((id) => document.getElementById(id)?.getAttribute('aria-label') === COPY_LABEL);
  }

  function handleCopyButtonClick(event) {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) return;

    const copyControl = eventTarget.closest('button[aria-labelledby]');
    if (!copyControl) return;
    if (!copyControl.querySelector('svg.octicon-copy') || !isHeadBranchCopyButton(copyControl)) return;
    if (typeof navigator.clipboard?.writeText !== 'function') return;

    const branchLink = findBranchLinkInAncestors(copyControl);
    if (!branchLink) return;

    const branchName = getNormalizedBranchName(branchLink);
    if (!branchName) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    navigator.clipboard.writeText(branchName).catch((error) => {
      console.debug('gh-remove-pr-username: failed to write clipboard text', { branchName, error });
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
