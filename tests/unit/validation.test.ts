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

  it('rejects previous slugs that capture current article routes, including self-loops', () => {
    const capturesAnotherRoute = copyFixture();
    capturesAnotherRoute.articles[0]!.previousSlugs = [capturesAnotherRoute.articles[1]!.slug];
    expect(publicationSchema.safeParse(capturesAnotherRoute).success).toBe(false);

    const selfLoop = copyFixture();
    selfLoop.articles[0]!.previousSlugs = [selfLoop.articles[0]!.slug];
    expect(publicationSchema.safeParse(selfLoop).success).toBe(false);
  });

  it('rejects duplicate ownership of a historical article slug', () => {
    const publication = copyFixture();
    publication.articles[0]!.previousSlugs = ['shared-historical-slug'];
    publication.articles[1]!.previousSlugs = ['shared-historical-slug'];
    expect(publicationSchema.safeParse(publication).success).toBe(false);
  });

  it('rejects redirect chains and cycles assembled from otherwise valid slugs', () => {
    const chain = copyFixture();
    chain.articles[0]!.previousSlugs = [chain.articles[1]!.slug];
    chain.articles[1]!.previousSlugs = ['older-historical-slug'];
    expect(publicationSchema.safeParse(chain).success).toBe(false);

    const cycle = copyFixture();
    cycle.articles[0]!.previousSlugs = [cycle.articles[1]!.slug];
    cycle.articles[1]!.previousSlugs = [cycle.articles[0]!.slug];
    expect(publicationSchema.safeParse(cycle).success).toBe(false);
  });

  it('accepts uniquely owned historical slugs that point directly to canonical articles', () => {
    const publication = copyFixture();
    publication.articles[0]!.previousSlugs = ['first-historical-slug'];
    publication.articles[1]!.previousSlugs = ['second-historical-slug'];
    expect(publicationSchema.safeParse(publication).success).toBe(true);
  });

  it('rejects missing Homepage article and topic references', () => {
    const missingArticle = copyFixture();
    missingArticle.homepage.leadArticleId = 'missing-homepage-article';
    expect(publicationSchema.safeParse(missingArticle).success).toBe(false);

    const missingTopic = copyFixture();
    missingTopic.homepage.featuredTopicId = 'missing-homepage-topic';
    expect(publicationSchema.safeParse(missingTopic).success).toBe(false);
  });

  it('rejects redirect syntax in previous article slugs', () => {
    const article = copyFixture().articles[0]!;
    expect(
      articleSchema.safeParse({
        ...article,
        previousSlugs: ['legacy\n/* https://attacker.example/:splat 302\n#'],
      }).success,
    ).toBe(false);
    expect(
      articleSchema.safeParse({ ...article, previousSlugs: ['valid-previous-slug'] }).success,
    ).toBe(true);
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

  it('rejects invalid Story Labels and allows Reviews without Book metadata', () => {
    const article = copyFixture().articles[0]!;
    expect(articleSchema.safeParse({ ...article, storyLabel: 'Advertisement' }).success).toBe(
      false,
    );
    expect(
      articleSchema.safeParse({ ...article, storyLabel: 'Review', bookId: undefined }).success,
    ).toBe(true);
  });

  it('requires hero images for every Story Label except Brief', () => {
    const article = copyFixture().articles[0]!;
    expect(
      articleSchema.safeParse({ ...article, storyLabel: 'Brief', heroImage: undefined }).success,
    ).toBe(true);
    for (const storyLabel of ['Standard story', 'Analysis', 'Opinion', 'Review'] as const) {
      expect(
        articleSchema.safeParse({ ...article, storyLabel, heroImage: undefined }).success,
        storyLabel,
      ).toBe(false);
    }
  });

  it('covers all Story Labels and allows multiple labels in one Category', () => {
    const publication = copyFixture();
    expect(new Set(publication.articles.map((article) => article.storyLabel))).toEqual(
      new Set(['Standard story', 'Brief', 'Analysis', 'Opinion', 'Review']),
    );

    const americasLabels = new Set(
      publication.articles
        .filter((article) => article.primaryCategoryId === 'category-americas')
        .map((article) => article.storyLabel),
    );
    expect(americasLabels).toEqual(new Set(['Standard story', 'Brief']));
  });

  it('preserves the requested publication taxonomy and navigation order', () => {
    const publication = copyFixture();
    expect(publication.settings.publicationName).toBe('The Transoceanic Cable');
    expect(publication.categories.map((category) => category.name)).toEqual([
      'Analysis',
      'Guest Articles',
      'Culture and History',
      'Africa',
      'Americas',
      'Asia',
      'Australia and Oceania',
      'Europe',
    ]);
    expect(publication.topics.map((topic) => topic.name)).toEqual([
      'Book Reviews',
      'Invitational Pieces',
      'Analysis',
      'World History',
      'World Events',
      'Geopolitics',
    ]);
  });
});
