import { describe, expect, it } from 'vitest';
import { serializeRedirectFile } from '../../scripts/redirect-file';

describe('redirect file serialization', () => {
  it('writes canonical internal article redirects', () => {
    expect(
      serializeRedirectFile([
        {
          from: '/articles/old-headline/',
          to: '/articles/current-headline/',
          status: 301,
        },
      ]),
    ).toBe(
      [
        '# Generated from published Article.previousSlugs values.',
        '/articles/old-headline/ /articles/current-headline/ 301',
        '',
      ].join('\n'),
    );
  });

  it.each([
    '/articles/legacy\n/* https://attacker.example/:splat 302\n#/',
    'https://attacker.example/',
    '/articles/../admin/',
  ])('rejects an unsafe source path: %s', (from) => {
    expect(() =>
      serializeRedirectFile([
        {
          from,
          to: '/articles/current-headline/',
          status: 301,
        },
      ]),
    ).toThrow('canonical internal article paths');
  });

  it('rejects unexpected redirect status codes', () => {
    expect(() =>
      serializeRedirectFile([
        {
          from: '/articles/old-headline/',
          to: '/articles/current-headline/',
          status: 302,
        },
      ]),
    ).toThrow('status 301');
  });
});
