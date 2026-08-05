import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { fixturePublication } from '../../src/contentful/fixtures';
import { publicationSchema } from '../../src/contentful/schemas';

const require = createRequire(import.meta.url);
const migration = require('../../contentful/migrations/007-remove-client-readiness-marker.cjs') as (
  migrationApi: unknown,
) => void;

describe('server-authoritative publishing readiness', () => {
  it('removes the client-written readiness field from Article', () => {
    const operations: Array<{ method: string; args: unknown[] }> = [];
    const article = {
      deleteField(...args: unknown[]) {
        operations.push({ method: 'article.deleteField', args });
        return article;
      },
    };

    migration({
      editContentType(contentTypeId: string) {
        expect(contentTypeId).toBe('article');
        return article;
      },
    });

    expect(operations).toEqual([{ method: 'article.deleteField', args: ['publishingChecks'] }]);
  });

  it('does not let a forged ready value bypass build-time dependency validation', () => {
    const input = structuredClone(fixturePublication) as unknown as {
      articles: Array<Record<string, unknown>>;
    };
    input.articles[0] = {
      ...input.articles[0],
      authorIds: ['missing-author'],
      publishingChecks: 'ready',
    };

    const result = publicationSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('missing author'))).toBe(
        true,
      );
    }
  });

  it('preserves a valid published dataset without any readiness marker', () => {
    expect(publicationSchema.safeParse(structuredClone(fixturePublication)).success).toBe(true);
  });

  it('projects a content model with no client readiness field', async () => {
    const model = JSON.parse(
      await readFile('contentful/exports/content-model-expected-after-007.json', 'utf8'),
    ) as { contentTypes: Array<{ sys: { id: string }; fields: Array<{ id: string }> }> };
    const article = model.contentTypes.find((contentType) => contentType.sys.id === 'article');

    expect(article).toBeDefined();
    expect(article?.fields.some((field) => field.id === 'publishingChecks')).toBe(false);
  });

  it('runs the privileged migration from the exact locked local dependency', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const packageLock = JSON.parse(await readFile('package-lock.json', 'utf8')) as {
      packages: Record<string, { version?: string; integrity?: string }>;
    };

    expect(packageJson.scripts['contentful:migrate:remove-publishing-marker']).toMatch(
      /^contentful-migration /,
    );
    expect(packageJson.devDependencies['contentful-migration']).toBe('5.1.0');
    expect(packageLock.packages['node_modules/contentful-migration']).toMatchObject({
      version: '5.1.0',
    });
    expect(packageLock.packages['node_modules/contentful-migration']?.integrity).toBeTruthy();
  });
});
