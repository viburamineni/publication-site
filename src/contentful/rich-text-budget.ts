type RichTextNode = {
  nodeType?: unknown;
  value?: unknown;
  marks?: unknown;
  content?: unknown;
};

export const RICH_TEXT_BUDGET = Object.freeze({
  maxDepth: 32,
  maxNodes: 10_000,
  maxMarksPerNode: 4,
  maxTextCharacters: 500_000,
});

/**
 * Bounds work on an untrusted Contentful Rich Text tree before any recursive
 * normalization or rendering. Node and mark allowlists remain enforced by the
 * renderer so this check can run before embedded entries are normalized.
 */
export function validateRichTextBudget(document: unknown, articleId: string): void {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error(`Article ${articleId} has an invalid Rich Text document.`);
  }

  const root = document as RichTextNode;
  if (root.nodeType !== 'document' || !Array.isArray(root.content)) {
    throw new Error(`Article ${articleId} has an invalid Rich Text document.`);
  }

  const stack: Array<{ value: unknown; depth: number }> = [{ value: document, depth: 1 }];
  let nodeCount = 0;
  let textCharacters = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!current.value || typeof current.value !== 'object' || Array.isArray(current.value)) {
      throw new Error(`Article ${articleId} contains an invalid Rich Text node.`);
    }

    if (current.depth > RICH_TEXT_BUDGET.maxDepth) {
      throw new Error(
        `Article ${articleId} Rich Text exceeds the maximum depth of ${RICH_TEXT_BUDGET.maxDepth}.`,
      );
    }

    nodeCount += 1;
    if (nodeCount > RICH_TEXT_BUDGET.maxNodes) {
      throw new Error(
        `Article ${articleId} Rich Text exceeds the maximum node count of ${RICH_TEXT_BUDGET.maxNodes}.`,
      );
    }

    const node = current.value as RichTextNode;
    if (typeof node.nodeType !== 'string') {
      throw new Error(`Article ${articleId} contains an invalid Rich Text node.`);
    }
    if (node.value !== undefined && typeof node.value !== 'string') {
      throw new Error(`Article ${articleId} contains a Rich Text node with an invalid value.`);
    }
    if (typeof node.value === 'string') {
      textCharacters += node.value.length;
      if (textCharacters > RICH_TEXT_BUDGET.maxTextCharacters) {
        throw new Error(
          `Article ${articleId} Rich Text exceeds the maximum text size of ${RICH_TEXT_BUDGET.maxTextCharacters} characters.`,
        );
      }
    }

    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks)) {
        throw new Error(`Article ${articleId} contains a Rich Text node with invalid marks.`);
      }
      if (node.marks.length > RICH_TEXT_BUDGET.maxMarksPerNode) {
        throw new Error(
          `Article ${articleId} Rich Text exceeds the maximum of ${RICH_TEXT_BUDGET.maxMarksPerNode} marks on one node.`,
        );
      }
      for (const mark of node.marks) {
        if (!mark || typeof mark !== 'object' || Array.isArray(mark)) {
          throw new Error(`Article ${articleId} contains a Rich Text node with invalid marks.`);
        }
      }
    }
    if (node.content !== undefined && !Array.isArray(node.content)) {
      throw new Error(`Article ${articleId} contains a Rich Text node with invalid content.`);
    }

    if (Array.isArray(node.content)) {
      if (node.content.length > 0 && current.depth === RICH_TEXT_BUDGET.maxDepth) {
        throw new Error(
          `Article ${articleId} Rich Text exceeds the maximum depth of ${RICH_TEXT_BUDGET.maxDepth}.`,
        );
      }
      if (nodeCount + stack.length + node.content.length > RICH_TEXT_BUDGET.maxNodes) {
        throw new Error(
          `Article ${articleId} Rich Text exceeds the maximum node count of ${RICH_TEXT_BUDGET.maxNodes}.`,
        );
      }
      for (let index = node.content.length - 1; index >= 0; index -= 1) {
        stack.push({ value: node.content[index], depth: current.depth + 1 });
      }
    }
  }
}
