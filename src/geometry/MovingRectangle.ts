import { Rectangle } from "./Rectangle";

export class MovingRectangle extends Rectangle {
    public lastX: number;
    public lastY: number;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
        this.lastX = x;
        this.lastY = y;
    }

    setLasts() {
        this.lastX = this.x;
        this.lastY = this.y;
    }
}
