import type { LetterTracingPath } from './TracingPath';

/**
 * Temporary/tunable stroke coordinates for Letter B, in local letter space
 * (roughly a 200x260 box). Real scenes will position/scale these at runtime.
 */
export const letterBPath: LetterTracingPath = {
    uppercase: [
        {
            // Vertical spine, top to bottom.
            points: [
                { x: 20, y: 10 },
                { x: 20, y: 250 },
            ],
        },
        {
            // Upper bump.
            points: [
                { x: 20, y: 10 },
                { x: 110, y: 10 },
                { x: 140, y: 40 },
                { x: 140, y: 90 },
                { x: 110, y: 120 },
                { x: 20, y: 120 },
            ],
        },
        {
            // Lower bump.
            points: [
                { x: 20, y: 120 },
                { x: 120, y: 120 },
                { x: 150, y: 155 },
                { x: 150, y: 210 },
                { x: 120, y: 250 },
                { x: 20, y: 250 },
            ],
        },
    ],
    lowercase: [
        {
            // Vertical spine, top to bottom.
            points: [
                { x: 20, y: 0 },
                { x: 20, y: 190 },
            ],
        },
        {
            // Round bowl.
            points: [
                { x: 20, y: 130 },
                { x: 40, y: 110 },
                { x: 80, y: 110 },
                { x: 105, y: 140 },
                { x: 105, y: 165 },
                { x: 80, y: 190 },
                { x: 40, y: 190 },
                { x: 20, y: 170 },
            ],
        },
    ],
};
