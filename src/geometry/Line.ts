import { Vec2 } from "./Vec2";

export class Line {
    constructor(public start: Vec2, public end: Vec2) { }

    public static isIntersectingLines(
        a: Line, b: Line
    ) {
        var t, u, v;
        t = (a.end.x - a.start.x) * (b.end.y - b.start.y) - (b.end.x - b.start.x) * (a.end.y - a.start.y);
        if (t === 0) return false;
        v = ((b.end.y - b.start.y) * (b.end.x - a.start.x) + (b.start.x - b.end.x) * (b.end.y - a.start.y)) / t;
        u = ((a.start.y - a.end.y) * (b.end.x - a.start.x) + (a.end.x - a.start.x) * (b.end.y - a.start.y)) / t;
        return 0 < v && v < 1 && 0 < u && u < 1;
    };
}