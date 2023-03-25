import { Vec2 } from "./Vec2";

export class RectangleM {
    constructor(public x: number, public y: number, public width: number, public height: number) { }

    public static fromRectangle(rect: Rectangle) {
        return new RectangleM(rect.x, rect.y, rect.width, rect.height);
    }

    public static isColliding(rect1: Rectangle, rect2: Rectangle) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    public isColliding(other: Rectangle) {
        return RectangleM.isColliding(this, other);
    }

    public containsVec2(vec2: Vec2) {
        return this.x <= vec2.x && this.x + this.width >= vec2.x &&
            this.y <= vec2.y && this.y + this.height >= vec2.y;
    }

    public centerX() {
        return this.x + this.width / 2;
    }

    public centerY() {
        return this.y + this.height / 2;
    }

    public rightX() {
        return this.x + this.width;
    }

    public bottomY() {
        return this.y + this.height;
    }

    public copy(target: Rectangle) {
        this.x = target.x;
        this.y = target.y;
        this.width = target.width;
        this.height = target.height;
    }

    public sameWithinThreshold(other: Rectangle, threshold: number) {
        return Math.abs(this.x - other.x) < threshold && Math.abs(this.y - other.y) < threshold && Math.abs(this.width - other.width) < threshold && Math.abs(this.height - other.height) < threshold;
    }
}

export type Rectangle = Readonly<RectangleM>;
