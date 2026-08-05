import { describe, expect, it, vi } from 'vitest';

import {
  CONTENTFUL_PAGINATION_BUDGET,
  fetchEntriesWithBudget,
} from '../../src/contentful/fetch-content';

function entry(id: string) {
  return {
    sys: { id, contentType: { sys: { id: 'article' } } },
    fields: {},
  } as never;
}

function page(ids: string[], total: number, skip: number) {
  return {
    items: ids.map(entry),
    total,
    skip,
    limit: CONTENTFUL_PAGINATION_BUDGET.pageSize,
  };
}

describe('Contentful pagination resource budget', () => {
  it('preserves normal multi-page collection fetching', async () => {
    const firstPageIds = Array.from(
      { length: CONTENTFUL_PAGINATION_BUDGET.pageSize },
      (_, index) => `entry-${index}`,
    );
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page(firstPageIds, firstPageIds.length + 2, 0))
      .mockResolvedValueOnce(
        page(['entry-final-1', 'entry-final-2'], firstPageIds.length + 2, firstPageIds.length),
      );

    const entries = await fetchEntriesWithBudget(fetchPage);

    expect(entries).toHaveLength(firstPageIds.length + 2);
    expect(entries.at(-1)?.sys.id).toBe('entry-final-2');
    expect(fetchPage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: CONTENTFUL_PAGINATION_BUDGET.pageSize,
        skip: firstPageIds.length,
      }),
    );
  });

  it('rejects a hostile reported total before following it', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue(page(['entry-0'], CONTENTFUL_PAGINATION_BUDGET.maxItems + 1, 0));

    await expect(fetchEntriesWithBudget(fetchPage)).rejects.toThrow(/maximum item count/);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5])(
    'rejects the invalid reported total %s',
    async (total) => {
      const fetchPage = vi.fn().mockResolvedValue(page([], total, 0));

      await expect(fetchEntriesWithBudget(fetchPage)).rejects.toThrow(/invalid total/);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects an empty page that makes no progress toward the reported total', async () => {
    const fetchPage = vi.fn().mockResolvedValue(page([], 1, 0));

    await expect(fetchEntriesWithBudget(fetchPage)).rejects.toThrow(/made no progress/);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('stops collections that consume too many partial pages', async () => {
    const fetchPage = vi.fn(async ({ skip }: { skip: number }) =>
      page([`entry-${skip}`], CONTENTFUL_PAGINATION_BUDGET.maxPages + 1, skip),
    );

    await expect(fetchEntriesWithBudget(fetchPage)).rejects.toThrow(/maximum page count/);
    expect(fetchPage).toHaveBeenCalledTimes(CONTENTFUL_PAGINATION_BUDGET.maxPages);
  });

  it('rejects repeated entries across pages instead of accumulating duplicate work', async () => {
    const firstPageIds = Array.from(
      { length: CONTENTFUL_PAGINATION_BUDGET.pageSize },
      (_, index) => `entry-${index}`,
    );
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page(firstPageIds, firstPageIds.length + 1, 0))
      .mockResolvedValueOnce(page(['entry-0'], firstPageIds.length + 1, firstPageIds.length));

    await expect(fetchEntriesWithBudget(fetchPage)).rejects.toThrow(/repeated entry entry-0/);
  });

  it('rejects changing totals and mismatched response offsets', async () => {
    const firstPageIds = Array.from(
      { length: CONTENTFUL_PAGINATION_BUDGET.pageSize },
      (_, index) => `entry-${index}`,
    );
    const changingTotal = vi
      .fn()
      .mockResolvedValueOnce(page(firstPageIds, firstPageIds.length + 1, 0))
      .mockResolvedValueOnce(page(['entry-final'], firstPageIds.length + 2, firstPageIds.length));

    await expect(fetchEntriesWithBudget(changingTotal)).rejects.toThrow(/changed its total/);

    const wrongOffset = vi.fn().mockResolvedValue(page(['entry-0'], 1, 1));
    await expect(fetchEntriesWithBudget(wrongOffset)).rejects.toThrow(/unexpected offset/);
  });
});
