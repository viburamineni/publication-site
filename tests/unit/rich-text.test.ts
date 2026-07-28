import { describe, expect, it } from 'vitest';
import { renderRichText } from '../../src/contentful/render-rich-text';

const text = (value: string) => ({ nodeType: 'text', value, marks: [], data: {} });

describe('Rich Text renderer', () => {
  it('maps approved nodes, removes empty paragraphs, and creates stable heading IDs', () => {
    const html = renderRichText(
      {
        nodeType: 'document',
        data: {},
        content: [
          { nodeType: 'heading-2', data: {}, content: [text('Public Record')] },
          { nodeType: 'heading-2', data: {}, content: [text('Public Record')] },
          { nodeType: 'paragraph', data: {}, content: [] },
          { nodeType: 'paragraph', data: {}, content: [text('<safe>')] },
        ],
      },
      'article-test',
    );
    expect(html).toContain('id="public-record"');
    expect(html).toContain('id="public-record-2"');
    expect(html).toContain('&lt;safe&gt;');
    expect(html).not.toContain('<p></p>');
  });

  it('secures external links', () => {
    const html = renderRichText(
      {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            data: {},
            content: [
              {
                nodeType: 'hyperlink',
                data: { uri: 'https://example.com/source' },
                content: [text('Source')],
              },
            ],
          },
        ],
      },
      'article-test',
    );
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('fails with the article ID for unsupported nodes and blocks', () => {
    expect(() =>
      renderRichText(
        { nodeType: 'document', data: {}, content: [{ nodeType: 'table', data: {}, content: [] }] },
        'article-42',
      ),
    ).toThrow(/article-42.*table/);
    expect(() =>
      renderRichText(
        {
          nodeType: 'document',
          data: {},
          content: [
            {
              nodeType: 'embedded-entry-block',
              data: { target: { contentType: 'unapprovedWidget', fields: {} } },
              content: [],
            },
          ],
        },
        'article-42',
      ),
    ).toThrow(/article-42.*unapprovedWidget/);
  });
});
