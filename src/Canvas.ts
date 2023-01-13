import { CanvasSizeOptions, CanvasSizer } from "./CanvasSizer.js";
import { Vec2 } from "./geometry/Vec2.js";

export class Canvas {
    private canvas = document.createElement("canvas");
    public X: CanvasRenderingContext2D;

    private sizer: CanvasSizer;
    public get width(): number { return this.sizer.width; }
    public get height(): number { return this.sizer.height; }

    private lastConstraintWidth = 0;
    private lastConstraintHeight = 0;

    /**
     * If waiting for a resize event (iOS)
     */
    private waitingForResize = false;
    private resizeAnimationFrameRequestId = 0;

    constructor(private options: Required<CanvasOptions & { sizing: Required<CanvasSizeOptions> }>) {
        this.X = this.canvas.getContext("2d", { alpha: this.options.alpha })!;
        if (!this.X) { alert("Browser not supported"); throw new Error("Browser not supported: cannot get canvas context"); }
        this.sizer = new CanvasSizer(options.sizing);

        this.resizeHandler = this.resizeHandler.bind(this);
        addEventListener("resize", this.resizeHandler);
        this.resizeBasedOnScreen();
    }

    public resizeBasedOnScreen() {
        this.sizer.resizeOnConstraints(innerWidth, innerHeight);

        this.canvas.width = this.sizer.actualWidth;
        this.canvas.height = this.sizer.actualHeight;
        this.X.scale(this.sizer.scaling, this.sizer.scaling);

        // Apply CSS styles.
        this.canvas.style.width = this.sizer.boundingBoxWidth + "px";
        this.canvas.style.height = this.sizer.boundingBoxHeight + "px";
        this.canvas.style.left = this.sizer.offset.x + "px";
        this.canvas.style.top = this.sizer.offset.y + "px";

        this.lastConstraintWidth = innerWidth;
        this.lastConstraintHeight = innerHeight;
    }

    public screenPosToCanvasPos(screenPos: Vec2): Vec2 {
        return this.sizer.screenPosToCanvasPos(screenPos);
    }

    public _dispose() {
        removeEventListener("resize", this.resizeHandler);
    }

    public appendTo(parent: HTMLElement) {
        parent.appendChild(this.canvas);
    }

    private resizeHandler() {
        if (!this.options.autoResize) { return; }
        if (innerWidth === this.lastConstraintWidth && innerHeight == this.lastConstraintHeight) {
            // Wait for resize to happen (on iOS)
            if (this.waitingForResize) { return; }
            this.waitingForResize = true;
            this.resizeAnimationFrameRequestId = requestAnimationFrame(() => {
                this.waitingForResize = false;
                this.resizeHandler();
            });
        } else {
            this.waitingForResize = false;
            cancelAnimationFrame(this.resizeAnimationFrameRequestId);
            this.resizeBasedOnScreen();
        }
    }
}


export interface CanvasOptions {
    /**
     * Controls if the canvas will automatically resize when the user resizes the window
     * 
     * default: true
     */
    autoResize?: boolean;

    /**
     * Determines if the canvas is transparent. (If things behind the canvas are visible.)
     * 
     * default: false
     */
    alpha?: boolean;

    /**
     * How the Canvas should be positioned on the screen and in world space.
     * 
     * By default, the canvas will cover the entire screen and respond to devicePixelRatio.
     */
    sizing?: CanvasSizeOptions;
}
