import type { Article, Publication, PublicationIndexes } from '../contentful/types';

export function createIndexes(publication: Publication): PublicationIndexes {
  return {
    articles: new Map(publication.articles.map((item) => [item.id, item])),
    authors: new Map(publication.authors.map((item) => [item.id, item])),
    books: new Map(publication.books.map((item) => [item.id, item])),
    categories: new Map(publication.categories.map((item) => [item.id, item])),
    sources: new Map(publication.sources.map((item) => [item.id, item])),
    topics: new Map(publication.topics.map((item) => [item.id, item])),
  };
}

export function sortArticles(articles: Article[]): Article[] {
  return [...articles].sort(
    (left, right) => Date.parse(right.publicationDate) - Date.parse(left.publicationDate),
  );
}

export function publishedArticles(publication: Publication): Article[] {
  return sortArticles(publication.articles);
}

export function articlesByLabel(
  publication: Publication,
  labels: Article['storyLabel'][],
): Article[] {
  return publishedArticles(publication).filter((article) => labels.includes(article.storyLabel));
}

export function distinctCategoryLabel(
  storyLabel: string,
  categoryName?: string,
): string | undefined {
  const label = categoryName?.trim();
  if (!label || label.toLocaleLowerCase('en-US') === storyLabel.trim().toLocaleLowerCase('en-US')) {
    return undefined;
  }
  return label;
}

const publicStoryLabels: Record<Article['storyLabel'], string | undefined> = {
  'Standard story': undefined,
  Brief: 'Brief',
  Analysis: 'Analysis',
  Opinion: 'Opinion',
  Review: 'Review',
};

export function displayStoryLabel(storyLabel: Article['storyLabel']): string | undefined {
  return publicStoryLabels[storyLabel];
}

export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 225));
}

export function sanitizeExternalUrl(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  return url.toString();
}

export function sanitizeLinkUrl(value: string): string {
  // eslint-disable-next-line no-control-regex -- URL input must explicitly reject ASCII controls.
  if (/[\u0000-\u0020\u007f]/.test(value) || value.includes('\\')) {
    throw new Error('Link URLs cannot contain whitespace, control characters, or backslashes.');
  }

  if (value.startsWith('/')) {
    if (value.startsWith('//')) {
      throw new Error('Protocol-relative link URLs are not supported.');
    }
    return value;
  }

  return sanitizeExternalUrl(value);
}

export function serializeJsonForHtml(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('Structured data must be JSON-serializable.');
  }

  const escapes: Record<string, string> = {
    '<': '\\u003c',
    '>': '\\u003e',
    '&': '\\u0026',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
  };
  return serialized.replace(/[<>&\u2028\u2029]/g, (character) => escapes[character]!);
}

export function normalizeSlug(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/\p{Mark}/gu, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatPublicationDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function plainTextFromRichText(document: unknown): string {
  if (!document || typeof document !== 'object') return '';
  const node = document as { value?: unknown; content?: unknown[] };
  const ownValue = typeof node.value === 'string' ? node.value : '';
  const children = Array.isArray(node.content)
    ? node.content.map((child) => plainTextFromRichText(child)).join(' ')
    : '';
  return `${ownValue} ${children}`.trim();
}
