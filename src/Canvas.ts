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
        let targetWidth = this.options.width === "auto" ? innerWidth : this.options.width;
        let targetHeight = this.options.height === "auto" ? innerHeight : this.options.height;
        let [canvasBoundingBoxWidth, canvasBoundingBoxHeight] = this.determineTargetCanvasBoundingBox(targetWidth, targetHeight);
        const dpiScaling = this.options.dpr === "none" ? 1 : window.devicePixelRatio || 1;

        // Re-auto-sizing. If the width or height is auto, we resize the bounding box to ensure
        // it covers the full width/height. (The first bounding box may be shrinked to not fill the
        // full width/height)
        if (this.options.width === "auto") {
            canvasBoundingBoxWidth = targetWidth;
            targetWidth *= targetHeight / canvasBoundingBoxHeight; // increase targetWidth to fill entire width
        }
        if (this.options.height === "auto") {
            canvasBoundingBoxHeight = targetHeight;
            targetHeight *= targetWidth / canvasBoundingBoxWidth; // increase targetHeight to fill entire height
        }

        // Setting new canvas size.
        let newWidth;
        let newHeight;

        // 'resize' and 'scale' both match the found bounding box
        if (this.options.sizingMethod === "resize") {
            newWidth = canvasBoundingBoxWidth;
            newHeight = canvasBoundingBoxHeight;
            this.scaling = 1;
        } else if (this.options.sizingMethod === "scale") {
            newWidth = canvasBoundingBoxWidth;
            newHeight = canvasBoundingBoxHeight;
            this.scaling = canvasBoundingBoxWidth / targetWidth;
        } else { // this.options.sizingMethod === "scaleImage"
            // 'scaleImage' keeps the original width / height options and uses CSS to size the canvas instead
            newWidth = targetWidth;
            newHeight = targetHeight;
            this.scaling = 1;
        }

        // Dealing with dpr != 1.
        if (this.options.dpr === "scale") {
            this.scaling *= dpiScaling;
            this.width = newWidth;
            this.height = newHeight;
            this.canvas.width = this.actualWidth = dpiScaling * newWidth;
            this.canvas.height = this.actualHeight = dpiScaling * newHeight;
            this.X.scale(this.scaling, this.scaling);
        } else { // ['none', 'oneToOne'].includes(this.options.this.dprScaling)
            // 'none' does nothing here because dpiScaling is set to 1 earlier
            this.canvas.width = this.actualWidth = this.width = dpiScaling * newWidth;
            this.canvas.height = this.actualHeight = this.height = dpiScaling * newHeight;
        }

        // Centering the canvas.
        if (this.options.centering) {
            this.offsetX = (innerWidth - canvasBoundingBoxWidth) / 2;
            this.offsetY = (innerHeight - canvasBoundingBoxHeight) / 2;
        } else {
            this.offsetX = this.offsetY = 0;
        }

        // Apply CSS styles.
        this.canvas.style.width = canvasBoundingBoxWidth + "px";
        this.canvas.style.height = canvasBoundingBoxHeight + "px";
        this.canvas.style.left = this.offsetX + "px";
        this.canvas.style.top = this.offsetY + "px";
    }

    /**
     * Finds a width and height of a canvas size that fulfills requirements while preserving aspect ratio.
     */
    private determineTargetCanvasBoundingBox(targetWidth: number, targetHeight: number): [number, number] {
        const targetWidthHeightRatio = targetWidth / targetHeight;
        const screenWidthHeightRatio = innerWidth / innerHeight;

        // determine rectangle 
        if (this.options.sizing === "fit") {
            if (targetWidthHeightRatio < screenWidthHeightRatio) {
                // width is limiting
                return [Math.round(innerHeight * targetWidthHeightRatio), innerHeight];
            } else {
                // height is limiting
                return [innerWidth, Math.round(innerWidth / targetWidthHeightRatio)];
            }
        } else if (this.options.sizing === "cover") {
            if (targetWidthHeightRatio < screenWidthHeightRatio) {
                // width is smaller
                return [innerWidth, Math.round(innerWidth / targetWidthHeightRatio)];
            } else {
                // height is bigger
                return [Math.round(innerHeight * targetWidthHeightRatio), innerHeight];
            }
        } else { // this.options.sizing === "none"
            return [targetWidth, targetHeight];
        }
    }

    public _dispose() {
        removeEventListener("resize", this.resizeHandler);
    }

    public appendTo(parent: HTMLElement) {
        parent.appendChild(this.canvas);
    }

    private resizeHandler() {
        if (this.options.autoResize) {
            this.resizeBasedOnScreen();
        }
    }
}

// class Canvas2 {
//     private canvas: HTMLCanvasElement;

//     constructor(o: { width: number, height: number }) {
//         this.canvas = document.createElement("canvas");
//         this.canvas.classList.add("JaPNaA");
//         this.canvas.width = o.width;
//         this.canvas.height = o.height;

//         addEventListener("resize", this.resizeHandler.bind(this));
//         this.resizeHandler();
//     }

//     public appendTo(parent: HTMLElement) {
//         parent.appendChild(this.canvas);
//     }

//     private resizeHandler() {
//     }
//     resize() {
//         if (this.resizing || !this.started && this.lastSize.has) return;
//         var dpr = window.devicePixelRatio || 1,
//             w = window.innerWidth,
//             h = window.innerHeight;

//         if (w == this.lastSize.w && h == this.lastSize.h && this.lastSize.has) {
//             this.resizing = true;
//             this.resizeLoop();
//             return;
//         }

//         if (h * this.ratio < w) {
//             this.canvas.classList.remove("h");
//             document.body.classList.remove("h");

//             this.canvas.width = h * this.ratio * dpr;
//             this.canvas.height = h * dpr;

//             this.offsetX = (w - this.canvas.width / dpr) / 2;
//             this.canvas.style.left = this.offsetX + "px";

//             this.offsetY = 0;
//             this.canvas.style.top = 0;
//         } else {
//             this.canvas.classList.add("h");
//             document.body.classList.add("h");

//             this.canvas.width = w * dpr;
//             this.canvas.height = w / this.ratio * dpr;

//             this.offsetX = 0;
//             this.canvas.style.left = 0;

//             this.offsetY = (h - this.canvas.height / dpr) / 2;
//             this.canvas.style.top = this.offsetY + "px";
//         }

//         this.lastSize.w = window.innerWidth;
//         this.lastSize.h = window.innerHeight;
//         this.lastSize.has = true;

//         this.X.resetTransform();
//         this.scaleX = this.canvas.width / this.width;
//         this.scaleY = this.canvas.height / this.height;
//         this.X.scale(this.scaleX, this.scaleY);
//     }
//     resizeLoop() { // because ios is bad
//         if (window.innerWidth == this.lastSize.w && window.innerHeight == this.lastSize.h) {
//             requestAnimationFrame(() => this.resizeLoop());
//         } else {
//             this.resizing = false;
//             this.resize();
//         }
//     }
// }


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
     * default: 'resize'; 
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
