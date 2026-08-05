import type { Entry, EntrySkeletonType } from 'contentful';
import { publicationSchema } from './schemas';
import type { Article, Image, Publication } from './types';
import {
  inspectContentfulImage,
  materializeContentfulImage,
  type RawImageFields,
} from './image-pipeline';
import { normalizeStoryLabel } from './article-requirements';
import { validateRichTextBudget } from './rich-text-budget';
import {
  estimateReadingMinutes,
  plainTextFromRichText,
  sanitizeExternalUrl,
  sortArticles,
} from '../utilities/content';

type RawEntry = Entry<EntrySkeletonType, undefined, string>;
type Fields = Record<string, any>;

export const IMAGE_FANOUT_BUDGET = Object.freeze({
  maxImages: 1_500,
  maxVariants: 4_000,
  maxEstimatedDownloadBytes: 512 * 1024 * 1024,
});

function contentType(entry: RawEntry): string {
  return entry.sys.contentType.sys.id;
}

function fields(entry: RawEntry): Fields {
  return entry.fields as Fields;
}

function assertPrivateArticleFieldsOmitted(value: Fields, entryId: string): void {
  if (Object.hasOwn(value, 'internalNotes')) {
    throw new Error(
      `Entry ${entryId} exposed private field internalNotes through the Delivery API. Apply the internal-notes content model migration before building.`,
    );
  }
}

function referenceId(value: unknown, ownerId: string, fieldName: string): string {
  if (
    value &&
    typeof value === 'object' &&
    'sys' in value &&
    typeof (value as { sys?: { id?: unknown } }).sys?.id === 'string'
  ) {
    return (value as { sys: { id: string } }).sys.id;
  }
  throw new Error(`Entry ${ownerId} has an unresolved required reference in ${fieldName}.`);
}

function referenceIds(value: unknown, ownerId: string, fieldName: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`Entry ${ownerId} must use a reference list in ${fieldName}.`);
  }
  return value.map((item) => referenceId(item, ownerId, fieldName));
}

function dateTime(value: unknown, ownerId: string, fieldName: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`Entry ${ownerId} contains an invalid date in ${fieldName}.`);
  }
  return new Date(value).toISOString();
}

function optionalDateTime(value: unknown, ownerId: string, fieldName: string): string | undefined {
  return value ? dateTime(value, ownerId, fieldName) : undefined;
}

function jsonLinks(value: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { label: string; url: string } =>
      Boolean(
        item &&
        typeof item === 'object' &&
        typeof (item as { label?: unknown }).label === 'string' &&
        typeof (item as { url?: unknown }).url === 'string',
      ),
    )
    .map((item) => ({ label: item.label, url: sanitizeExternalUrl(item.url) }));
}

function collectEmbeddedImageIds(value: unknown, imageIds: ReadonlySet<string>): string[] {
  if (!value || typeof value !== 'object') return [];
  const result: string[] = [];
  const stack = [value];
  while (stack.length > 0) {
    const node = stack.pop() as {
      nodeType?: string;
      data?: { target?: { sys?: { id?: unknown } } };
      content?: unknown[];
    };
    const targetId = node.data?.target?.sys?.id;
    if (
      node.nodeType === 'embedded-entry-block' &&
      typeof targetId === 'string' &&
      imageIds.has(targetId)
    ) {
      result.push(targetId);
    }
    for (const child of node.content ?? []) stack.push(child as object);
  }
  return result;
}

function reachableImageIds(byType: ReadonlyMap<string, RawEntry[]>): Set<string> {
  const imageEntries = byType.get('image') ?? [];
  const knownImageIds = new Set(imageEntries.map((entry) => entry.sys.id));
  const result = new Set<string>();
  const directImageFields = new Map<string, string[]>([
    ['author', ['staffPhotograph']],
    ['category', ['headerImage']],
    ['topic', ['heroImage']],
    ['book', ['coverImage']],
    ['article', ['heroImage']],
    ['siteSettings', ['defaultSocialImage']],
  ]);

  for (const [type, fieldNames] of directImageFields) {
    for (const entry of byType.get(type) ?? []) {
      const value = fields(entry);
      for (const fieldName of fieldNames) {
        if (value[fieldName]) result.add(referenceId(value[fieldName], entry.sys.id, fieldName));
      }
    }
  }
  for (const entry of byType.get('article') ?? []) {
    for (const id of collectEmbeddedImageIds(fields(entry).body, knownImageIds)) result.add(id);
  }

  return result;
}

