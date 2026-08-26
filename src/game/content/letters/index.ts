import type { LetterContent } from './letterContent.types';
import { letterB } from './letterB';

export type { LetterContent, LetterExampleWord } from './letterContent.types';
export { letterB };

export const letters: Record<string, LetterContent> = {
    B: letterB,
};

export const getLetterContent = (id: string): LetterContent => {
    const content = letters[id];

    if (!content) {
        throw new Error(`No letter content registered for id "${id}"`);
    }

    return content;
};
