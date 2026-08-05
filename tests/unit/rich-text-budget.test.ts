import { describe, expect, it, vi } from 'vitest';
import { fixturePublication } from '../../src/contentful/fixtures';
import { normalizeContentfulEntries } from '../../src/contentful/normalize';
import { RICH_TEXT_BUDGET, validateRichTextBudget } from '../../src/contentful/rich-text-budget';
import { renderRichText } from '../../src/contentful/render-rich-text';
import { articleSchema } from '../../src/contentful/schemas';

const { materializeContentfulImage } = vi.hoisted(() => ({
  materializeContentfulImage: vi.fn(() => {
    throw new Error('Image materialization must not run for an over-budget article.');
  }),
}));

vi.mock('../../src/contentful/image-pipeline', () => ({ materializeContentfulImage }));

const text = (value: string) => ({ nodeType: 'text', value, marks: [], data: {} });
const documentWith = (content: unknown[]) => ({ nodeType: 'document', data: {}, content });

function documentAtDepth(depth: number): unknown {
  let node: unknown = text('Within budget');
  for (let currentDepth = depth - 1; currentDepth > 1; currentDepth -= 1) {
    node = { nodeType: 'blockquote', data: {}, content: [node] };
  }
  return documentWith([node]);
}

function rawArticleEntry(id: string, body: unknown) {
  return {
    sys: { id, contentType: { sys: { id: 'article' } } },
    fields: { body },
  } as never;
}

function rawImageEntry(id: string) {
  return {
    sys: { id, contentType: { sys: { id: 'image' } } },
    fields: {},
  } as never;
}

describe('Rich Text resource budget', () => {
  it('accepts ordinary allowed Rich Text and preserves rendering', () => {
    const document = documentWith([
      {
        nodeType: 'paragraph',
        data: {},
        content: [text('A normal publication paragraph.')],
      },
    ]);

    expect(() => validateRichTextBudget(document, 'article-normal')).not.toThrow();
    expect(renderRichText(document, 'article-normal')).toBe(
      '<p>A normal publication paragraph.</p>',
    );
  });

  it('accepts the maximum depth and rejects one level beyond it', () => {
    expect(() =>
      validateRichTextBudget(documentAtDepth(RICH_TEXT_BUDGET.maxDepth), 'article-depth'),
    ).not.toThrow();
    expect(() =>
      validateRichTextBudget(documentAtDepth(RICH_TEXT_BUDGET.maxDepth + 1), 'article-depth'),
    ).toThrow(/article-depth.*maximum depth/);
  });

  it('accepts the maximum node count and rejects one node beyond it', () => {
    const atLimit = documentWith(
      Array.from({ length: RICH_TEXT_BUDGET.maxNodes - 1 }, () => ({
        nodeType: 'hr',
        data: {},
        content: [],
      })),
    );
    const aboveLimit = documentWith([
      ...atLimit.content,
      { nodeType: 'hr', data: {}, content: [] },
    ]);

    expect(() => validateRichTextBudget(atLimit, 'article-nodes')).not.toThrow();
    expect(() => validateRichTextBudget(aboveLimit, 'article-nodes')).toThrow(
      /article-nodes.*maximum node count/,
    );
  });

  it('accepts the maximum text size and rejects one character beyond it', () => {
    const atLimit = documentWith([text('a'.repeat(RICH_TEXT_BUDGET.maxTextCharacters))]);
    const aboveLimit = documentWith([text('a'.repeat(RICH_TEXT_BUDGET.maxTextCharacters + 1))]);

    expect(() => validateRichTextBudget(atLimit, 'article-size')).not.toThrow();
    expect(() => validateRichTextBudget(aboveLimit, 'article-size')).toThrow(
      /article-size.*maximum text size/,
    );
  });

  it('bounds mark-array work without replacing the renderer mark allowlist', () => {
    const atLimit = {
      ...text('Marked text'),
      marks: ['bold', 'italic', 'underline', 'code'].map((type) => ({ type })),
    };
    const tooManyMarks = structuredClone(atLimit);
    tooManyMarks.marks.push({ type: 'bold' });

    expect(() => validateRichTextBudget(documentWith([atLimit]), 'article-marks')).not.toThrow();
    expect(() => validateRichTextBudget(documentWith([tooManyMarks]), 'article-marks')).toThrow(
      /article-marks.*marks on one node/,
    );
  });

  it('rejects excessive depth at the raw Contentful boundary before normalization work', async () => {
    materializeContentfulImage.mockClear();
    await expect(
      normalizeContentfulEntries([
        rawArticleEntry('article-raw-depth', documentAtDepth(RICH_TEXT_BUDGET.maxDepth + 1)),
        rawImageEntry('image-must-not-run'),
      ]),
    ).rejects.toThrow(/article-raw-depth.*maximum depth/);
    expect(materializeContentfulImage).not.toHaveBeenCalled();
  });

  it('applies the same fail-closed budget to direct rendering', () => {
    expect(() =>
      renderRichText(
        documentWith([text('a'.repeat(RICH_TEXT_BUDGET.maxTextCharacters + 1))]),
        'article-render-size',
      ),
    ).toThrow(/article-render-size.*maximum text size/);
  });

  it('applies the budget at the Zod article boundary', () => {
    const article = structuredClone(fixturePublication.articles[0]!);
    article.body = documentWith([
      text('a'.repeat(RICH_TEXT_BUDGET.maxTextCharacters + 1)),
    ]) as typeof article.body;

    expect(articleSchema.safeParse(article).success).toBe(false);
  });
});
