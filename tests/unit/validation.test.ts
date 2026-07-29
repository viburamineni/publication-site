import { describe, expect, it } from 'vitest';
import { fixturePublication } from '../../src/contentful/fixtures';
import { articleSchema, publicationSchema } from '../../src/contentful/schemas';

function copyFixture() {
  return structuredClone(fixturePublication);
}

describe('publication validation', () => {
  it('accepts the committed fixture', () => {
    expect(publicationSchema.safeParse(copyFixture()).success).toBe(true);
  });

  it.each([
    ['author', 'authorIds', ['missing-author']],
    ['category', 'primaryCategoryId', 'missing-category'],
    ['related article', 'relatedArticleIds', ['missing-article']],
  ])('rejects a missing %s reference', (_label, field, value) => {
    const publication = copyFixture();
    Object.assign(publication.articles[0]!, { [field]: value });
    expect(publicationSchema.safeParse(publication).success).toBe(false);
  });

  it('rejects duplicate article slugs', () => {
    const publication = copyFixture();
    publication.articles[1]!.slug = publication.articles[0]!.slug;
    expect(publicationSchema.safeParse(publication).success).toBe(false);
  });

  it('rejects redirect syntax in previous article slugs', () => {
    const article = copyFixture().articles[0]!;
    expect(
      articleSchema.safeParse({
        ...article,
        previousSlugs: ['legacy\n/* https://attacker.example/:splat 302\n#'],
      }).success,
    ).toBe(false);
    expect(articleSchema.safeParse({ ...article, previousSlugs: ['valid-previous-slug'] }).success).toBe(
      true,
    );
  });

  it('rejects executable footer URLs while preserving internal links', () => {
    const publication = copyFixture();
    publication.settings.footerSections[0]!.links[0]!.url = 'javascript:alert(1)';
    expect(publicationSchema.safeParse(publication).success).toBe(false);

    publication.settings.footerSections[0]!.links[0]!.url = '/about/';
    expect(publicationSchema.safeParse(publication).success).toBe(true);
  });

  it('rejects missing image alt text or credit', () => {
    const article = copyFixture().articles.find((item) => item.heroImage)!;
    const noAlt = structuredClone(article);
    noAlt.heroImage!.alt = '';
    const noCredit = structuredClone(article);
    noCredit.heroImage!.credit = '';
    expect(articleSchema.safeParse(noAlt).success).toBe(false);
    expect(articleSchema.safeParse(noCredit).success).toBe(false);
  });

  it('rejects invalid article types and book reviews without books', () => {
    const article = copyFixture().articles[0]!;
    expect(articleSchema.safeParse({ ...article, articleType: 'Advertisement' }).success).toBe(
      false,
    );
    expect(
      articleSchema.safeParse({ ...article, articleType: 'Book Review', bookId: undefined })
        .success,
    ).toBe(false);
  });
});
