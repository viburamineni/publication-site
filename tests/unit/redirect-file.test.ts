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

  it('rejects duplicate redirect sources', () => {
    expect(() =>
      serializeRedirectFile([
        {
          from: '/articles/shared-historical-slug/',
          to: '/articles/first-current-slug/',
          status: 301,
        },
        {
          from: '/articles/shared-historical-slug/',
          to: '/articles/second-current-slug/',
          status: 301,
        },
      ]),
    ).toThrow('Duplicate redirect source');
  });

  it('rejects self-looping redirects', () => {
    expect(() =>
      serializeRedirectFile([
        {
          from: '/articles/same-slug/',
          to: '/articles/same-slug/',
          status: 301,
        },
      ]),
    ).toThrow('self-loop');
  });

  it.each([
    [
      {
        from: '/articles/oldest-slug/',
        to: '/articles/older-slug/',
        status: 301,
      },
      {
        from: '/articles/older-slug/',
        to: '/articles/current-slug/',
        status: 301,
      },
    ],
    [
      {
        from: '/articles/first-slug/',
        to: '/articles/second-slug/',
        status: 301,
      },
      {
        from: '/articles/second-slug/',
        to: '/articles/first-slug/',
        status: 301,
      },
    ],
  ])('rejects redirect chains and cycles', (...redirects) => {
    expect(() => serializeRedirectFile(redirects)).toThrow('also a redirect source');
  });
});
