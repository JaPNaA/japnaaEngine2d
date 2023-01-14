import { RectangleM } from "../geometry/Rectangle.js";

class Texture extends RectangleM {
    public imageSrc: HTMLImageElement | HTMLCanvasElement;

    constructor(src: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
        this.imageSrc = src;
    }
}

export default Texture;