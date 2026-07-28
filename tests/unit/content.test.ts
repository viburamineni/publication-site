import { describe, expect, it } from 'vitest';
import { fixturePublication } from '../../src/contentful/fixtures';
import {
  estimateReadingMinutes,
  formatPublicationDate,
  normalizeSlug,
  publishedArticles,
  sanitizeExternalUrl,
} from '../../src/utilities/content';

describe('content utilities', () => {
  it('normalizes slugs', () => {
    expect(normalizeSlug('A Mayor’s Résumé: 2026')).toBe('a-mayors-resume-2026');
  });

  it('calculates reading time with a one-minute floor', () => {
    expect(estimateReadingMinutes('short copy')).toBe(1);
    expect(estimateReadingMinutes(Array.from({ length: 451 }, () => 'word').join(' '))).toBe(3);
  });

  it('sorts published articles newest first', () => {
    const published = publishedArticles(fixturePublication);
    expect(published).toHaveLength(fixturePublication.articles.length);
    expect(Date.parse(published[0]!.publicationDate)).toBeGreaterThanOrEqual(
      Date.parse(published[1]!.publicationDate),
    );
  });

  it('formats dates in UTC', () => {
    expect(formatPublicationDate('2026-07-28T23:59:00.000Z')).toBe('July 28, 2026');
  });

  it('allows only HTTP(S) external URLs', () => {
    expect(sanitizeExternalUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(() => sanitizeExternalUrl('javascript:alert(1)')).toThrow('Unsupported URL protocol');
  });
});
