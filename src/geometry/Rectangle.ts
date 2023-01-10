export class Rectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) { }

    public static isColliding(rect1: Rectangle, rect2: Rectangle) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
    }

    public isColliding(other: Rectangle) {
        return Rectangle.isColliding(this, other);
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