function assertImageFanoutBudget(
  imageEntries: ReadonlyMap<string, RawEntry>,
  imageIds: ReadonlySet<string>,
): void {
  if (imageIds.size > IMAGE_FANOUT_BUDGET.maxImages) {
    throw new Error(
      `Published content references ${imageIds.size} images, exceeding the preflight limit of ${IMAGE_FANOUT_BUDGET.maxImages}.`,
    );
  }

  let variantCount = 0;
  let estimatedDownloadBytes = 0;
  for (const id of imageIds) {
    const entry = imageEntries.get(id);
    if (!entry) throw new Error(`Published content references missing Image entry ${id}.`);
    const plan = inspectContentfulImage(id, fields(entry) as RawImageFields);
    variantCount += plan.variantCount;
    estimatedDownloadBytes += plan.estimatedDownloadBytes;
  }

  if (variantCount > IMAGE_FANOUT_BUDGET.maxVariants) {
    throw new Error(
      `Published images require ${variantCount} generated variants, exceeding the preflight limit of ${IMAGE_FANOUT_BUDGET.maxVariants}.`,
    );
  }
  if (estimatedDownloadBytes > IMAGE_FANOUT_BUDGET.maxEstimatedDownloadBytes) {
    throw new Error(
      `Published image variants have an estimated download size of ${estimatedDownloadBytes} bytes, exceeding the preflight limit of ${IMAGE_FANOUT_BUDGET.maxEstimatedDownloadBytes} bytes.`,
    );
  }
}

