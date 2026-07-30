export const articleTypes = [
  'News Brief',
  'News',
  'Long Form',
  'Analysis',
  'Opinion',
  'Book Review',
] as const;

export type ArticleType = (typeof articleTypes)[number];

export interface ArticleConditionalRequirements {
  heroImage: boolean;
  book: boolean;
}

export function conditionalRequirementsForArticle(
  articleType: ArticleType,
): ArticleConditionalRequirements {
  return {
    heroImage: articleType !== 'News Brief',
    book: articleType === 'Book Review',
  };
}
