import { loadPublication } from '../src/contentful/fetch-content';
import { publishedArticles } from '../src/utilities/content';

const publication = await loadPublication();
const published = publishedArticles(publication);

console.log(`Content source: ${publication.source}`);
console.log(`Published articles: ${published.length}`);
console.log(`Authors: ${publication.authors.length}`);
console.log(`Categories: ${publication.categories.length}`);
console.log(`Topics: ${publication.topics.length}`);
console.log('Content validation passed.');
