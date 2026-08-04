import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const migration = require('../../contentful/migrations/006-clean-homepage-controls.cjs') as (
  migrationApi: unknown,
) => void;

describe('Homepage editor controls migration', () => {
  it('uses plain editorial names and hides fields the site does not render', () => {
    const operations: Array<{ method: string; args: unknown[] }> = [];

    function fieldApi(fieldId: string) {
      const field = {
        name(...args: unknown[]) {
          operations.push({ method: `${fieldId}.name`, args });
          return field;
        },
        validations(...args: unknown[]) {
          operations.push({ method: `${fieldId}.validations`, args });
          return field;
        },
        omitted(...args: unknown[]) {
          operations.push({ method: `${fieldId}.omitted`, args });
          return field;
        },
        disabled(...args: unknown[]) {
          operations.push({ method: `${fieldId}.disabled`, args });
          return field;
        },
      };
      return field;
    }

    const homepage = {
      description(...args: unknown[]) {
        operations.push({ method: 'homepage.description', args });
        return homepage;
      },
      editField(fieldId: string) {
        operations.push({ method: 'homepage.editField', args: [fieldId] });
        return fieldApi(fieldId);
      },
      changeFieldControl(...args: unknown[]) {
        operations.push({ method: 'homepage.changeFieldControl', args });
        return homepage;
      },
    };

    migration({
      editContentType(contentTypeId: string) {
        expect(contentTypeId).toBe('homepage');
        return homepage;
      },
    });

    expect(operations).toContainEqual({ method: 'leadArticle.name', args: ['Featured article'] });
    expect(operations).toContainEqual({
      method: 'secondaryLeadArticles.name',
      args: ['Editor’s picks'],
    });
    for (const fieldId of ['breakingNewsArticles', 'categoryDisplayOrder']) {
      expect(operations).toContainEqual({ method: `${fieldId}.omitted`, args: [true] });
      expect(operations).toContainEqual({ method: `${fieldId}.disabled`, args: [true] });
    }
    for (const fieldId of [
      'secondaryLeadArticles',
      'featuredAnalysis',
      'featuredOpinions',
      'featuredBookReviews',
    ]) {
      expect(operations).toContainEqual({
        method: `${fieldId}.validations`,
        args: [[{ size: { max: 3 } }]],
      });
    }
  });
});
