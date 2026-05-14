import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const COPY_LABEL = 'Copy head branch name to clipboard';
const BRANCH_LINK_SELECTOR = 'a[href*="/tree/"][class*="BranchName"]';
const PR_URL = process.env.PR_URL || 'https://github.com/wagtail/wagtail/pull/14203';
const SCREENSHOT_PATH = process.env.SCREENSHOT_PATH || '/tmp/live-pr-verify/live-pr-after-refactor.png';

function normalizeBranchName(text) {
  const colonIndex = text.indexOf(':');
  return colonIndex === -1 ? text.trim() : text.slice(colonIndex + 1).trim();
}

const contentScript = await fs.readFile(new URL('../content.js', import.meta.url), 'utf8');

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--ignore-certificate-errors']
});

const page = await browser.newPage();

try {
  await page.goto(PR_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('button[aria-labelledby]', { timeout: 120000 });

  await page.evaluate(() => {
    window.__copiedText = null;
    navigator.clipboard.writeText = (value) => {
      window.__copiedText = value;
      return Promise.resolve();
    };
  });

  await page.evaluate(contentScript);

  const result = await page.evaluate(
    ({ copyLabel, branchLinkSelector }) => {
      const copyButton = Array.from(document.querySelectorAll('button[aria-labelledby]')).find((button) =>
        button
          .getAttribute('aria-labelledby')
          .split(/\s+/)
          .filter(Boolean)
          .some((id) => document.getElementById(id)?.getAttribute('aria-label') === copyLabel)
      );

      if (!copyButton) {
        return { error: 'Copy button not found' };
      }

      const branchLink = copyButton.parentElement.querySelector(branchLinkSelector);
      if (!branchLink) {
        return { error: 'Head branch link not found near copy button' };
      }

      const displayedBranch = branchLink.textContent.trim();
      copyButton.click();

      return {
        displayedBranch,
        copiedBranch: window.__copiedText
      };
    },
    { copyLabel: COPY_LABEL, branchLinkSelector: BRANCH_LINK_SELECTOR }
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const expectedBranch = normalizeBranchName(result.displayedBranch);
  if (result.displayedBranch !== expectedBranch) {
    throw new Error(`Displayed branch still has username prefix: ${result.displayedBranch}`);
  }

  if (result.copiedBranch !== expectedBranch) {
    throw new Error(
      `Copied branch mismatch. Expected "${expectedBranch}" but got "${result.copiedBranch || '<empty>'}"`
    );
  }

  await fs.mkdir(path.dirname(SCREENSHOT_PATH), { recursive: true });
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });

  console.log(JSON.stringify({ url: PR_URL, ...result }, null, 2));
} finally {
  await browser.close();
}
