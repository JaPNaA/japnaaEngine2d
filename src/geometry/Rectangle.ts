import { Vec2 } from "./Vec2";

export class RectangleM {
    constructor(public x: number, public y: number, public width: number, public height: number) { }

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
}

export type Rectangle = Readonly<RectangleM>;
