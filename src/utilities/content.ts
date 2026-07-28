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

export function approvedArticles(publication: Publication): Article[] {
  return sortArticles(
    publication.articles.filter((article) => article.editorialState === 'Approved'),
  );
}

export function articlesByType(
  publication: Publication,
  types: Article['articleType'][],
): Article[] {
  return approvedArticles(publication).filter((article) => types.includes(article.articleType));
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
