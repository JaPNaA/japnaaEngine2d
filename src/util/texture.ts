import { Rectangle } from "../geometry/Rectangle.js.js";

class Texture extends Rectangle {
    public imageSrc: HTMLImageElement | HTMLCanvasElement;

    constructor(src: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width: number, height: number) {
        super(x, y, width, height);
        this.imageSrc = src;
    }
}

export default Texture;