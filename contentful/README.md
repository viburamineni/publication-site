# Contentful configuration

The production model is defined by the ordered scripts in `migrations/`. Apply them only to the
project's dedicated space and `master` environment. New spaces start with `001`; existing spaces
apply each later migration exactly once.

```sh
CONTENTFUL_SPACE_ID=... \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=... \
npm run contentful:migrate
```

For an existing environment created before the previous-slug validation was added:

```sh
CONTENTFUL_SPACE_ID=... \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=... \
npm run contentful:migrate:validate-previous-slugs
```

The management token is temporary. Do not commit it, expose it to browser code, or store it in
Cloudflare after setup. Export the resulting model with `npm run contentful:export`, then revoke the
token.

The Remote MCP app is installed on the `master` environment. Its enabled entity groups are Entries,
Assets, Content types, Locales, Environments, Editor interfaces, Organizations, and Spaces. Premium
AI actions are not enabled.
