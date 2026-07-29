import { describe, expect, it } from 'vitest';
import { fixturePublication } from '../../src/contentful/fixtures';
import {
  estimateReadingMinutes,
  formatPublicationDate,
  normalizeSlug,
  publishedArticles,
  sanitizeExternalUrl,
  sanitizeLinkUrl,
  serializeJsonForHtml,
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

  it('allows site-relative and HTTP(S) links but rejects executable URLs', () => {
    expect(sanitizeLinkUrl('/about/?edition=latest#masthead')).toBe(
      '/about/?edition=latest#masthead',
    );
    expect(sanitizeLinkUrl('https://example.com/a')).toBe('https://example.com/a');
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,unsafe',
      '//attacker.example/path',
      '/safe\njavascript:alert(1)',
      '/\\attacker.example/path',
    ]) {
      expect(() => sanitizeLinkUrl(value)).toThrow();
    }
  });

  it('serializes structured data without exposing HTML script delimiters', () => {
    const value = {
      headline: '</script><script>document.body.dataset.poc=1</script>',
      separators: '\u2028\u2029&',
    };
    const serialized = serializeJsonForHtml(value);

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).not.toContain('&');
    expect(serialized).not.toContain('\u2028');
    expect(serialized).not.toContain('\u2029');
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
