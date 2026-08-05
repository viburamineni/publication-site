import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { normalizeContentfulEntries } from '../../src/contentful/normalize';
import { fixturePublication } from '../../src/contentful/fixtures';
import { articleSchema } from '../../src/contentful/schemas';

const require = createRequire(import.meta.url);
const migration = require('../../contentful/migrations/008-protect-internal-notes.cjs') as (
  migrationApi: unknown,
) => void;

describe('private Article internal notes boundary', () => {
  it('marks internalNotes omitted without disabling or deleting the editor field', () => {
    const operations: Array<{ method: string; args: unknown[] }> = [];
    const internalNotes = {
      omitted(...args: unknown[]) {
        operations.push({ method: 'internalNotes.omitted', args });
        return internalNotes;
      },
    };
    const article = {
      editField(...args: unknown[]) {
        operations.push({ method: 'article.editField', args });
        return internalNotes;
      },
    };

    migration({
      editContentType(contentTypeId: string) {
        expect(contentTypeId).toBe('article');
        return article;
      },
    });

    expect(operations).toEqual([
      { method: 'article.editField', args: ['internalNotes'] },
      { method: 'internalNotes.omitted', args: [true] },
    ]);
  });

  it('projects internalNotes out of Delivery API responses while preserving editor access', async () => {
    const model = JSON.parse(
      await readFile('contentful/exports/content-model-expected-after-008.json', 'utf8'),
    ) as {
      contentTypes: Array<{
        sys: { id: string };
        fields: Array<{ id: string; omitted: boolean; disabled: boolean }>;
      }>;
      projection: { source: string; migration: string; appliedToContentful: boolean };
    };
    const article = model.contentTypes.find((contentType) => contentType.sys.id === 'article');
    const internalNotes = article?.fields.find((field) => field.id === 'internalNotes');

    expect(internalNotes).toMatchObject({ omitted: true, disabled: false });
    expect(model.projection).toEqual({
      source: 'content-model-expected-after-007.json',
      migration: 'contentful/migrations/008-protect-internal-notes.cjs',
      appliedToContentful: false,
    });
  });

  it('fails closed if a Delivery API payload still contains internalNotes', async () => {
    const exposedArticle = {
      sys: {
        id: 'article-with-exposed-notes',
        contentType: { sys: { id: 'article' } },
      },
      fields: {
        internalNotes: 'private editorial note',
      },
    };

    await expect(normalizeContentfulEntries([exposedArticle] as never)).rejects.toThrow(
      'exposed private field internalNotes through the Delivery API',
    );
  });

  it('rejects private notes at the normalized Zod boundary and preserves valid articles', () => {
    const article = structuredClone(fixturePublication.articles[0]!);

    expect(articleSchema.safeParse(article).success).toBe(true);
    expect(
      articleSchema.safeParse({ ...article, internalNotes: 'private editorial note' }).success,
    ).toBe(false);
  });

  it('uses the locked local migration toolchain', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(packageJson.scripts['contentful:migrate:protect-internal-notes']).toMatch(
      /^contentful-migration /,
    );
    expect(packageJson.devDependencies['contentful-migration']).toBe('5.1.0');
  });
});
