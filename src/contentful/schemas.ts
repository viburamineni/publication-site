import { z } from 'zod';
import { sanitizeLinkUrl } from '../utilities/content';
import { conditionalRequirementsForArticle, storyLabels } from './article-requirements';

export { storyLabels } from './article-requirements';

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const linkUrlSchema = z.string().transform((value, context) => {
  try {
    return sanitizeLinkUrl(value);
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Unsupported link URL.',
    });
    return z.NEVER;
  }
});

export const responsiveImageSchema = z.object({
  src: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  type: z.string().default('image/webp'),
});

export const imageSchema = z.object({
  id: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().default(''),
  credit: z.string().min(1),
  rightsNote: z.string().default(''),
  focalPoint: z.string().default('center'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sources: z.array(responsiveImageSchema).min(1).max(4),
});

export const authorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: slugSchema,
  position: z.string().default('Contributor'),
  shortBiography: z.string().min(1),
  fullBiography: z.string().min(1),
  areasOfCoverage: z.array(z.string()).default([]),
  socialLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  personalWebsite: z.string().url().optional(),
  designation: z.enum(['Staff', 'Guest']),
  status: z.enum(['Active', 'Former']),
  photo: imageSchema.optional(),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().min(1),
  displayOrder: z.number().int().nonnegative(),
  showInNavigation: z.boolean(),
  colorToken: z.enum(['pine', 'oxblood', 'clay', 'river', 'plum', 'graphite']).default('graphite'),
  headerImage: imageSchema.optional(),
});

export const topicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: slugSchema,
  summary: z.string().min(1),
  timelineIntroduction: z.string().default(''),
  featured: z.boolean().default(false),
  heroImage: imageSchema.optional(),
  relatedArticleIds: z.array(z.string()).default([]),
});

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  publicationDate: z.string().datetime().optional(),
  accessDate: z.string().datetime(),
  note: z.string().default(''),
});

export const bookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().min(1),
  publicationYear: z.number().int().min(1000).max(3000),
  isbn: z.string().min(10),
  informationUrl: z.string().url(),
  coverImage: imageSchema.optional(),
});

export const richTextDocumentSchema = z.object({
  nodeType: z.literal('document'),
  data: z.record(z.string(), z.unknown()).default({}),
  content: z.array(z.unknown()),
});

export const articleSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(10).max(140),
    slug: slugSchema,
    dek: z.string().min(30).max(350),
    storyLabel: z.enum(storyLabels),
    body: richTextDocumentSchema,
    heroImage: imageSchema.optional(),
    authorIds: z.array(z.string()).min(1).max(3),
    primaryCategoryId: z.string().min(1),
    topicIds: z.array(z.string()).default([]),
    bookId: z.string().optional(),
    sourceIds: z.array(z.string()).default([]),
    relatedArticleIds: z.array(z.string()).default([]),
    publicationDate: z.string().datetime(),
    updatedDate: z.string().datetime().optional(),
    correctionNote: z.string().default(''),
    previousSlugs: z.array(slugSchema).default([]),
    featured: z.boolean().default(false),
    seoTitle: z.string().max(70).optional(),
    seoDescription: z.string().max(170).optional(),
    readingMinutes: z.number().int().positive(),
  })
  .superRefine((article, context) => {
    const requirements = conditionalRequirementsForArticle(article.storyLabel);
    if (requirements.heroImage && !article.heroImage) {
      context.addIssue({
        code: 'custom',
        message: 'Hero image is required for all articles except Briefs.',
        path: ['heroImage'],
      });
    }
  });

export const homepageSchema = z.object({
  curated: z.boolean().default(false),
  leadArticleId: z.string().optional(),
  secondaryLeadArticleIds: z.array(z.string()).default([]),
  breakingArticleIds: z.array(z.string()).default([]),
  featuredAnalysisIds: z.array(z.string()).default([]),
  featuredOpinionIds: z.array(z.string()).default([]),
  featuredReviewIds: z.array(z.string()).default([]),
  featuredTopicId: z.string().optional(),
  categoryOrderIds: z.array(z.string()).default([]),
  announcement: z.string().default(''),
});

