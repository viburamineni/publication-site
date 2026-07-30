import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const routes = [
  '/',
  '/articles/harbor-town-tests-quieter-preparation/',
  '/categories/world/',
  '/topics/living-with-higher-water/',
  '/authors/mara-vale/',
  '/staff/',
  '/search/',
];

test('core routes render and navigation works', async ({ page }) => {
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.goto('/');
  await page.getByRole('link', { name: 'Latest' }).click();
  await expect(page).toHaveURL(/\/latest\/$/);
});

test('search finds an approved fixture article', async ({ page }) => {
  await page.goto('/search/?q=harbor');
  await expect(page.getByRole('link', { name: /harbor town tests/i })).toBeVisible();
});

test('homepage bylines reveal and open author profiles', async ({ page }) => {
  await page.goto('/');
  const authorLink = page.getByRole('link', { name: 'Mara Vale', exact: true }).first();
  await authorLink.hover();
  await expect(authorLink).toHaveCSS('text-decoration-line', 'underline');
  await authorLink.click();
  await expect(page).toHaveURL(/\/authors\/mara-vale\/$/);
  await expect(page.getByRole('heading', { name: 'Mara Vale' })).toBeVisible();
});

test('homepage editorial order and optional notice are intentional', async ({ page }) => {
  await page.goto('/');
  const primaryLinks = await page.locator('.desktop-nav a').allTextContents();
  expect(primaryLinks.slice(-3)).toEqual(['Analysis', 'Opinion', 'Books']);
  await expect(page.getByRole('complementary', { name: 'Edition notice' })).toHaveCount(0);
  await expect(page.getByText('Topic', { exact: true })).toBeVisible();
});

test('article related stories use the configured article relationship', async ({ page }) => {
  await page.goto('/articles/opinion-room-for-unfinished-sentence/');
  const related = page.getByRole('region', { name: 'Related stories' });
  await expect(related).toBeVisible();
  await expect(related.getByRole('link', { name: /fictional budget vote turns/i })).toBeVisible();
});

test('keyboard skip link moves to main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('mobile navigation is operable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  const toggle = page.getByText('Sections', { exact: true });
  await toggle.click();
  const navigation = page.getByRole('navigation', { name: 'Mobile primary' });
  await expect(navigation.getByRole('link', { name: 'Analysis' })).toBeVisible();
  await navigation.getByRole('link', { name: 'Analysis' }).click();
  await expect(page).toHaveURL(/\/categories\/analysis\/$/);
});

test('RSS, sitemap, and 404 output are available', async ({ page, request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect(await rss.text()).toContain('<rss');
  const sitemap = await request.get('/sitemap-index.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain('<sitemapindex');
  const missing = await page.goto('/definitely-missing/');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: /missed the edition/i })).toBeVisible();
});

test('generated redirects never mask core content routes', async () => {
  const redirects = await readFile(path.resolve('dist', '_redirects'), 'utf8');
  const redirectSources = new Set(
    redirects
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[0]),
  );

  for (const route of routes) {
    expect(redirectSources.has(route), route).toBe(false);
  }
});

for (const route of [
  '/',
  '/articles/harbor-town-tests-quieter-preparation/',
  '/staff/',
  '/search/',
]) {
  test(`automated accessibility: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
