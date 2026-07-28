import { loadPublication } from '../src/contentful/fetch-content';
import { approvedArticles } from '../src/utilities/content';

const publication = await loadPublication();
const approved = approvedArticles(publication);

console.log(`Content source: ${publication.source}`);
console.log(`Approved articles: ${approved.length}`);
console.log(`Authors: ${publication.authors.length}`);
console.log(`Categories: ${publication.categories.length}`);
console.log(`Topics: ${publication.topics.length}`);
console.log('Content validation passed.');
