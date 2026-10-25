import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const base = 'http://127.0.0.1:4199';
const output = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Users/USER/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe',
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const pages = [];
const blocked = [];
const errors = [];
await mkdir(output, { recursive: true });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const local = url.hostname === '127.0.0.1' && url.port === '4199';
  const safeGet = request.method() === 'GET' && local &&
    !/\/(?:generate|model|voice|transcri|speech|chat|complete)(?:\/|$)/i.test(url.pathname);
  if (!safeGet) {
    blocked.push({ method: request.method(), origin: url.origin, path: url.pathname });
    await route.abort('blockedbyclient');
    return;
  }
  await route.continue();
});

for (const pathname of ['/direction', '/pathways', '/cv']) {
  const response = await page.goto(`${base}${pathname}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const hasContactLikeText = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(bodyText) || /(?:\+27|0)[1-9](?:[\s()-]?\d){8,9}\b/.test(bodyText);
  const hasPrepopulatedInputs = await page.locator('input,textarea').evaluateAll(nodes => nodes.some(node => node.value?.trim()));
  const headings = await page.locator('h1,h2,h3').evaluateAll(nodes => nodes.map(node => node.innerText.trim()).filter(Boolean).slice(0, 30));
  const links = await page.locator('main a').evaluateAll(nodes => nodes.map(node => ({
    text: node.innerText.trim().replace(/\s+/g, ' ').slice(0, 100),
    href: node.getAttribute('href'),
  })));
  const result = {
    path: pathname,
    responseStatus: response?.status() ?? null,
    title: await page.title(),
    h1: await page.locator('h1').allInnerTexts(),
    contactLikeTextDetected: hasContactLikeText,
    prepopulatedInputsDetected: hasPrepopulatedInputs,
    headings,
    links,
  };
  pages.push(result);
  if (!hasContactLikeText && !hasPrepopulatedInputs) {
    await page.screenshot({ path: join(output, `${pathname.slice(1)}.png`), fullPage: false });
    if (pathname === '/direction') {
      await page.getByRole('heading', { name: 'From engineering study to a direction' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(output, 'direction-role.png'), fullPage: false });
      await page.locator('section[aria-label="Engineering role requirements and practice evidence"]').screenshot({ path: join(output, 'direction-role-bridge.png') });
      const chooseSkill = page.getByRole('button', { name: 'Choose practice or a learning step' }).first();
      await chooseSkill.click();
      const nextStep = page.locator('section[aria-label="Chosen requirement next step"]');
      await nextStep.waitFor({ state: 'visible' });
      await nextStep.screenshot({ path: join(output, 'direction-next-step.png') });
      result.selectedRequirementStep = {
        heading: await nextStep.locator('h3').innerText(),
        actions: await nextStep.locator('button,a').evaluateAll(nodes => nodes.map(node => ({
          label: node.innerText.trim().replace(/\s+/g, ' ').slice(0, 100),
          href: node.getAttribute('href'),
          disabled: node.disabled === true,
        }))),
        formControlsAvailable: await nextStep.locator('select,textarea').count(),
      };
    }
    if (pathname === '/pathways') {
      await page.getByRole('heading', { name: 'Explore banking graduate work' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(output, 'pathways-fnb-role.png'), fullPage: false });
    }
  }
}
await writeFile(join(output, 'browser-result.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  target: 'local synthetic preview only',
  browser: 'isolated Playwright Chromium, 1440×1000',
  sideEffects: 'GET-only local navigation; all non-GET and off-origin requests blocked; no form actions taken',
  blocked,
  errors,
  pages,
}, null, 2));
await browser.close();
