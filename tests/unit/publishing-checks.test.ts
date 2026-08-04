import { describe, expect, it, vi } from 'vitest';
import {
  evaluatePublishingChecks,
  publishingChecksPass,
  type LinkedEntryStatus,
} from '../../contentful/apps/publishing-checks/src/rules';

const published = vi.fn(async (): Promise<LinkedEntryStatus> => 'published');

describe('Contentful publishing checks', () => {
  it('requires a published hero image for standard articles', async () => {
    const missing = await evaluatePublishingChecks(
      { storyLabel: 'Standard story', heroImage: undefined, book: undefined },
      published,
    );
    expect(publishingChecksPass(missing)).toBe(false);
    expect(missing.find((check) => check.id === 'hero-image')?.state).toBe('fail');

    const complete = await evaluatePublishingChecks(
      {
        storyLabel: 'Standard story',
        heroImage: { sys: { id: 'image-entry' } },
        book: undefined,
      },
      published,
    );
    expect(publishingChecksPass(complete)).toBe(true);
  });

  it('allows a Brief without a hero image', async () => {
    const checks = await evaluatePublishingChecks(
      { storyLabel: 'Brief', heroImage: undefined, book: undefined },
      published,
    );
    expect(publishingChecksPass(checks)).toBe(true);
    expect(checks.find((check) => check.id === 'hero-image')?.state).toBe('not-applicable');
  });

  it('allows Reviews without Books and verifies a Book when one is attached', async () => {
    const withoutBook = await evaluatePublishingChecks(
      {
        storyLabel: 'Review',
        heroImage: { sys: { id: 'image-entry' } },
        book: undefined,
      },
      published,
    );
    expect(publishingChecksPass(withoutBook)).toBe(true);
    expect(withoutBook.find((check) => check.id === 'book')?.state).toBe('not-applicable');

    const withPublishedBook = await evaluatePublishingChecks(
      {
        storyLabel: 'Review',
        heroImage: { sys: { id: 'image-entry' } },
        book: { sys: { id: 'book-entry' } },
      },
      published,
    );
    expect(publishingChecksPass(withPublishedBook)).toBe(true);

    const withDraftBook = await evaluatePublishingChecks(
      {
        storyLabel: 'Review',
        heroImage: { sys: { id: 'image-entry' } },
        book: { sys: { id: 'book-entry' } },
      },
      async (entryId) => (entryId === 'book-entry' ? 'draft' : 'published'),
    );
    expect(publishingChecksPass(withDraftBook)).toBe(false);
  });

  it('rejects selected references that are still drafts or cannot be verified', async () => {
    const draft = await evaluatePublishingChecks(
      {
        storyLabel: 'Analysis',
        heroImage: { sys: { id: 'draft-image' } },
        book: undefined,
      },
      async () => 'draft',
    );
    expect(publishingChecksPass(draft)).toBe(false);
    expect(draft.find((check) => check.id === 'hero-image')?.detail).toContain('Publish');

    const unavailable = await evaluatePublishingChecks(
      {
        storyLabel: 'Standard story',
        heroImage: { sys: { id: 'unavailable-image' } },
        book: undefined,
      },
      async () => 'unavailable',
    );
    expect(publishingChecksPass(unavailable)).toBe(false);
  });
});
