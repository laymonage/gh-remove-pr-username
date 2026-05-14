(function () {
  const COPY_LABEL = 'Copy head branch name to clipboard';

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

  function updateCopyControlForBranch(branchLink, branchName) {
    let scope = branchLink.parentElement;
    let depth = 0;
    const maxDepth = 8;

    while (scope && scope !== document.body && depth < maxDepth) {
      const copyControl = scope.querySelector(
        `button[aria-label="${COPY_LABEL}"], clipboard-copy[aria-label="${COPY_LABEL}"]`
      );

      if (copyControl) {
        updateCopyControlValue(copyControl, branchName);
        return;
      }

      scope = scope.parentElement;
      depth += 1;
    }

    const globalCopyControl = document.querySelector(
      `button[aria-label="${COPY_LABEL}"], clipboard-copy[aria-label="${COPY_LABEL}"]`
    );

    if (globalCopyControl) {
      updateCopyControlValue(globalCopyControl, branchName);
    }
  }

  function updateBranchDisplayAndCopyValue() {
    const branchLinks = document.querySelectorAll('a[href*="/tree/"]');

    for (const branchLink of branchLinks) {
      const branchName = getNormalizedBranchName(branchLink);
      if (!branchName) continue;

      if (branchLink.textContent && branchLink.textContent.trim() !== branchName) {
        branchLink.textContent = branchName;
      }

      updateCopyControlForBranch(branchLink, branchName);
    }
  }

  const observer = new MutationObserver(updateBranchDisplayAndCopyValue);

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

  document.addEventListener('turbo:load', updateBranchDisplayAndCopyValue);
})();
