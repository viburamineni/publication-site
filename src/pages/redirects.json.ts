import type { APIRoute } from 'astro';
import { publication } from '../contentful/data';
import { approvedArticles } from '../utilities/content';

export const GET: APIRoute = () => {
  const redirects = approvedArticles(publication).flatMap((article) =>
    article.previousSlugs.map((previousSlug) => ({
      from: `/articles/${previousSlug}/`,
      to: `/articles/${article.slug}/`,
      status: 301,
    })),
  );
  return Response.json(redirects, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
};
