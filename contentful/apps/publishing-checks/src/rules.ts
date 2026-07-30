import {
  articleTypes,
  conditionalRequirementsForArticle,
  type ArticleType,
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
  id: 'article-type' | 'hero-image' | 'book' | 'contentful-validation';
  label: string;
  detail: string;
  state: CheckState;
}

export interface PublishingCheckInput {
  articleType: unknown;
  heroImage: unknown;
  book: unknown;
}

export type LinkedEntryStatus = 'published' | 'draft' | 'missing' | 'unavailable';
export type ResolveLinkedEntryStatus = (entryId: string) => Promise<LinkedEntryStatus>;

function articleTypeFrom(value: unknown): ArticleType | undefined {
  return typeof value === 'string' && articleTypes.includes(value as ArticleType)
    ? (value as ArticleType)
    : undefined;
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
  const articleType = articleTypeFrom(input.articleType);
  if (!articleType) {
    return [
      {
        id: 'article-type',
        label: 'Article type',
        detail: 'Select an article type before publishing.',
        state: 'fail',
      },
      {
        id: 'hero-image',
        label: 'Hero image',
        detail: 'The requirement depends on the article type.',
        state: 'not-applicable',
      },
      {
        id: 'book',
        label: 'Book',
        detail: 'The requirement depends on the article type.',
        state: 'not-applicable',
      },
    ];
  }

  const requirements = conditionalRequirementsForArticle(articleType);
  const checks: PublishingCheck[] = [
    {
      id: 'article-type',
      label: 'Article type',
      detail: `${articleType} selected.`,
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
          detail: 'Not required for a News Brief.',
          state: 'not-applicable',
        },
  );

  checks.push(
    requirements.book
      ? await checkRequiredEntry('book', 'Book', input.book, resolveLinkedEntryStatus)
      : {
          id: 'book',
          label: 'Book',
          detail: 'Only required for a Book Review.',
          state: 'not-applicable',
        },
  );

  return checks;
}

export function publishingChecksPass(checks: PublishingCheck[]): boolean {
  return checks.every((check) => check.state !== 'fail');
}
