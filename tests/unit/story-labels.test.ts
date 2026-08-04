import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { normalizeStoryLabel, storyLabels } from '../../src/contentful/article-requirements';

const require = createRequire(import.meta.url);
const migration = require('../../contentful/migrations/005-simplify-story-labels.cjs') as ((
  migrationApi: unknown,
) => void) & {
  mapExistingStoryLabel(value: unknown): string;
};

describe('Story Label compatibility', () => {
  it.each([
    ['News', 'Standard story'],
    ['News Brief', 'Brief'],
    ['Long Form', 'Standard story'],
    ['Analysis', 'Analysis'],
    ['Opinion', 'Opinion'],
    ['Book Review', 'Review'],
  ])('normalizes legacy %s to %s at the build boundary', (legacy, expected) => {
    expect(normalizeStoryLabel(legacy)).toBe(expected);
    expect(migration.mapExistingStoryLabel(legacy)).toBe(expected);
  });

  it.each(storyLabels)('preserves current Story Label %s', (storyLabel) => {
    expect(normalizeStoryLabel(storyLabel)).toBe(storyLabel);
    expect(migration.mapExistingStoryLabel(storyLabel)).toBe(storyLabel);
  });

  it('fails closed for unsupported values', () => {
    expect(() => normalizeStoryLabel('Advertisement')).toThrow('Unsupported story label');
    expect(() => migration.mapExistingStoryLabel('Advertisement')).toThrow(
      'Unsupported existing story label',
    );
  });

  it('keeps field IDs, preserves publication state, and configures the editor questions', () => {
    const operations: Array<{ method: string; args: unknown[] }> = [];
    let transformation:
      | {
          contentType: string;
          from: string[];
          to: string[];
          shouldPublish: string;
          transformEntryForLocale(
            fields: Record<string, Record<string, unknown>>,
            locale: string,
          ): Record<string, unknown>;
        }
      | undefined;

    function fieldApi(contentTypeId: string, fieldId: string) {
      const field = {
        name(...args: unknown[]) {
          operations.push({ method: `${contentTypeId}.${fieldId}.name`, args });
          return field;
        },
        required(...args: unknown[]) {
          operations.push({ method: `${contentTypeId}.${fieldId}.required`, args });
          return field;
        },
        validations(...args: unknown[]) {
          operations.push({ method: `${contentTypeId}.${fieldId}.validations`, args });
          return field;
        },
        defaultValue(...args: unknown[]) {
          operations.push({ method: `${contentTypeId}.${fieldId}.defaultValue`, args });
          return field;
        },
      };
      return field;
    }

    function contentTypeApi(contentTypeId: string) {
      const contentType = {
        editField(fieldId: string) {
          operations.push({ method: `${contentTypeId}.editField`, args: [fieldId] });
          return fieldApi(contentTypeId, fieldId);
        },
        changeFieldControl(...args: unknown[]) {
          operations.push({ method: `${contentTypeId}.changeFieldControl`, args });
          return contentType;
        },
        description(...args: unknown[]) {
          operations.push({ method: `${contentTypeId}.description`, args });
          return contentType;
        },
      };
      return contentType;
    }

    migration({
      editContentType(contentTypeId: string) {
        return contentTypeApi(contentTypeId);
      },
      transformEntries(config: typeof transformation) {
        transformation = config;
      },
    });

    expect(operations).toContainEqual({
      method: 'article.editField',
      args: ['articleType'],
    });
    expect(operations).toContainEqual({
      method: 'article.articleType.name',
      args: ['Does this story need a special label?'],
    });
    expect(operations).toContainEqual({
      method: 'article.primaryCategory.name',
      args: ['Where does this story belong?'],
    });
    expect(operations).toContainEqual({
      method: 'article.changeFieldControl',
      args: [
        'primaryCategory',
        'builtin',
        'entryLinkEditor',
        { helpText: 'Choose the main subject or section for this story.' },
      ],
    });
    expect(transformation?.contentType).toBe('article');
    expect(transformation?.from).toEqual(['articleType']);
    expect(transformation?.to).toEqual(['articleType']);
    expect(transformation?.shouldPublish).toBe('preserve');
    expect(
      transformation?.transformEntryForLocale({ articleType: { 'en-US': 'Long Form' } }, 'en-US'),
    ).toEqual({ articleType: 'Standard story' });
  });
});
