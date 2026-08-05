import { init, locations, type ConfigAppSDK, type SidebarAppSDK } from '@contentful/app-sdk';
import {
  createRefreshSequence,
  evaluatePublishingChecks,
  type LinkedEntryStatus,
  type PublishingCheck,
} from './rules';
import './styles.css';

const ARTICLE_CONTENT_TYPE = 'article';
const LEGACY_VALIDATION_FIELD = 'publishingChecks';

type EntryDependencyKind = 'entry' | 'asset';

interface EntryDependency {
  fieldId: string;
  kind: EntryDependencyKind;
  required?: boolean;
}

const ENTRY_DEPENDENCIES: Record<string, EntryDependency[]> = {
  image: [{ fieldId: 'asset', kind: 'asset', required: true }],
  author: [{ fieldId: 'staffPhotograph', kind: 'entry' }],
  category: [{ fieldId: 'headerImage', kind: 'entry' }],
  topic: [
    { fieldId: 'heroImage', kind: 'entry' },
    { fieldId: 'relatedArticles', kind: 'entry' },
  ],
  book: [{ fieldId: 'coverImage', kind: 'entry' }],
  relatedArticles: [{ fieldId: 'articles', kind: 'entry' }],
};

function requireAppRoot(): HTMLElement {
  const element = document.querySelector<HTMLElement>('#app');
  if (!element) throw new Error('Publishing checks app root is missing.');
  return element;
}

const app = requireAppRoot();

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderChecks(checks: PublishingCheck[], busy = false): void {
  const failureCount = checks.filter((check) => check.state === 'fail').length;
  const passed = failureCount === 0;
  const summary = busy
    ? 'Checking article…'
    : passed
      ? 'Checklist passes. The build validates again.'
      : `${failureCount} ${failureCount === 1 ? 'issue' : 'issues'} to fix`;
  const summaryState = busy ? 'checking' : passed ? 'pass' : 'fail';

  app.innerHTML = `
    <section class="panel" aria-labelledby="publishing-checks-title">
      <h1 class="title" id="publishing-checks-title">Publishing checks</h1>
      <p class="summary" data-state="${summaryState}" role="status" aria-live="polite">${summary}</p>
      <ul class="check-list">
        ${checks
          .map((check) => {
            const mark = check.state === 'pass' ? '✓' : check.state === 'fail' ? '!' : '–';
            return `
              <li class="check" data-state="${check.state}">
                <span class="check-mark" aria-hidden="true">${mark}</span>
                <div>
                  <p class="check-label">${escapeHtml(check.label)}</p>
                  <p class="check-detail">${escapeHtml(check.detail)}</p>
                </div>
              </li>
            `;
          })
          .join('')}
      </ul>
      <button class="action" type="button" ${busy ? 'disabled' : ''}>Check again</button>
    </section>
  `;
}

function renderSidebarSetupError(message: string): void {
  app.innerHTML = `
    <section class="panel" aria-labelledby="publishing-checks-title">
      <h1 class="title" id="publishing-checks-title">Publishing checks</h1>
      <p class="summary" data-state="fail">${escapeHtml(message)}</p>
    </section>
  `;
}

function localizedValue(value: unknown, locale: string): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const localized = value as Record<string, unknown>;
  return localized[locale] ?? Object.values(localized)[0];
}

function linkIds(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .map((item) => {
      if (!item || typeof item !== 'object') return undefined;
      const id = (item as { sys?: { id?: unknown } }).sys?.id;
      return typeof id === 'string' ? id : undefined;
    })
    .filter((id): id is string => Boolean(id));
}

function richTextEntryLinks(value: unknown): Array<{ sys: { id: string } }> {
  const ids = new Set<string>();
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (record.nodeType === 'embedded-entry-block' || record.nodeType === 'entry-hyperlink') {
      const data = record.data as { target?: { sys?: { id?: unknown } } } | undefined;
      const id = data?.target?.sys?.id;
      if (typeof id === 'string') ids.add(id);
    }
    if (Array.isArray(record.content)) record.content.forEach(visit);
  };
  visit(value);
  return [...ids].map((id) => ({ sys: { id } }));
}

function nestedStatus(status: LinkedEntryStatus): LinkedEntryStatus {
  if (status === 'published') return 'published';
  if (status === 'draft' || status === 'dependency-draft') return 'dependency-draft';
  if (status === 'missing' || status === 'dependency-missing') return 'dependency-missing';
  return 'dependency-unavailable';
}

async function linkedAssetStatus(sdk: SidebarAppSDK, assetId: string): Promise<LinkedEntryStatus> {
  try {
    const asset = await sdk.cma.asset.get({ assetId });
    return asset.sys.publishedVersion ? 'published' : 'draft';
  } catch (error) {
    const status = (error as { status?: unknown }).status;
    return status === 404 ? 'missing' : 'unavailable';
  }
}

