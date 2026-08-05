import {
  conditionalRequirementsForArticle,
  normalizeStoryLabel,
  type StoryLabel,
} from '../../../../src/contentful/article-requirements';

export type CheckState = 'pass' | 'fail' | 'not-applicable';

export interface EntryLink {
  sys?: {
    id?: unknown;
    linkType?: unknown;
    type?: unknown;
  };
}

export interface PublishingCheck {
  id:
    | 'story-label'
    | 'authors'
    | 'category'
    | 'topics'
    | 'hero-image'
    | 'sources'
    | 'book'
    | 'related-articles'
    | 'body-references'
    | 'contentful-validation';
  label: string;
  detail: string;
  state: CheckState;
}

export interface PublishingCheckInput {
  storyLabel: unknown;
  authors: unknown;
  primaryCategory: unknown;
  topics: unknown;
  heroImage: unknown;
  sources: unknown;
  book: unknown;
  relatedArticles: unknown;
  bodyReferences: unknown;
}

export type LinkedEntryStatus =
  | 'published'
  | 'draft'
  | 'missing'
  | 'unavailable'
  | 'dependency-draft'
  | 'dependency-missing'
  | 'dependency-unavailable';
export type ResolveLinkedEntryStatus = (entryId: string) => Promise<LinkedEntryStatus>;

export interface RefreshSequence {
  next(): number;
  isCurrent(sequence: number): boolean;
}

export function createRefreshSequence(): RefreshSequence {
  let current = 0;
  return {
    next: () => ++current,
    isCurrent: (sequence) => sequence === current,
  };
}

interface ReferenceCheckOptions {
  id: PublishingCheck['id'];
  label: string;
  singular: string;
  plural: string;
  value: unknown;
  required: boolean;
  resolveLinkedEntryStatus: ResolveLinkedEntryStatus;
  emptyDetail?: string;
}

function storyLabelFrom(value: unknown): StoryLabel | undefined {
  try {
    return normalizeStoryLabel(value);
  } catch {
    return undefined;
  }
}

function entryIdFrom(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const id = (value as EntryLink).sys?.id;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

function entryIdsFrom(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map(entryIdFrom).filter((id): id is string => Boolean(id)))];
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function failureDetail(statuses: LinkedEntryStatus[], singular: string, plural: string): string {
  const count = statuses.length;
  const subject = countLabel(count, singular, plural);
  if (statuses.some((status) => status === 'draft')) {
    return `${subject} ${count === 1 ? 'is' : 'are'} still in draft. Publish before publishing this article.`;
  }
  if (statuses.some((status) => status === 'missing')) {
    return `${subject} could not be found. Remove or replace the missing selection before publishing.`;
  }
  if (statuses.some((status) => status === 'dependency-draft')) {
    return `${subject} ${count === 1 ? 'has' : 'have'} an unpublished linked entry or asset. Publish it before publishing this article.`;
  }
  if (statuses.some((status) => status === 'dependency-missing')) {
    return `${subject} ${count === 1 ? 'has' : 'have'} a missing linked entry or asset. Repair the selection before publishing.`;
  }
  return `${subject} could not be completely verified. Check again before publishing.`;
}

async function checkReferences(options: ReferenceCheckOptions): Promise<PublishingCheck> {
  const entryIds = entryIdsFrom(options.value);
  if (entryIds.length === 0) {
    return {
      id: options.id,
      label: options.label,
      detail:
        options.emptyDetail ??
        (options.required
          ? `Choose ${options.singular === 'author' ? 'an' : 'a'} ${options.singular} before publishing.`
          : `No ${options.plural} attached.`),
      state: options.required ? 'fail' : 'not-applicable',
    };
  }

  const statuses = await Promise.all(entryIds.map(options.resolveLinkedEntryStatus));
  const failures = statuses.filter((status) => status !== 'published');
  if (failures.length > 0) {
    return {
      id: options.id,
      label: options.label,
      detail: failureDetail(failures, options.singular, options.plural),
      state: 'fail',
    };
  }

  return {
    id: options.id,
    label: options.label,
    detail: `${countLabel(entryIds.length, options.singular, options.plural)} selected and published.`,
    state: 'pass',
  };
}

export async function evaluatePublishingChecks(
  input: PublishingCheckInput,
  resolveLinkedEntryStatus: ResolveLinkedEntryStatus,
): Promise<PublishingCheck[]> {
  const storyLabel = storyLabelFrom(input.storyLabel);
  const checks: PublishingCheck[] = [
    storyLabel
      ? {
          id: 'story-label',
          label: 'Story label',
          detail: `${storyLabel} selected.`,
          state: 'pass',
        }
      : {
          id: 'story-label',
          label: 'Story label',
          detail: 'Choose a valid story label before publishing.',
          state: 'fail',
        },
  ];

  checks.push(
    await checkReferences({
      id: 'authors',
      label: 'Authors',
      singular: 'author',
      plural: 'authors',
      value: input.authors,
      required: true,
      resolveLinkedEntryStatus,
    }),
    await checkReferences({
      id: 'category',
      label: 'Category',
      singular: 'category',
      plural: 'categories',
      value: input.primaryCategory,
      required: true,
      resolveLinkedEntryStatus,
    }),
    await checkReferences({
      id: 'topics',
      label: 'Topics',
      singular: 'topic',
      plural: 'topics',
      value: input.topics,
      required: false,
      resolveLinkedEntryStatus,
    }),
  );

  if (!storyLabel) {
    checks.push({
      id: 'hero-image',
      label: 'Hero image',
      detail: 'The requirement depends on the story label.',
      state: 'not-applicable',
    });
  } else if (conditionalRequirementsForArticle(storyLabel).heroImage) {
    checks.push(
      await checkReferences({
        id: 'hero-image',
        label: 'Hero image',
        singular: 'hero image',
        plural: 'hero images',
        value: input.heroImage,
        required: true,
        resolveLinkedEntryStatus,
      }),
    );
  } else {
    checks.push({
      id: 'hero-image',
      label: 'Hero image',
      detail: 'Not required for a Brief.',
      state: 'not-applicable',
    });
  }

  checks.push(
    await checkReferences({
      id: 'sources',
      label: 'Sources',
      singular: 'source',
      plural: 'sources',
      value: input.sources,
      required: false,
      resolveLinkedEntryStatus,
    }),
    await checkReferences({
      id: 'book',
      label: 'Book',
      singular: 'book',
      plural: 'books',
      value: input.book,
      required: false,
      emptyDetail:
        storyLabel === 'Review'
          ? 'Optional. Add a Book when this Review is about a book.'
          : 'No Book attached.',
      resolveLinkedEntryStatus,
    }),
    await checkReferences({
      id: 'related-articles',
      label: 'Related articles',
      singular: 'related article',
      plural: 'related articles',
      value: input.relatedArticles,
      required: false,
      resolveLinkedEntryStatus,
    }),
    await checkReferences({
      id: 'body-references',
      label: 'Body links',
      singular: 'linked entry',
      plural: 'linked entries',
      value: input.bodyReferences,
      required: false,
      emptyDetail: 'No linked entries in the story body.',
      resolveLinkedEntryStatus,
    }),
  );

  return checks;
}

export function publishingChecksPass(checks: PublishingCheck[]): boolean {
  return checks.every((check) => check.state !== 'fail');
}
