export interface Waypoint {
    x: number;
    y: number;
}

export interface TracingStroke {
    points: Waypoint[];
}

export interface LetterTracingPath {
    uppercase: TracingStroke[];
    lowercase: TracingStroke[];
}

/**
 * Total length (in path units) of a stroke, summed across its segments.
 * Useful later for coverage/progress calculations without pointer tracing yet.
 */
export const getStrokeLength = (stroke: TracingStroke): number => {
    let length = 0;

    for (let i = 1; i < stroke.points.length; i++) {
        const a = stroke.points[i - 1];
        const b = stroke.points[i];
        length += Math.hypot(b.x - a.x, b.y - a.y);
    }

    return length;
};

export const getPathLength = (strokes: TracingStroke[]): number =>
    strokes.reduce((total, stroke) => total + getStrokeLength(stroke), 0);