async function linkedEntryStatus(
  sdk: SidebarAppSDK,
  entryId: string,
  visited = new Set<string>(),
): Promise<LinkedEntryStatus> {
  if (visited.has(entryId)) return 'published';
  const nextVisited = new Set(visited).add(entryId);
  try {
    const entry = await sdk.cma.entry.get({ entryId });
    if (!entry.sys.publishedVersion) return 'draft';

    const contentTypeId = entry.sys.contentType.sys.id;
    const dependencies = ENTRY_DEPENDENCIES[contentTypeId] ?? [];
    for (const dependency of dependencies) {
      const value = localizedValue(entry.fields[dependency.fieldId], sdk.locales.default);
      const ids = linkIds(value);
      if (dependency.required && ids.length === 0) return 'dependency-missing';

      const statuses = await Promise.all(
        ids.map((id) =>
          dependency.kind === 'asset'
            ? linkedAssetStatus(sdk, id)
            : linkedEntryStatus(sdk, id, nextVisited),
        ),
      );
      const failure = statuses.find((status) => status !== 'published');
      if (failure) return nestedStatus(failure);
    }

    return 'published';
  } catch (error) {
    const status = (error as { status?: unknown }).status;
    return status === 404 ? 'missing' : 'unavailable';
  }
}

function setupSidebar(sdk: SidebarAppSDK): void {
  sdk.window.startAutoResizer();

  if (sdk.ids.contentType !== ARTICLE_CONTENT_TYPE) {
    renderSidebarSetupError('This app is only configured for Article entries.');
    return;
  }

  const storyLabel = sdk.entry.fields.articleType;
  const authors = sdk.entry.fields.authors;
  const primaryCategory = sdk.entry.fields.primaryCategory;
  const topics = sdk.entry.fields.topics;
  const heroImage = sdk.entry.fields.heroImage;
  const sources = sdk.entry.fields.sources;
  const book = sdk.entry.fields.book;
  const relatedArticles = sdk.entry.fields.relatedArticles;
  const body = sdk.entry.fields.body;

  if (
    !storyLabel ||
    !authors ||
    !primaryCategory ||
    !topics ||
    !heroImage ||
    !sources ||
    !book ||
    !relatedArticles ||
    !body
  ) {
    renderSidebarSetupError(
      'The Article content model is missing fields required by Publishing checks.',
    );
    return;
  }

  const refreshSequence = createRefreshSequence();
  let timer: number | undefined;
  let latestChecks: PublishingCheck[] = [];
  let bodyReferenceSignature = JSON.stringify(
    richTextEntryLinks(body.getValue(sdk.locales.default)).map((link) => link.sys.id),
  );

  const refresh = async (sequence = refreshSequence.next()): Promise<void> => {
    renderChecks(latestChecks, true);

    const statusCache = new Map<string, Promise<LinkedEntryStatus>>();
    const resolveStatus = (entryId: string): Promise<LinkedEntryStatus> => {
      const cached = statusCache.get(entryId);
      if (cached) return cached;
      const pending = linkedEntryStatus(sdk, entryId);
      statusCache.set(entryId, pending);
      return pending;
    };

    const checks = await evaluatePublishingChecks(
      {
        storyLabel: storyLabel.getValue(sdk.locales.default),
        authors: authors.getValue(sdk.locales.default),
        primaryCategory: primaryCategory.getValue(sdk.locales.default),
        topics: topics.getValue(sdk.locales.default),
        heroImage: heroImage.getValue(sdk.locales.default),
        sources: sources.getValue(sdk.locales.default),
        book: book.getValue(sdk.locales.default),
        relatedArticles: relatedArticles.getValue(sdk.locales.default),
        bodyReferences: richTextEntryLinks(body.getValue(sdk.locales.default)),
      },
      resolveStatus,
    );

    if (!refreshSequence.isCurrent(sequence)) return;

    latestChecks = checks;
    renderChecks(checks);

    app.querySelector<HTMLButtonElement>('.action')?.addEventListener('click', () => {
      void refresh();
    });
  };

  const queueRefresh = (): void => {
    window.clearTimeout(timer);
    const sequence = refreshSequence.next();
    renderChecks(latestChecks, true);
    timer = window.setTimeout(() => void refresh(sequence), 120);
  };

  const queueRefreshWhenBodyLinksChange = (): void => {
    const nextSignature = JSON.stringify(
      richTextEntryLinks(body.getValue(sdk.locales.default)).map((link) => link.sys.id),
    );
    if (nextSignature === bodyReferenceSignature) return;
    bodyReferenceSignature = nextSignature;
    queueRefresh();
  };

  const unsubscribe = [
    storyLabel.onValueChanged(sdk.locales.default, queueRefresh),
    authors.onValueChanged(sdk.locales.default, queueRefresh),
    primaryCategory.onValueChanged(sdk.locales.default, queueRefresh),
    topics.onValueChanged(sdk.locales.default, queueRefresh),
    heroImage.onValueChanged(sdk.locales.default, queueRefresh),
    sources.onValueChanged(sdk.locales.default, queueRefresh),
    book.onValueChanged(sdk.locales.default, queueRefresh),
    relatedArticles.onValueChanged(sdk.locales.default, queueRefresh),
    body.onValueChanged(sdk.locales.default, queueRefreshWhenBodyLinksChange),
  ];
  window.addEventListener('focus', queueRefresh);
  window.addEventListener(
    'beforeunload',
    () => {
      unsubscribe.forEach((stopListening) => stopListening());
      window.removeEventListener('focus', queueRefresh);
    },
    { once: true },
  );
  void refresh();
}

