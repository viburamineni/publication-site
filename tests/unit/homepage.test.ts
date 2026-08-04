import { describe, expect, it } from 'vitest';
import { fixturePublication } from '../../src/contentful/fixtures';
import { publishedArticles } from '../../src/utilities/content';
import { selectHomepageContent } from '../../src/utilities/homepage';

describe('homepage selection', () => {
  it('uses the newest featured Article when no Homepage entry is published', () => {
    const articles = publishedArticles(fixturePublication).map((article, index) => ({
      ...article,
      featured: index === 1 || index === 3,
    }));
    const selection = selectHomepageContent(
      { ...fixturePublication.homepage, curated: false },
      articles,
      fixturePublication.topics,
    );

    expect(selection.leadArticleId).toBe(articles[1]!.id);
    expect(selection.editorPickIds).toEqual([articles[0]!.id, articles[2]!.id]);
    expect(selection.analysisIds).toEqual(
      articles
        .filter((article) => article.storyLabel === 'Analysis')
        .slice(0, 3)
        .map((article) => article.id),
    );
    expect(selection.featuredTopicId).toBe('topic-world-events');
  });

  it('falls back to the newest Article when nothing is featured', () => {
    const articles = publishedArticles(fixturePublication).map((article) => ({
      ...article,
      featured: false,
    }));
    const selection = selectHomepageContent(
      { ...fixturePublication.homepage, curated: false },
      articles,
      fixturePublication.topics,
    );

    expect(selection.leadArticleId).toBe(articles[0]!.id);
  });

  it('uses the published Homepage entry as the complete manual selection', () => {
    const articles = publishedArticles(fixturePublication);
    const lead = articles[3]!;
    const editorPicks = [articles[0]!, articles[1]!, articles[2]!];
    const selection = selectHomepageContent(
      {
        ...fixturePublication.homepage,
        curated: true,
        leadArticleId: lead.id,
        secondaryLeadArticleIds: [
          lead.id,
          editorPicks[0]!.id,
          editorPicks[0]!.id,
          ...editorPicks.map((article) => article.id),
        ],
        featuredAnalysisIds: [articles[4]!.id],
        featuredOpinionIds: [articles[5]!.id],
        featuredReviewIds: [articles[6]!.id],
        featuredTopicId: 'topic-geopolitics',
      },
      articles,
      fixturePublication.topics,
    );

    expect(selection).toEqual({
      leadArticleId: lead.id,
      editorPickIds: editorPicks.map((article) => article.id),
      analysisIds: [articles[4]!.id],
      opinionIds: [articles[5]!.id],
      reviewIds: [articles[6]!.id],
      featuredTopicId: 'topic-geopolitics',
    });
  });

  it('allows a curated Homepage entry to intentionally hide optional sections', () => {
    const selection = selectHomepageContent(
      { ...fixturePublication.homepage, curated: true },
      publishedArticles(fixturePublication),
      fixturePublication.topics,
    );

    expect(selection.editorPickIds).toEqual([]);
    expect(selection.analysisIds).toEqual([]);
    expect(selection.opinionIds).toEqual([]);
    expect(selection.reviewIds).toEqual([]);
    expect(selection.featuredTopicId).toBeUndefined();
  });
});