export async function normalizeContentfulEntries(entries: RawEntry[]): Promise<Publication> {
  const byType = new Map<string, RawEntry[]>();
  for (const entry of entries) {
    const type = contentType(entry);
    byType.set(type, [...(byType.get(type) ?? []), entry]);
  }

  for (const entry of byType.get('article') ?? []) {
    const value = fields(entry);
    assertPrivateArticleFieldsOmitted(value, entry.sys.id);
    validateRichTextBudget(value.body, entry.sys.id);
  }

  const imageEntries = new Map((byType.get('image') ?? []).map((entry) => [entry.sys.id, entry]));
  const referencedImageIds = reachableImageIds(byType);
  assertImageFanoutBudget(imageEntries, referencedImageIds);

  const images = new Map<string, Image>();
  for (const id of referencedImageIds) {
    const entry = imageEntries.get(id)!;
    images.set(id, await materializeContentfulImage(id, fields(entry)));
  }
  const imageReference = (
    value: unknown,
    ownerId: string,
    fieldName: string,
  ): Image | undefined => {
    if (!value) return undefined;
    const id = referenceId(value, ownerId, fieldName);
    const result = images.get(id);
    if (!result) throw new Error(`Entry ${ownerId} references missing Image entry ${id}.`);
    return result;
  };
  const attachEmbeddedImages = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return value;
    const stack = [value];
    while (stack.length > 0) {
      const current = stack.pop() as object;
      const node = current as {
        nodeType?: string;
        data?: Record<string, any>;
        content?: unknown[];
      };
      if (node.nodeType === 'embedded-entry-block') {
        const targetId = node.data?.target?.sys?.id;
        const normalizedImage = typeof targetId === 'string' ? images.get(targetId) : undefined;
        if (normalizedImage) {
          node.data = {
            ...node.data,
            target: { ...node.data?.target, normalizedImage },
          };
        }
      }
      for (const child of node.content ?? []) {
        stack.push(child as object);
      }
    }
    return value;
  };

  const authors = (byType.get('author') ?? []).map((entry) => {
    const value = fields(entry);
    return {
      id: entry.sys.id,
      name: value.displayName,
      slug: value.slug,
      position: value.positionOrTitle ?? 'Contributor',
      shortBiography: value.shortBiography,
      fullBiography: value.fullBiography ?? value.shortBiography,
      areasOfCoverage: value.areasOfCoverage ?? [],
      socialLinks: jsonLinks(value.socialLinks),
      ...(value.personalWebsite
        ? { personalWebsite: sanitizeExternalUrl(value.personalWebsite) }
        : {}),
      designation: value.staffOrGuestDesignation,
      status: value.activeOrFormerStaffDesignation,
      ...(value.staffPhotograph
        ? { photo: imageReference(value.staffPhotograph, entry.sys.id, 'staffPhotograph') }
        : {}),
    };
  });

  const categories = (byType.get('category') ?? []).map((entry) => {
    const value = fields(entry);
    return {
      id: entry.sys.id,
      name: value.name,
      slug: value.slug,
      description: value.description,
      displayOrder: value.displayOrder ?? 0,
      showInNavigation: value.showInNavigation ?? false,
      colorToken: value.featuredCategoryColorToken ?? 'graphite',
      ...(value.headerImage
        ? { headerImage: imageReference(value.headerImage, entry.sys.id, 'headerImage') }
        : {}),
    };
  });

  const topics = (byType.get('topic') ?? []).map((entry) => {
    const value = fields(entry);
    return {
      id: entry.sys.id,
      name: value.name,
      slug: value.slug,
      summary: value.summary,
      timelineIntroduction: value.timelineIntroduction ?? '',
      featured: value.featuredStatus ?? false,
      relatedArticleIds: referenceIds(value.relatedArticles, entry.sys.id, 'relatedArticles'),
      ...(value.heroImage
        ? { heroImage: imageReference(value.heroImage, entry.sys.id, 'heroImage') }
        : {}),
    };
  });

  const sources = (byType.get('source') ?? []).map((entry) => {
    const value = fields(entry);
    return {
      id: entry.sys.id,
      title: value.sourceTitle,
      publisher: value.publisher,
      url: sanitizeExternalUrl(value.url),
      ...(value.publicationDate
        ? {
            publicationDate: optionalDateTime(
              value.publicationDate,
              entry.sys.id,
              'publicationDate',
            ),
          }
        : {}),
      accessDate: dateTime(value.accessDate, entry.sys.id, 'accessDate'),
      note: value.optionalNote ?? '',
    };
  });

  const books = (byType.get('book') ?? []).map((entry) => {
    const value = fields(entry);
    return {
      id: entry.sys.id,
      title: value.title,
      author: value.author,
      publisher: value.publisher,
      publicationYear: value.publicationYear,
      isbn: value.isbn,
      informationUrl: sanitizeExternalUrl(value.externalInformationUrl),
      ...(value.coverImage
        ? { coverImage: imageReference(value.coverImage, entry.sys.id, 'coverImage') }
        : {}),
    };
  });

  const articles: Article[] = [];
  for (const entry of byType.get('article') ?? []) {
    const value = fields(entry);
    const body = attachEmbeddedImages(value.body);
    const article = {
      id: entry.sys.id,
      title: value.title,
      slug: value.slug,
      dek: value.dek,
      storyLabel: normalizeStoryLabel(value.articleType),
      body,
      ...(value.heroImage
        ? { heroImage: imageReference(value.heroImage, entry.sys.id, 'heroImage') }
        : {}),
      authorIds: referenceIds(value.authors, entry.sys.id, 'authors'),
      primaryCategoryId: referenceId(value.primaryCategory, entry.sys.id, 'primaryCategory'),
      topicIds: referenceIds(value.topics, entry.sys.id, 'topics'),
      ...(value.book ? { bookId: referenceId(value.book, entry.sys.id, 'book') } : {}),
      sourceIds: referenceIds(value.sources, entry.sys.id, 'sources'),
      relatedArticleIds: referenceIds(value.relatedArticles, entry.sys.id, 'relatedArticles'),
      publicationDate: dateTime(
        value.displayPublicationDate,
        entry.sys.id,
        'displayPublicationDate',
      ),
      ...(value.displayUpdatedDate
        ? {
            updatedDate: optionalDateTime(
              value.displayUpdatedDate,
              entry.sys.id,
              'displayUpdatedDate',
            ),
          }
        : {}),
      correctionNote: value.correctionNote ?? '',
      previousSlugs: value.previousSlugs ?? [],
      featured: value.featured ?? false,
      ...(value.seoTitle ? { seoTitle: value.seoTitle } : {}),
      ...(value.seoDescription ? { seoDescription: value.seoDescription } : {}),
      readingMinutes: estimateReadingMinutes(plainTextFromRichText(body)),
    } as Article;
    articles.push(article);
  }

  const orderedArticles = sortArticles(articles);
  const homepageEntries = byType.get('homepage') ?? [];
  if (homepageEntries.length > 1) {
    throw new Error(`Expected at most one Homepage entry, found ${homepageEntries.length}.`);
  }
  const homepageEntry = homepageEntries[0];
  const homepageFields = homepageEntry ? fields(homepageEntry) : {};
  const homepage = {
    curated: Boolean(homepageEntry),
    ...(homepageFields.leadArticle
      ? {
          leadArticleId: referenceId(
            homepageFields.leadArticle,
            homepageEntry!.sys.id,
            'leadArticle',
          ),
        }
      : {}),
    secondaryLeadArticleIds: homepageEntry
      ? referenceIds(
          homepageFields.secondaryLeadArticles,
          homepageEntry.sys.id,
          'secondaryLeadArticles',
        )
      : [],
    featuredAnalysisIds: homepageEntry
      ? referenceIds(homepageFields.featuredAnalysis, homepageEntry.sys.id, 'featuredAnalysis')
      : [],
    featuredOpinionIds: homepageEntry
      ? referenceIds(homepageFields.featuredOpinions, homepageEntry.sys.id, 'featuredOpinions')
      : [],
    featuredReviewIds: homepageEntry
      ? referenceIds(
          homepageFields.featuredBookReviews,
          homepageEntry.sys.id,
          'featuredBookReviews',
        )
      : [],
    ...(homepageFields.featuredTopic
      ? {
          featuredTopicId: referenceId(
            homepageFields.featuredTopic,
            homepageEntry!.sys.id,
            'featuredTopic',
          ),
        }
      : {}),
    announcement: homepageFields.optionalAnnouncementStrip ?? '',
  };

  const settingsEntries = byType.get('siteSettings') ?? [];
  if (settingsEntries.length !== 1) {
    throw new Error(`Expected exactly one Site Settings entry, found ${settingsEntries.length}.`);
  }
  const settingsEntry = settingsEntries[0]!;
  const settingsFields = fields(settingsEntry);
  const settings = {
    publicationName: settingsFields.publicationName,
    shortName: settingsFields.shortName,
    tagline: settingsFields.tagline,
    description: settingsFields.description,
    textLogo: settingsFields.textLogo,
    footerSections: Array.isArray(settingsFields.footerSections)
      ? settingsFields.footerSections
      : [],
    contactLinks: Array.isArray(settingsFields.contactLinks) ? settingsFields.contactLinks : [],
    socialLinks: jsonLinks(settingsFields.socialLinks),
    copyrightText: settingsFields.copyrightText,
    launched: settingsFields.siteLaunched ?? false,
    ...(settingsFields.defaultSocialImage
      ? {
          defaultSocialImage: imageReference(
            settingsFields.defaultSocialImage,
            settingsEntry.sys.id,
            'defaultSocialImage',
          ),
        }
      : {}),
  };

  return publicationSchema.parse({
    settings,
    homepage,
    articles: orderedArticles,
    authors,
    categories,
    topics,
    sources,
    books,
    generatedAt: new Date().toISOString(),
    source: 'contentful',
  });
}
