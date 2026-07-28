import { loadPublication } from './fetch-content';
import { createIndexes } from '../utilities/content';

export const publication = await loadPublication();
export const indexes = createIndexes(publication);
