import { normalizeSlug, sanitizeExternalUrl } from '../utilities/content';
import { validateRichTextBudget } from './rich-text-budget';

type RichNode = {
  nodeType?: string;
  value?: string;
  marks?: Array<{ type?: string }>;
  data?: Record<string, any>;
  content?: RichNode[];
};

interface RenderContext {
  articleId: string;
  headingCounts: Map<string, number>;
}

const allowedMarks = new Set(['bold', 'italic', 'underline', 'code']);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function children(node: RichNode, context: RenderContext): string {
  return (node.content ?? []).map((child) => renderNode(child, context)).join('');
}

function textNode(node: RichNode, context: RenderContext): string {
  let output = escapeHtml(node.value ?? '');
  for (const mark of node.marks ?? []) {
    if (!mark.type || !allowedMarks.has(mark.type)) {
      throw new Error(
        `Article ${context.articleId} contains unsupported Rich Text mark ${mark.type}.`,
      );
    }
    const tag =
      mark.type === 'bold'
        ? 'strong'
        : mark.type === 'italic'
          ? 'em'
          : mark.type === 'code'
            ? 'code'
            : 'u';
    output = `<${tag}>${output}</${tag}>`;
  }
  return output;
}

function headingId(node: RichNode, context: RenderContext): string {
  const raw = (node.content ?? []).map((item) => item.value ?? '').join(' ');
  const base = normalizeSlug(raw) || 'section';
  const count = context.headingCounts.get(base) ?? 0;
  context.headingCounts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function embeddedEntry(node: RichNode, context: RenderContext): string {
  const target = node.data?.target;
  const type =
    target?.sys?.contentType?.sys?.id ?? target?.contentType ?? target?.sys?.contentType?.id;
  const value = target?.fields ?? target?.value ?? {};

  switch (type) {
    case 'pullQuote':
      return `<figure class="embedded-quote"><blockquote>${escapeHtml(value.quote ?? '')}</blockquote>${value.attribution ? `<figcaption>${escapeHtml(value.attribution)}</figcaption>` : ''}</figure>`;
    case 'factBox':
      return `<aside class="fact-box" aria-label="${escapeHtml(value.title ?? 'Fact box')}"><h2>${escapeHtml(value.title ?? 'Fact box')}</h2>${value.body ? `<p>${escapeHtml(value.body)}</p>` : ''}</aside>`;
    case 'relatedArticles': {
      const links = Array.isArray(value.articles)
        ? value.articles
            .map((article: any) => {
              const articleFields = article?.fields ?? article;
              if (!articleFields?.slug || !articleFields?.title) return '';
              return `<li><a href="/articles/${escapeHtml(articleFields.slug)}/">${escapeHtml(articleFields.title)}</a></li>`;
            })
            .join('')
        : '';
      return `<aside class="embedded-related"><h2>${escapeHtml(value.heading ?? 'Related reading')}</h2><ul>${links}</ul></aside>`;
    }
    case 'sectionDivider':
      return '<hr class="article-divider" />';
    case 'correctionNotice':
      return `<aside class="correction-notice"><strong>Correction</strong><p>${escapeHtml(value.note ?? '')}</p></aside>`;
    case 'image': {
      const image = target?.normalizedImage ?? value.normalizedImage;
      if (!image?.sources?.length) {
        throw new Error(
          `Article ${context.articleId} embeds Image entry ${target?.sys?.id ?? 'unknown'} without normalized image data.`,
        );
      }
      const source = image.sources.at(-1);
      const srcset = image.sources
        .map((item: any) => `${escapeHtml(item.src)} ${item.width}w`)
        .join(', ');
      return `<figure class="article-figure"><img src="${escapeHtml(source.src)}" srcset="${srcset}" sizes="(max-width: 760px) 100vw, 760px" width="${image.width}" height="${image.height}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" /><figcaption>${escapeHtml(image.caption)}${image.credit ? ` <span>Credit: ${escapeHtml(image.credit)}</span>` : ''}</figcaption></figure>`;
    }
    default:
      throw new Error(
        `Article ${context.articleId} contains unsupported embedded entry type ${String(type)}.`,
      );
  }
}

function renderNode(node: RichNode, context: RenderContext): string {
  switch (node.nodeType) {
    case 'document':
      return children(node, context);
    case 'text':
      return textNode(node, context);
    case 'paragraph': {
      const content = children(node, context).trim();
      return content ? `<p>${content}</p>` : '';
    }
    case 'heading-2':
      return `<h2 id="${headingId(node, context)}">${children(node, context)}</h2>`;
    case 'heading-3':
      return `<h3 id="${headingId(node, context)}">${children(node, context)}</h3>`;
    case 'ordered-list':
      return `<ol>${children(node, context)}</ol>`;
    case 'unordered-list':
      return `<ul>${children(node, context)}</ul>`;
    case 'list-item':
      return `<li>${children(node, context)}</li>`;
    case 'blockquote':
      return `<blockquote>${children(node, context)}</blockquote>`;
    case 'hyperlink': {
      const rawUrl = node.data?.uri;
      if (typeof rawUrl !== 'string') {
        throw new Error(`Article ${context.articleId} contains a hyperlink without a URL.`);
      }
      const url = sanitizeExternalUrl(rawUrl);
      return `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${children(node, context)}</a>`;
    }
    case 'entry-hyperlink': {
      const target = node.data?.target;
      const slug = target?.fields?.slug ?? target?.slug;
      if (!slug) {
        throw new Error(`Article ${context.articleId} has an unresolved inline article reference.`);
      }
      return `<a href="/articles/${escapeHtml(slug)}/">${children(node, context)}</a>`;
    }
    case 'embedded-entry-block':
      return embeddedEntry(node, context);
    case 'hr':
      return '<hr class="article-divider" />';
    default:
      throw new Error(
        `Article ${context.articleId} contains unsupported Rich Text node ${String(node.nodeType)}.`,
      );
  }
}

export function renderRichText(document: unknown, articleId: string): string {
  validateRichTextBudget(document, articleId);
  return renderNode(document as RichNode, { articleId, headingCounts: new Map() });
}
