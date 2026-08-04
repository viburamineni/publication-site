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
  id: 'story-label' | 'hero-image' | 'book' | 'contentful-validation';
  label: string;
  detail: string;
  state: CheckState;
}

export interface PublishingCheckInput {
  storyLabel: unknown;
  heroImage: unknown;
  book: unknown;
}

export type LinkedEntryStatus = 'published' | 'draft' | 'missing' | 'unavailable';
export type ResolveLinkedEntryStatus = (entryId: string) => Promise<LinkedEntryStatus>;

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

async function checkRequiredEntry(
  id: PublishingCheck['id'],
  label: string,
  value: unknown,
  resolveLinkedEntryStatus: ResolveLinkedEntryStatus,
): Promise<PublishingCheck> {
  const entryId = entryIdFrom(value);
  if (!entryId) {
    return {
      id,
      label,
      detail: `Choose a ${label.toLocaleLowerCase('en-US')} before publishing.`,
      state: 'fail',
    };
  }

  const status = await resolveLinkedEntryStatus(entryId);
  if (status === 'published') {
    return {
      id,
      label,
      detail: `${label} is selected and published.`,
      state: 'pass',
    };
  }

  const detail =
    status === 'draft'
      ? `Publish the selected ${label.toLocaleLowerCase('en-US')} before publishing this article.`
      : status === 'missing'
        ? `The selected ${label.toLocaleLowerCase('en-US')} could not be found. Choose another one.`
        : `The selected ${label.toLocaleLowerCase('en-US')} could not be verified. Check again.`;

  return { id, label, detail, state: 'fail' };
}

export async function evaluatePublishingChecks(
  input: PublishingCheckInput,
  resolveLinkedEntryStatus: ResolveLinkedEntryStatus,
): Promise<PublishingCheck[]> {
  const storyLabel = storyLabelFrom(input.storyLabel);
  if (!storyLabel) {
    return [
      {
        id: 'story-label',
        label: 'Story label',
        detail: 'Choose a valid story label before publishing.',
        state: 'fail',
      },
      {
        id: 'hero-image',
        label: 'Hero image',
        detail: 'The requirement depends on the story label.',
        state: 'not-applicable',
      },
      {
        id: 'book',
        label: 'Book',
        detail: 'The requirement depends on the story label.',
        state: 'not-applicable',
      },
    ];
  }

  const requirements = conditionalRequirementsForArticle(storyLabel);
  const checks: PublishingCheck[] = [
    {
      id: 'story-label',
      label: 'Story label',
      detail: `${storyLabel} selected.`,
      state: 'pass',
    },
  ];

  checks.push(
    requirements.heroImage
      ? await checkRequiredEntry(
          'hero-image',
          'Hero image',
          input.heroImage,
          resolveLinkedEntryStatus,
        )
      : {
          id: 'hero-image',
          label: 'Hero image',
          detail: 'Not required for a Brief.',
          state: 'not-applicable',
        },
  );

  const selectedBookId = entryIdFrom(input.book);
  if (selectedBookId) {
    checks.push(await checkRequiredEntry('book', 'Book', input.book, resolveLinkedEntryStatus));
  } else {
    checks.push({
      id: 'book',
      label: 'Book',
      detail:
        storyLabel === 'Review'
          ? 'Optional. Add a Book when this Review is about a book.'
          : 'Not attached.',
      state: 'not-applicable',
    });
  }

  return checks;
}

export function publishingChecksPass(checks: PublishingCheck[]): boolean {
  return checks.every((check) => check.state !== 'fail');
}
