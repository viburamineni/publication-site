import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const routes = [
  '/',
  '/articles/late-ferry-plan-bay-bridge-repair/',
  '/categories/americas/',
  '/topics/',
  '/topics/world-events/',
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
  await page.getByRole('link', { name: 'Topics', exact: true }).first().click();
  await expect(page).toHaveURL(/\/topics\/$/);
  await expect(page.getByRole('heading', { name: 'World Events' })).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: 'Latest' }).click();
  await expect(page).toHaveURL(/\/latest\/$/);
});

test('search finds a realistic fixture article', async ({ page }) => {
  await page.goto('/search/?q=ferry');
  await expect(page.getByRole('link', { name: /late ferry plan/i })).toBeVisible();
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
  expect(primaryLinks).toEqual([
    'Analysis',
    'Guest Articles',
    'Culture and History',
    'Africa',
    'Americas',
    'Asia',
    'Australia and Oceania',
    'Europe',
  ]);
  await expect(page.getByRole('link', { name: 'The Transoceanic Cable home' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Edition notice' })).toHaveCount(0);
  await expect(page.getByText('Topic', { exact: true })).toBeVisible();
  await expect(page.getByText(/a collection of articles following one subject/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /more on world events/i })).toBeVisible();
});

test('curated homepage stories use the Editor’s picks heading', async () => {
  const homepageSource = await readFile(path.resolve('src', 'pages', 'index.astro'), 'utf8');

  expect(homepageSource).toContain('Editor’s picks');
  expect(homepageSource).not.toContain('The wider edition');
});

test('topic pages speak to readers without explaining the publishing system', async ({ page }) => {
  await page.goto('/topics/');
  await expect(
    page.getByText(
      'Book Reviews, Invitational Pieces, Analysis, World History, World Events, and Geopolitics.',
    ),
  ).toBeVisible();
  await expect(page.getByText(/a topic brings related stories together/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /more on book reviews/i })).toBeVisible();
});

test('article related stories use the configured article relationship', async ({ page }) => {
  await page.goto('/articles/opinion-ferry-timetable-climate-policy/');
  const related = page.getByRole('region', { name: 'Related stories' });
  await expect(related).toBeVisible();
  await expect(related.getByRole('link', { name: /late ferry plan/i })).toBeVisible();
});

test('Story Labels stay editorially simple in public output', async ({ page }) => {
  const cases = [
    ['/articles/late-ferry-plan-bay-bridge-repair/', undefined],
    ['/articles/broadband-pilot-hillside-neighborhoods/', 'Brief'],
    ['/articles/one-vote-capital-plan-transit-compact/', 'Analysis'],
    ['/articles/opinion-ferry-timetable-climate-policy/', 'Opinion'],
    ['/articles/book-review-sound-between-streets/', 'Review'],
  ] as const;

  for (const [route, expectedLabel] of cases) {
    await page.goto(route);
    const classification = page.locator('.article-classification');
    await expect(classification).not.toContainText('Standard story');
    await expect(classification).not.toContainText('News');
    if (expectedLabel) {
      await expect(classification.getByText(expectedLabel, { exact: true })).toBeVisible();
    }
  }

  await page.goto('/categories/americas/');
  const archive = page.locator('.archive-list');
  await expect(archive).toContainText('Inside the volunteer radio network');
  await expect(archive).toContainText('Broadband pilot reaches');
  await expect(archive.getByText('Brief', { exact: true })).toBeVisible();
  await expect(archive).not.toContainText('Standard story');
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
  await expect(navigation.getByRole('link', { name: 'Topics' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Australia and Oceania' })).toBeVisible();
  await navigation.getByRole('link', { name: 'Australia and Oceania' }).click();
  await expect(page).toHaveURL(/\/categories\/australia-and-oceania\/$/);
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
  '/articles/late-ferry-plan-bay-bridge-repair/',
  '/staff/',
  '/topics/',
  '/search/',
]) {
  test(`automated accessibility: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
