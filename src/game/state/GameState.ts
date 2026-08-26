export interface GameStateSnapshot {
    currentLetterId: string;
    score: number;
    stars: number;
    correctActions: number;
    mistakes: number;
    segmentsCompleted: number;
}

class GameStateManager {
    private currentLetterId = 'B';
    private score = 0;
    private stars = 0;
    private correctActions = 0;
    private mistakes = 0;
    private segmentsCompleted = 0;

    setCurrentLetter(letterId: string): void {
        this.currentLetterId = letterId;
    }

    registerCorrect(points = 10): void {
        this.correctActions += 1;
        this.score += points;
    }

    registerMistake(): void {
        this.mistakes += 1;
    }

    addStar(count = 1): void {
        this.stars += count;
    }

    completeSegment(): void {
        this.segmentsCompleted += 1;
    }

    reset(): void {
        this.score = 0;
        this.stars = 0;
        this.correctActions = 0;
        this.mistakes = 0;
        this.segmentsCompleted = 0;
    }

    get snapshot(): GameStateSnapshot {
        return {
            currentLetterId: this.currentLetterId,
            score: this.score,
            stars: this.stars,
            correctActions: this.correctActions,
            mistakes: this.mistakes,
            segmentsCompleted: this.segmentsCompleted,
        };
    }
}

export const GameState = new GameStateManager();
