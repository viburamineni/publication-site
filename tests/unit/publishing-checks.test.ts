import { describe, expect, it, vi } from 'vitest';
import {
  evaluatePublishingChecks,
  publishingChecksPass,
  type LinkedEntryStatus,
  type PublishingCheckInput,
} from '../../contentful/apps/publishing-checks/src/rules';

const link = (id: string) => ({ sys: { id } });
const published = vi.fn(async (): Promise<LinkedEntryStatus> => 'published');

function completeInput(overrides: Partial<PublishingCheckInput> = {}): PublishingCheckInput {
  return {
    storyLabel: 'Standard story',
    authors: [link('author-entry')],
    primaryCategory: link('category-entry'),
    topics: [],
    heroImage: link('image-entry'),
    sources: [],
    book: undefined,
    relatedArticles: [],
    bodyReferences: [],
    ...overrides,
  };
}

describe('Contentful publishing checks', () => {
  it('requires a published hero image for standard articles', async () => {
    const missing = await evaluatePublishingChecks(
      completeInput({ heroImage: undefined }),
      published,
    );
    expect(publishingChecksPass(missing)).toBe(false);
    expect(missing.find((check) => check.id === 'hero-image')?.state).toBe('fail');

    const complete = await evaluatePublishingChecks(completeInput(), published);
    expect(publishingChecksPass(complete)).toBe(true);
  });

  it('allows a Brief without a hero image', async () => {
    const checks = await evaluatePublishingChecks(
      completeInput({ storyLabel: 'Brief', heroImage: undefined }),
      published,
    );
    expect(publishingChecksPass(checks)).toBe(true);
    expect(checks.find((check) => check.id === 'hero-image')?.state).toBe('not-applicable');
  });

  it('allows Reviews without Books and verifies a Book when one is attached', async () => {
    const withoutBook = await evaluatePublishingChecks(
      completeInput({ storyLabel: 'Review' }),
      published,
    );
    expect(publishingChecksPass(withoutBook)).toBe(true);
    expect(withoutBook.find((check) => check.id === 'book')?.state).toBe('not-applicable');

    const withPublishedBook = await evaluatePublishingChecks(
      completeInput({ storyLabel: 'Review', book: link('book-entry') }),
      published,
    );
    expect(publishingChecksPass(withPublishedBook)).toBe(true);

    const withDraftBook = await evaluatePublishingChecks(
      completeInput({ storyLabel: 'Review', book: link('book-entry') }),
      async (entryId) => (entryId === 'book-entry' ? 'draft' : 'published'),
    );
    expect(publishingChecksPass(withDraftBook)).toBe(false);
  });

  it('verifies every selected Article relationship without depending on category or topic names', async () => {
    const checks = await evaluatePublishingChecks(
      completeInput({
        authors: [link('author-one'), link('author-two')],
        primaryCategory: link('category-any-name'),
        topics: [link('topic-any-name')],
        sources: [link('source-one')],
        relatedArticles: [link('article-related')],
        bodyReferences: [link('embedded-entry')],
      }),
      async (entryId) => (entryId === 'topic-any-name' ? 'draft' : 'published'),
    );

    expect(publishingChecksPass(checks)).toBe(false);
    expect(checks.find((check) => check.id === 'authors')?.state).toBe('pass');
    expect(checks.find((check) => check.id === 'category')?.state).toBe('pass');
    expect(checks.find((check) => check.id === 'topics')?.state).toBe('fail');
    expect(checks.find((check) => check.id === 'sources')?.state).toBe('pass');
    expect(checks.find((check) => check.id === 'related-articles')?.state).toBe('pass');
    expect(checks.find((check) => check.id === 'body-references')?.state).toBe('pass');
  });

  it('blocks missing required links and unpublished nested dependencies', async () => {
    const checks = await evaluatePublishingChecks(
      completeInput({ authors: [], primaryCategory: undefined }),
      async (entryId) => (entryId === 'image-entry' ? 'dependency-draft' : 'published'),
    );

    expect(publishingChecksPass(checks)).toBe(false);
    expect(checks.find((check) => check.id === 'authors')?.state).toBe('fail');
    expect(checks.find((check) => check.id === 'category')?.state).toBe('fail');
    expect(checks.find((check) => check.id === 'hero-image')?.detail).toContain(
      'unpublished linked entry or asset',
    );
  });

  it('rejects selected references that cannot be found or verified', async () => {
    const missing = await evaluatePublishingChecks(
      completeInput({ heroImage: link('missing-image') }),
      async (entryId) => (entryId === 'missing-image' ? 'missing' : 'published'),
    );
    expect(publishingChecksPass(missing)).toBe(false);
    expect(missing.find((check) => check.id === 'hero-image')?.detail).toContain(
      'could not be found',
    );

    const unavailable = await evaluatePublishingChecks(
      completeInput({ heroImage: link('unavailable-image') }),
      async (entryId) => (entryId === 'unavailable-image' ? 'unavailable' : 'published'),
    );
    expect(publishingChecksPass(unavailable)).toBe(false);
    expect(unavailable.find((check) => check.id === 'hero-image')?.detail).toContain(
      'could not be completely verified',
    );
  });
});
