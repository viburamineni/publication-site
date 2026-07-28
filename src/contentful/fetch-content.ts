import { createClient, type Entry, type EntrySkeletonType } from 'contentful';
import { fixturePublication } from './fixtures';
import { normalizeContentfulEntries } from './normalize';
import type { Publication } from './types';

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

async function fetchAllEntries(): Promise<Entry<EntrySkeletonType, undefined, string>[]> {
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

  const entries: Entry<EntrySkeletonType, undefined, string>[] = [];
  const limit = 1000;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;

  while (skip < total) {
    const response = await client.getEntries<EntrySkeletonType>({
      include: 10,
      limit,
      skip,
    });
    entries.push(...response.items);
    total = response.total;
    skip += response.items.length;
    if (response.items.length === 0) break;
  }

  return entries;
}

let publicationPromise: Promise<Publication> | undefined;

export function loadPublication(): Promise<Publication> {
  publicationPromise ??= useFixtures()
    ? Promise.resolve(fixturePublication)
    : fetchAllEntries().then(normalizeContentfulEntries);
  return publicationPromise;
}
