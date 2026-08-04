import type { Article, Homepage, Topic } from '../contentful/types';

export interface HomepageSelection {
  leadArticleId?: string;
  editorPickIds: string[];
  analysisIds: string[];
  opinionIds: string[];
  reviewIds: string[];
  featuredTopicId?: string;
}

function uniqueIds(ids: string[], excludedId?: string): string[] {
  return [...new Set(ids)].filter((id) => id !== excludedId);
}

export function selectHomepageContent(
  homepage: Homepage,
  orderedArticles: Article[],
  topics: Topic[],
): HomepageSelection {
  const automaticLead = orderedArticles.find((article) => article.featured) ?? orderedArticles[0];
  const automaticTopic = topics.find((topic) => topic.featured);
  const leadArticleId = homepage.leadArticleId ?? automaticLead?.id;

  if (homepage.curated) {
    return {
      ...(leadArticleId ? { leadArticleId } : {}),
      editorPickIds: uniqueIds(homepage.secondaryLeadArticleIds, leadArticleId).slice(0, 3),
      analysisIds: uniqueIds(homepage.featuredAnalysisIds).slice(0, 3),
      opinionIds: uniqueIds(homepage.featuredOpinionIds).slice(0, 3),
      reviewIds: uniqueIds(homepage.featuredReviewIds).slice(0, 3),
      ...(homepage.featuredTopicId ? { featuredTopicId: homepage.featuredTopicId } : {}),
    };
  }

  return {
    ...(leadArticleId ? { leadArticleId } : {}),
    editorPickIds: orderedArticles
      .filter((article) => article.id !== leadArticleId)
      .slice(0, 2)
      .map((article) => article.id),
    analysisIds: orderedArticles
      .filter((article) => article.storyLabel === 'Analysis')
      .slice(0, 3)
      .map((article) => article.id),
    opinionIds: orderedArticles
      .filter((article) => article.storyLabel === 'Opinion')
      .slice(0, 3)
      .map((article) => article.id),
    reviewIds: orderedArticles
      .filter((article) => article.storyLabel === 'Review')
      .slice(0, 3)
      .map((article) => article.id),
    ...(automaticTopic ? { featuredTopicId: automaticTopic.id } : {}),
  };
}
