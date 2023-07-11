import { CanvasSizer } from "./CanvasSizer.js";
import { Vec2 } from "./geometry/Vec2.js";

export class Canvas {
    private canvas = document.createElement("canvas");
    public X: CanvasRenderingContext2D;

    public get width(): number { return this.sizer.width; }
    public get height(): number { return this.sizer.height; }

    constructor(private options: Required<CanvasOptions>, private sizer: CanvasSizer) {
        this.X = this.canvas.getContext("2d", { alpha: this.options.alpha })!;
        if (!this.X) { alert("Browser not supported"); throw new Error("Browser not supported: cannot get canvas context"); }

        this.canvas.classList.add("JaPNaAEngine2dCanvas");

        this.sizer.onResize.subscribe(() => this.updateCanvasSizes());
        this.updateCanvasSizes();
    }

    private updateCanvasSizes() {
        this.canvas.width = this.sizer.actualWidth;
        this.canvas.height = this.sizer.actualHeight;
        this.X.scale(this.sizer.scaling, this.sizer.scaling);

        // Apply CSS styles.
        this.canvas.style.width = this.sizer.boundingBoxWidth + "px";
        this.canvas.style.height = this.sizer.boundingBoxHeight + "px";
        this.canvas.style.left = this.sizer.offset.x + "px";
        this.canvas.style.top = this.sizer.offset.y + "px";
    }

    public screenPosToCanvasPos(screenPos: Vec2): Vec2 {
        return this.sizer.screenPosToCanvasPos(screenPos);
    }

    public appendTo(parent: HTMLElement) {
        parent.appendChild(this.canvas);
    }

    public _dispose() {
        this.canvas.parentElement?.removeChild(this.canvas);
    }
}


export interface CanvasOptions {
    /**
     * Determines if the canvas is transparent. (If things behind the canvas are visible.)
     * 
     * default: false
     */
    alpha?: boolean;
}
