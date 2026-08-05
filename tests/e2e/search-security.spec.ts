import { expect, test } from '@playwright/test';

test('search excerpts render CMS markup as text and preserve Pagefind highlights', async ({
  page,
}) => {
  await page.route('**/pagefind/pagefind.js', async (route) => {
    await route.fulfill({
      contentType: 'text/javascript',
      body: `
        export async function init() {}
        export async function search() {
          return {
            results: [{
              data: async () => ({
                url: '/articles/late-ferry-plan-bay-bridge-repair/',
                meta: {
                  type: 'Article',
                  title: 'A safe search result',
                  author: 'Mara Vale',
                  date: '2025-05-14'
                },
                excerpt: 'Before <mark>needle</mark> <img src=x onerror="window.__pagefindXss = true"> <svg onload="window.__pagefindSvgXss = true"></svg> <mark onmouseover="window.__pagefindMarkXss = true">attribute</mark> after'
              })
            }]
          };
        }
      `,
    });
  });

  await page.goto('/search/?q=needle');

  const excerpt = page.locator('.card-dek');
  await expect(page.getByRole('link', { name: 'A safe search result' })).toBeVisible();
  await expect(excerpt.locator('mark')).toHaveText('needle');
  await expect(excerpt).toContainText('<img src=x onerror="window.__pagefindXss = true">');
  await expect(excerpt).toContainText('<svg onload="window.__pagefindSvgXss = true"></svg>');
  await expect(excerpt).toContainText(
    '<mark onmouseover="window.__pagefindMarkXss = true">attribute</mark>',
  );
  await expect(excerpt.locator('img')).toHaveCount(0);
  expect(
    await excerpt
      .locator('*')
      .evaluateAll((elements) => elements.map((element) => element.tagName)),
  ).toEqual(['MARK']);
  expect(await page.evaluate(() => Reflect.get(window, '__pagefindXss'))).toBeUndefined();
  expect(await page.evaluate(() => Reflect.get(window, '__pagefindSvgXss'))).toBeUndefined();
  expect(await page.evaluate(() => Reflect.get(window, '__pagefindMarkXss'))).toBeUndefined();
});
