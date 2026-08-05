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

To add the editor-only Publishing checks app support:

```sh
CONTENTFUL_SPACE_ID=... \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=... \
npm run contentful:migrate:publishing-checks
```

Then remove the legacy client-written readiness marker before installing or updating the app:

```sh
CONTENTFUL_SPACE_ID=... \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=... \
npm run contentful:migrate:remove-publishing-marker
```

Then follow [apps/publishing-checks/README.md](apps/publishing-checks/README.md) to build, upload, and
install the advisory sidebar app. Production readiness is enforced independently during the static
build; no browser-written field authorizes deployment.

Then omit editor-only Article notes from Delivery API responses while keeping the field available
to authorized editors and Management API clients:

```sh
CONTENTFUL_SPACE_ID=... \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=... \
npm run contentful:migrate:protect-internal-notes
```

To simplify the Homepage editor and hide controls the current site does not render:

```sh
CONTENTFUL_SPACE_ID=... \
CONTENTFUL_ENVIRONMENT=master \
CONTENTFUL_MANAGEMENT_TOKEN=... \
npm run contentful:migrate:homepage-controls
```

The management token is temporary. Do not commit it, expose it to browser code, or store it in
Cloudflare after setup. Export the resulting model with `npm run contentful:export`, then revoke the
token.

The Remote MCP app is installed on the `master` environment. Its enabled entity groups are Entries,
Assets, Content types, Locales, Environments, Editor interfaces, Organizations, and Spaces. Premium
AI actions are not enabled.
