(function () {
  const COPY_LABEL = 'Copy head branch name to clipboard';
  const COPY_CONTROL_SELECTOR = `button[aria-label="${COPY_LABEL}"], clipboard-copy[aria-label="${COPY_LABEL}"]`;
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

  function updateCopyControlValue(control, branchName) {
    if (!branchName) return;

    if ('value' in control) {
      control.value = branchName;
    }

    if (control.hasAttribute('value')) {
      control.setAttribute('value', branchName);
    }

    if (control.hasAttribute('data-clipboard-text')) {
      control.setAttribute('data-clipboard-text', branchName);
    }
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

  function updateBranchDisplayAndCopyValue() {
    const copyControls = document.querySelectorAll(COPY_CONTROL_SELECTOR);
    const updatedBranchLinks = new Set();

    for (const copyControl of copyControls) {
      const branchLink = findBranchLinkInAncestors(copyControl);
      if (!branchLink) continue;

      updatedBranchLinks.add(branchLink);
      const branchName = getNormalizedBranchName(branchLink);
      if (!branchName) continue;

      updateBranchLinkText(branchLink, branchName);

      updateCopyControlValue(copyControl, branchName);
    }

    const branchLinks = document.querySelectorAll(BRANCH_LINK_SELECTOR);

    for (const branchLink of branchLinks) {
      if (updatedBranchLinks.has(branchLink)) continue;

      const branchName = getNormalizedBranchName(branchLink);
      if (!branchName) continue;

      updateBranchLinkText(branchLink, branchName);
    }
  }

  let updateQueued = false;

  function scheduleUpdate() {
    if (updateQueued) return;

    updateQueued = true;
    requestAnimationFrame(() => {
      updateQueued = false;
      updateBranchDisplayAndCopyValue();
    });
  }

  const observer = new MutationObserver(scheduleUpdate);

  function start() {
    updateBranchDisplayAndCopyValue();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  document.addEventListener('turbo:load', scheduleUpdate);
})();
