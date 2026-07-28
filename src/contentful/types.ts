import type { z } from 'zod';
import type {
  articleSchema,
  authorSchema,
  bookSchema,
  categorySchema,
  homepageSchema,
  imageSchema,
  publicationSchema,
  siteSettingsSchema,
  sourceSchema,
  topicSchema,
} from './schemas';

export type Article = z.infer<typeof articleSchema>;
export type Author = z.infer<typeof authorSchema>;
export type Book = z.infer<typeof bookSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Homepage = z.infer<typeof homepageSchema>;
export type Image = z.infer<typeof imageSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Topic = z.infer<typeof topicSchema>;

export interface PublicationIndexes {
  articles: Map<string, Article>;
  authors: Map<string, Author>;
  books: Map<string, Book>;
  categories: Map<string, Category>;
  sources: Map<string, Source>;
  topics: Map<string, Topic>;
}
