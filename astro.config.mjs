// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.PUBLIC_SITE_URL || 'https://publication-site-live.intraducine.workers.dev';

export default defineConfig({
  site,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
