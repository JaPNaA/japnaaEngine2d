/** Immutable type of Vec2Mut */
export interface Vec2 {
    readonly x: number;
    readonly y: number;
    getAngle(): number;
    getLength(): number;
    clone(): Vec2M;
}

/** Vec2 Mutable */
export class Vec2M {
    x: number;
    y: number;

    static fromAngle(ang: number): Vec2M {
        return new Vec2M(Math.cos(ang), Math.sin(ang));
    }

    static fromPolar(ang: number, length: number): Vec2M {
        return new Vec2M(Math.cos(ang) * length, Math.sin(ang) * length);
    }

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /** (-x, -y) */
    public static invert(vec: Vec2): Vec2M {
        return new Vec2M(-vec.x, -vec.y);
    }

    /** Returns dot product */
    public static dot(a: Vec2, b: Vec2): number {
        return a.x * b.x + a.y * b.y;
    }

    /** Returns new Vec2 of sum */
    public static add(a: Vec2, b: Vec2): Vec2M {
        return new Vec2M(
            a.x + b.x,
            a.y + b.y
        );
    }

    /** Returns new Vec2 of subtraction */
    public static subtract(a: Vec2, b: Vec2): Vec2M {
        return new Vec2M(
            a.x - b.x,
            a.y - b.y
        );
    }

    /** Returns new Vec2 of scaled */
    public static scale(vec: Vec2, scalar: number): Vec2M {
        return new Vec2M(
            vec.x * scalar,
            vec.y * scalar
        );
    }

    /** Gets the angle of line from <from> to <to> */
    public static angle(from: Vec2, to: Vec2): number {
        return this.subtract(to, from).getAngle();
    }

    /** Mutates this vector, <vec> */

    public translate(vec: Vec2): this {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    public translatePolar(angle: number, dist: number): this {
        this.x += Math.cos(angle) * dist;
        this.y += Math.sin(angle) * dist;
        return this;
    }

    public scale(scalar: number): this {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    public lerp(amount: number, target: Vec2): this {
        this.x += (target.x - this.x) * amount;
        this.y += (target.y - this.y) * amount;
        return this;
    }

    public copy(target: Vec2): this {
        this.x = target.x;
        this.y = target.y;
        return this;
    }

    public getAngle(): number {
        return Math.atan2(this.y, this.x);
    }

    public getLength(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public clone(): Vec2M {
        return new Vec2M(this.x, this.y);
    }
}