async function setupConfiguration(sdk: ConfigAppSDK): Promise<void> {
  let modelReady = false;
  try {
    const contentType = await sdk.cma.contentType.get({ contentTypeId: ARTICLE_CONTENT_TYPE });
    modelReady = !contentType.fields.some((field) => field.id === LEGACY_VALIDATION_FIELD);
  } catch {
    modelReady = false;
  }

  app.innerHTML = `
    <section class="configuration" aria-labelledby="configuration-title">
      <h1 class="title" id="configuration-title">Publishing checks</h1>
      <p class="configuration-copy">
        Adds a live checklist to the Article sidebar. The production build independently validates
        the current published Article and its dependencies before deployment.
      </p>
      <p class="configuration-status" data-state="${modelReady ? 'pass' : 'fail'}">
        ${modelReady ? 'Article content model is ready.' : 'Secure content model migration required.'}
      </p>
      <p class="configuration-note">
        ${
          modelReady
            ? 'Choose Install or Save to add the checklist to the Article sidebar.'
            : 'Run migration 007-remove-client-readiness-marker before installing this app.'
        }
      </p>
    </section>
  `;

  sdk.app.onConfigure(async () => {
    if (!modelReady) {
      sdk.notifier.error(
        'Run migration 007-remove-client-readiness-marker before installing this app.',
      );
      return false;
    }

    const currentState = await sdk.app.getCurrentState();
    return {
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [ARTICLE_CONTENT_TYPE]: {
            ...currentState?.EditorInterface?.[ARTICLE_CONTENT_TYPE],
            sidebar: { position: 0 },
          },
        },
      },
    };
  });

  await sdk.app.setReady();
}

function renderLocalPreview(preview: string): void {
  if (preview === 'config') {
    app.innerHTML = `
      <section class="configuration" aria-labelledby="configuration-title">
        <h1 class="title" id="configuration-title">Publishing checks</h1>
        <p class="configuration-copy">
          Adds a live checklist to the Article sidebar. The production build independently validates
          the current published Article and its dependencies before deployment.
        </p>
        <p class="configuration-status" data-state="pass">Article content model is ready.</p>
        <p class="configuration-note">
          Choose Install or Save to add the checklist to the Article sidebar.
        </p>
      </section>
    `;
    return;
  }

  const ready = preview === 'ready';
  renderChecks([
    {
      id: 'story-label',
      label: 'Story label',
      detail: 'Review selected.',
      state: 'pass',
    },
    {
      id: 'authors',
      label: 'Authors',
      detail: '1 author selected and published.',
      state: 'pass',
    },
    {
      id: 'category',
      label: 'Category',
      detail: '1 category selected and published.',
      state: 'pass',
    },
    {
      id: 'topics',
      label: 'Topics',
      detail: '1 topic selected and published.',
      state: 'pass',
    },
    {
      id: 'hero-image',
      label: 'Hero image',
      detail: ready
        ? '1 hero image selected and published.'
        : '1 hero image is still in draft. Publish before publishing this article.',
      state: ready ? 'pass' : 'fail',
    },
    {
      id: 'sources',
      label: 'Sources',
      detail: 'No sources attached.',
      state: 'not-applicable',
    },
    {
      id: 'book',
      label: 'Book',
      detail: ready
        ? 'Book is selected and published.'
        : 'Optional. Add a Book when this Review is about a book.',
      state: ready ? 'pass' : 'not-applicable',
    },
    {
      id: 'related-articles',
      label: 'Related articles',
      detail: 'No related articles attached.',
      state: 'not-applicable',
    },
    {
      id: 'body-references',
      label: 'Body links',
      detail: 'No linked entries in the story body.',
      state: 'not-applicable',
    },
  ]);
  app.querySelector<HTMLButtonElement>('.action')?.addEventListener('click', () => {
    renderLocalPreview(preview);
  });
}

const preview = new URLSearchParams(window.location.search).get('preview');
if (preview) {
  renderLocalPreview(preview);
} else {
  init((sdk) => {
    if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      setupSidebar(sdk as SidebarAppSDK);
      return;
    }
    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      void setupConfiguration(sdk as ConfigAppSDK);
      return;
    }
    renderSidebarSetupError('Publishing checks is not configured for this Contentful location.');
  });
}
