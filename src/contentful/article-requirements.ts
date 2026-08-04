export const storyLabels = ['Standard story', 'Brief', 'Analysis', 'Opinion', 'Review'] as const;

export type StoryLabel = (typeof storyLabels)[number];

const storyLabelCompatibilityMap: Record<string, StoryLabel> = {
  'Standard story': 'Standard story',
  Brief: 'Brief',
  Analysis: 'Analysis',
  Opinion: 'Opinion',
  Review: 'Review',
  News: 'Standard story',
  'News Brief': 'Brief',
  'Long Form': 'Standard story',
  'Book Review': 'Review',
};

export function normalizeStoryLabel(value: unknown): StoryLabel {
  if (typeof value !== 'string' || !storyLabelCompatibilityMap[value]) {
    throw new Error(`Unsupported story label: ${String(value)}`);
  }
  return storyLabelCompatibilityMap[value];
}

export interface ArticleConditionalRequirements {
  heroImage: boolean;
}

export function conditionalRequirementsForArticle(
  storyLabel: StoryLabel,
): ArticleConditionalRequirements {
  return {
    heroImage: storyLabel !== 'Brief',
  };
}