export const siteSettingsSchema = z.object({
  publicationName: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  textLogo: z.string().min(1),
  footerSections: z
    .array(
      z.object({
        title: z.string(),
        links: z.array(z.object({ label: z.string(), url: linkUrlSchema })),
      }),
    )
    .default([]),
  contactLinks: z.array(z.object({ label: z.string(), url: linkUrlSchema })).default([]),
  socialLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  copyrightText: z.string().min(1),
  launched: z.boolean().default(false),
  defaultSocialImage: imageSchema.optional(),
});

export const publicationSchema = z
  .object({
    settings: siteSettingsSchema,
    homepage: homepageSchema,
    articles: z.array(articleSchema),
    authors: z.array(authorSchema),
    categories: z.array(categorySchema),
    topics: z.array(topicSchema),
    sources: z.array(sourceSchema),
    books: z.array(bookSchema),
    generatedAt: z.string().datetime(),
    source: z.enum(['fixtures', 'contentful']),
  })
  .superRefine((publication, context) => {
    const collections = [
      ['article', publication.articles],
      ['author', publication.authors],
      ['category', publication.categories],
      ['topic', publication.topics],
    ] as const;

    for (const [label, collection] of collections) {
      const seen = new Set<string>();
      for (const item of collection) {
        if (seen.has(item.slug)) {
          context.addIssue({
            code: 'custom',
            message: `Duplicate ${label} slug: ${item.slug}`,
            path: [`${label}s`],
          });
        }
        seen.add(item.slug);
      }
    }

    const authorIds = new Set(publication.authors.map((author) => author.id));
    const categoryIds = new Set(publication.categories.map((category) => category.id));
    const topicIds = new Set(publication.topics.map((topic) => topic.id));
    const articleIds = new Set(publication.articles.map((article) => article.id));
    const sourceIds = new Set(publication.sources.map((source) => source.id));
    const bookIds = new Set(publication.books.map((book) => book.id));

    const homepageArticleReferences = [
      ...(publication.homepage.leadArticleId ? [publication.homepage.leadArticleId] : []),
      ...publication.homepage.secondaryLeadArticleIds,
      ...publication.homepage.breakingArticleIds,
      ...publication.homepage.featuredAnalysisIds,
      ...publication.homepage.featuredOpinionIds,
      ...publication.homepage.featuredReviewIds,
    ];
    for (const articleId of homepageArticleReferences) {
      if (!articleIds.has(articleId)) {
        context.addIssue({
          code: 'custom',
          message: `Homepage references missing article ${articleId}.`,
          path: ['homepage'],
        });
      }
    }
    if (
      publication.homepage.featuredTopicId &&
      !topicIds.has(publication.homepage.featuredTopicId)
    ) {
      context.addIssue({
        code: 'custom',
        message: `Homepage references missing topic ${publication.homepage.featuredTopicId}.`,
        path: ['homepage'],
      });
    }

    for (const article of publication.articles) {
      for (const authorId of article.authorIds) {
        if (!authorIds.has(authorId)) {
          context.addIssue({
            code: 'custom',
            message: `Article ${article.id} references missing author ${authorId}.`,
          });
        }
      }
      if (!categoryIds.has(article.primaryCategoryId)) {
        context.addIssue({
          code: 'custom',
          message: `Article ${article.id} references missing category ${article.primaryCategoryId}.`,
        });
      }
      for (const topicId of article.topicIds) {
        if (!topicIds.has(topicId)) {
          context.addIssue({
            code: 'custom',
            message: `Article ${article.id} references missing topic ${topicId}.`,
          });
        }
      }
      for (const relatedId of article.relatedArticleIds) {
        if (!articleIds.has(relatedId)) {
          context.addIssue({
            code: 'custom',
            message: `Article ${article.id} references missing related article ${relatedId}.`,
          });
        }
      }
      for (const sourceId of article.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          context.addIssue({
            code: 'custom',
            message: `Article ${article.id} references missing source ${sourceId}.`,
          });
        }
      }
      if (article.bookId && !bookIds.has(article.bookId)) {
        context.addIssue({
          code: 'custom',
          message: `Article ${article.id} references missing book ${article.bookId}.`,
        });
      }
    }
  });
