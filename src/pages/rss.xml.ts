import rss from '@astrojs/rss';
import { publication, indexes } from '../contentful/data';
import { publishedArticles } from '../utilities/content';

export async function GET(context: { site?: URL }) {
  return rss({
    title: publication.settings.publicationName,
    description: publication.settings.description,
    site: context.site!,
    items: publishedArticles(publication).map((article) => ({
      title: article.title,
      description: article.dek,
      pubDate: new Date(article.publicationDate),
      link: `/articles/${article.slug}/`,
      categories: [
        article.articleType,
        indexes.categories.get(article.primaryCategoryId)?.name ?? 'News',
      ],
    })),
    customData: '<language>en-us</language>',
  });
}
