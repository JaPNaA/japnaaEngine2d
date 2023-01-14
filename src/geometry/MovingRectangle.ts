import { RectangleM } from "./Rectangle.js";

export class MovingRectangleM extends RectangleM {
    public lastX: number;
    public lastY: number;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
        this.lastX = x;
        this.lastY = y;
    }

    public setLasts() {
        this.lastX = this.x;
        this.lastY = this.y;
    }
}
