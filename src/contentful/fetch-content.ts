import { createClient, type Entry, type EntrySkeletonType } from 'contentful';
import { fixturePublication } from './fixtures';
import { normalizeContentfulEntries } from './normalize';
import type { Publication } from './types';

type RawEntry = Entry<EntrySkeletonType, undefined, string>;

type EntryPage = {
  items: RawEntry[];
  limit: number;
  skip: number;
  total: number;
};

type EntryPageQuery = {
  include: 10;
  limit: number;
  order: ['sys.createdAt'];
  skip: number;
};

type EntryPageFetcher = (query: EntryPageQuery) => Promise<EntryPage>;

// Keep raw CMS volume well below the repository's 18,000 generated-file ceiling.
// Extra page headroom permits legitimate short pages without allowing unbounded
// include-expanded responses to accumulate in the build process.
export const CONTENTFUL_PAGINATION_BUDGET = Object.freeze({
  pageSize: 1000,
  maxPages: 20,
  maxItems: 10_000,
});

function useFixtures(): boolean {
  if (process.env.PUBLICATION_USE_FIXTURES === 'true') return true;
  const hasCredentials = Boolean(
    process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_DELIVERY_TOKEN,
  );
  if (!hasCredentials && process.env.PUBLICATION_ENV === 'production') {
    throw new Error('Production builds require CONTENTFUL_SPACE_ID and CONTENTFUL_DELIVERY_TOKEN.');
  }
  return !hasCredentials;
}

function assertPaginationInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Contentful pagination returned an invalid ${name}: ${String(value)}.`);
  }
}

export async function fetchEntriesWithBudget(fetchPage: EntryPageFetcher): Promise<RawEntry[]> {
  const entries: RawEntry[] = [];
  const entryIds = new Set<string>();
  let skip = 0;
  let expectedTotal: number | undefined;

  for (let pageNumber = 1; ; pageNumber += 1) {
    if (pageNumber > CONTENTFUL_PAGINATION_BUDGET.maxPages) {
      throw new Error(
        `Contentful pagination exceeded the maximum page count of ${CONTENTFUL_PAGINATION_BUDGET.maxPages}.`,
      );
    }

    const response = await fetchPage({
      include: 10,
      limit: CONTENTFUL_PAGINATION_BUDGET.pageSize,
      order: ['sys.createdAt'],
      skip,
    });

    assertPaginationInteger(response.total, 'total');
    assertPaginationInteger(response.skip, 'offset');
    assertPaginationInteger(response.limit, 'limit');

    if (response.skip !== skip) {
      throw new Error(
        `Contentful pagination returned unexpected offset ${response.skip}; expected ${skip}.`,
      );
    }
    if (response.limit > CONTENTFUL_PAGINATION_BUDGET.pageSize) {
      throw new Error(
        `Contentful pagination returned limit ${response.limit}; requested at most ${CONTENTFUL_PAGINATION_BUDGET.pageSize}.`,
      );
    }
    if (response.items.length > CONTENTFUL_PAGINATION_BUDGET.pageSize) {
      throw new Error(
        `Contentful pagination returned ${response.items.length} items in one page; requested at most ${CONTENTFUL_PAGINATION_BUDGET.pageSize}.`,
      );
    }

    expectedTotal ??= response.total;
    if (response.total !== expectedTotal) {
      throw new Error(
        `Contentful pagination changed its total from ${expectedTotal} to ${response.total}.`,
      );
    }
    if (response.total > CONTENTFUL_PAGINATION_BUDGET.maxItems) {
      throw new Error(
        `Contentful pagination reported ${response.total} items, exceeding the maximum item count of ${CONTENTFUL_PAGINATION_BUDGET.maxItems}.`,
      );
    }

    if (response.items.length === 0) {
      if (skip === response.total) return entries;
      throw new Error(
        `Contentful pagination made no progress at offset ${skip} before the reported total of ${response.total}.`,
      );
    }

    const nextSkip = skip + response.items.length;
    if (nextSkip > response.total) {
      throw new Error(
        `Contentful pagination advanced past its reported total of ${response.total}.`,
      );
    }
    if (entries.length + response.items.length > CONTENTFUL_PAGINATION_BUDGET.maxItems) {
      throw new Error(
        `Contentful pagination exceeded the maximum item count of ${CONTENTFUL_PAGINATION_BUDGET.maxItems}.`,
      );
    }

    for (const entry of response.items) {
      if (entryIds.has(entry.sys.id)) {
        throw new Error(`Contentful pagination repeated entry ${entry.sys.id}.`);
      }
      entryIds.add(entry.sys.id);
    }

    entries.push(...response.items);
    skip = nextSkip;
    if (skip === response.total) return entries;
  }
}

async function fetchAllEntries(): Promise<RawEntry[]> {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!space || !accessToken) {
    throw new Error('Contentful credentials are missing.');
  }

  const client = createClient({
    space,
    accessToken,
    environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  });

  return fetchEntriesWithBudget((query) => client.getEntries<EntrySkeletonType>(query));
}

let publicationPromise: Promise<Publication> | undefined;

export function loadPublication(): Promise<Publication> {
  publicationPromise ??= useFixtures()
    ? Promise.resolve(fixturePublication)
    : fetchAllEntries().then(normalizeContentfulEntries);
  return publicationPromise;
}
