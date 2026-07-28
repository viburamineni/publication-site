import type { APIRoute } from 'astro';
import { publication } from '../contentful/data';

export const GET: APIRoute = () => {
  const body = publication.settings.launched
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', import.meta.env.SITE).toString()}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
