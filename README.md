# gh-remove-pr-username

A browser extension that removes the `username:` prefix in branch names shown in GitHub pull request headers.

## Supported browsers

- Chromium-based browsers (Chrome, Edge, Brave, etc.)
- Firefox

## Installation (temporary / developer mode)

1. Clone or download this repository.
2. Open your browser extension page:
   - Chromium: `chrome://extensions`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. Load this folder as an unpacked/temporary extension.
4. Open a GitHub pull request page.

On PRs from forks, the header branch label is normalized from `username:branch-name` to `branch-name`.
The adjacent **Copy head branch name to clipboard** control is also updated to copy only `branch-name`.

## Verification

- Local syntax check: `npm run check`
- Local live-page verification (requires a Chromium executable at `/usr/bin/chromium` or `CHROME_PATH`):
  - `npm ci`
  - `npm run verify:live-pr`

This repository also includes a GitHub Actions workflow that runs the same live-page verification on `push` to `main`, `pull_request`, and manual `workflow_dispatch`.
