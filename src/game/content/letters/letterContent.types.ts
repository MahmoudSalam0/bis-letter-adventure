export interface LetterExampleWord {
    word: string;
    imageKey?: string;
}

export interface LetterContent {
    id: string;
    uppercase: string;
    lowercase: string;
    phonicsSound: string;
    exampleWords: LetterExampleWord[];
    distractorWords: LetterExampleWord[];
}
