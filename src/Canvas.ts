export class Canvas {
    private canvas = document.createElement("canvas");
    public X = this.canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;

    /**
     * Width of the canvas (before dpr); the width the application should use
     */
    public width = 0;
    /**
     * Height of the canvas (before dpr); the height the application should use
     */
    public height = 0;
    /**
     * Horizontal space between canvas and window.
     */
    public offsetX = 0;
    /**
     * Vertical space between canvas and window.
     */
    public offsetY = 0;
    /**
     * Width of the canvas in pixels (after dpr)
     */
    public actualWidth = 0;
    /**
     * Height of the canvas in pixels (after dpr)
     */
    public actualHeight = 0;
    /**
     * The canvas's scaling. (width * scaling = actualWidth)
     */
    public scaling = 1;

    private lastConstraintWidth = 0;
    private lastConstraintHeight = 0;

    /**
     * If waiting for a resize event (iOS)
     */
    private waitingForResize = false;
    private resizeAnimationFrameRequestId = 0;

    constructor(private options: Required<CanvasSizeOptions>) {
        if (!this.X) { alert("Browser not supported"); throw new Error("Browser not supported: cannot get canvas context"); }

        this.resizeHandler = this.resizeHandler.bind(this);
        addEventListener("resize", this.resizeHandler);
        this.resizeBasedOnScreen();
    }

    /**
     * Resizes the canvas based on the supplied CanvasSizeOptions and current innerWidth/innerHeight
     */
    public resizeBasedOnScreen() {
        const scaling = this.determineCanvasBoundingBoxScaling();
        const targetWidth = this.options.width === "auto" ? innerWidth / scaling : this.options.width;
        const targetHeight = this.options.height === "auto" ? innerHeight / scaling : this.options.height;
        const boundingBoxWidth = Math.round(targetWidth * scaling);
        const boundingBoxHeight = Math.round(targetHeight * scaling);

        // Setting new canvas size.
        let newWidth;
        let newHeight;

        // 'resize' and 'scale' both match the found bounding box
        if (this.options.sizingMethod === "resize") {
            newWidth = boundingBoxWidth;
            newHeight = boundingBoxHeight;
            this.scaling = 1;
        } else if (this.options.sizingMethod === "scale") {
            // 'scaleImage' keeps the original width / height options and uses the rendering context to zoom
            newWidth = targetWidth;
            newHeight = targetHeight;
            this.scaling = scaling;
        } else { // this.options.sizingMethod === "scaleImage"
            // 'scaleImage' keeps the original width / height options and uses CSS to size the canvas instead
            newWidth = targetWidth;
            newHeight = targetHeight;
            this.scaling = 1;
        }

        // Dealing with dpr != 1.
        const dpiScaling = this.options.dpr === "none" ? 1 : window.devicePixelRatio || 1;
        if (this.options.dpr === "scale") {
            this.scaling *= dpiScaling;
        } else if (this.options.dpr === "oneToOne") {
            newWidth *= dpiScaling;
            newHeight *= dpiScaling;
        } // else this.options.this.dprScaling === "none"

        // Centering the canvas.
        if (this.options.centering) {
            this.offsetX = (innerWidth - boundingBoxWidth) / 2;
            this.offsetY = (innerHeight - boundingBoxHeight) / 2;
        } else {
            this.offsetX = this.offsetY = 0;
        }

        // Apply
        this.width = newWidth;
        this.height = newHeight;
        this.canvas.width = this.actualWidth = Math.round(this.scaling * newWidth);
        this.canvas.height = this.actualHeight = Math.round(this.scaling * newHeight);
        this.X.scale(this.scaling, this.scaling);

        // Apply CSS styles.
        this.canvas.style.width = boundingBoxWidth + "px";
        this.canvas.style.height = boundingBoxHeight + "px";
        this.canvas.style.left = this.offsetX + "px";
        this.canvas.style.top = this.offsetY + "px";

        this.lastConstraintWidth = innerWidth;
        this.lastConstraintHeight = innerHeight;
    }

    /**
     * Find how much to increase width and height of canvas size to fulfills requirements.
     */
    private determineCanvasBoundingBoxScaling(): number {
        if (this.options.width === 'auto' && this.options.height === 'auto') {
            return 1;
        }

        if (this.options.sizing === "fit") {
            const widthScaling = this.options.width === 'auto' ? Infinity : innerWidth / this.options.width;
            const heightScaling = this.options.height === 'auto' ? Infinity : innerHeight / this.options.height;
            return Math.min(widthScaling, heightScaling);
        } else if (this.options.sizing === "cover") {
            const widthScaling = this.options.width === 'auto' ? 0 : innerWidth / this.options.width;
            const heightScaling = this.options.height === 'auto' ? 0 : innerHeight / this.options.height;
            return Math.max(widthScaling, heightScaling);
        } else { // this.options.sizing === "none"
            return 1;
        }
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


export interface CanvasSizeOptions {
    /**
     * Width of the canvas.
     * 
     * 'auto' usually corresponds to innerWidth.
     * 
     * default: 'auto'
     */
    width?: number | 'auto';

    /**
     * Height of the canvas.
     * 
     * 'auto' usually corresponds to innerHeight
     * 
     * default: 'auto'
     */
    height?: number | 'auto';

    /**
     * Controls if the canvas will automatically resize when the user resizes the window
     * 
     * default: true
     */
    autoResize?: boolean;

    /**
     * Controls if the canvas should be aligned at the center of the window.
     * 
     * default: true
     */
    centering?: boolean;

    /**
     * Controls how large the canvas will resize to.
     * 
     *   - 'none' - The canvas will not become larger or smaller than your specified width and height
     *     - If width or height is 'auto', the canvas will still resize. If you don't want the canvas to change size during runtime, set `autoResize: false`
     *   - 'fit' - be as large as possible without going outside the screen (retaining aspect ratio)
     *   - 'cover' - zoom to cover the entire screen (retaining aspect ratio). Some pixels may be lost.
     *     - Usually `{ width: 'auto', height: 'auto', resizing: 'none' }` is a better option
     * 
     * If width and height are 'auto', then this option has no effect.
     * 
     * default: fit
     */
    sizing?: 'none' | 'cover' | 'fit';

    /**
     * Controls the method to resize the canvas
     *   - 'resize' - Changes the canvas's width and height, retaining aspect ratio
     *   - 'scale' - Scales the canvas without changing (percieved) width and height
     *   - 'scaleImage' - Enlarges rendered canvas image without changing width and height
     * 
     * If width and height are 'auto', then this option has no effect.
     * If resizing is 'none', then this options has no effect.
     * 
     * default: 'scale'; 
     */
    sizingMethod?: 'resize' | 'scale' | 'scaleImage';

    /**
     * Controls how the canvas responds to the devicePixelRatio
     *   - 'none' - Don't respond to devicePixelRatio (width = targetWidth; height = targetHeight)
     *   - 'scale' - Scales up the canvas without changing (percieved) width and height
     *      - Your app will still the the canvas size uneffected by devicePixelRatio, but the rendering will be done on a larger canvas
     *   - 'oneToOne' - (width = targetWidth * dpr; height = targetHeight * dpr)
     *      - The canvas will retain a one-to-one ratio with the screen's pixels.
     *      - Your app will have to manually adjust for the devicePixelRatio
     * 
     * default: 'scale'
     */
    dpr?: 'none' | 'scale' | 'oneToOne';
}
