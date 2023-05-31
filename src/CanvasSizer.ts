import { Vec2, Vec2M } from "./geometry/Vec2.js";
import { EventBus } from "./util/EventBus.js";

export class CanvasSizer {
    public onResize: EventBus = new EventBus();

    /**
     * Width of the canvas (before scaling); the width the application should use
     */
    public width = 0;
    /**
     * Height of the canvas (before scaling); the height the application should use
     */
    public height = 0;
    /**
     * Space between canvas and window.
     */
    public offset = new Vec2M(0, 0);
    /**
     * Width of Canvas in DOM pixels
     */
    public boundingBoxWidth = 0;
    /**
     * Height of Canvas in DOM pixels
     */
    public boundingBoxHeight = 0;
    /**
     * Width of the canvas in pixels (after dpr)
     */
    public actualWidth = 0;
    /**
     * Height of the canvas in pixels (after dpr)
     */
    public actualHeight = 0;
    /**
     * The canvas's scaling in the rendering context.
     */
    public scaling = 1;

    /** Scaling due to devicePixelRatio (may be included in scaling depending on settings) */
    private dprScaling = 1;

    /** DOM pixels * this variable = world pixels */
    private domPixelsToWorldScale = 1;

    private constraintWidth = 0;
    private constraintHeight = 0;
    private lastConstraintWidth = 0;
    private lastConstraintHeight = 0;

    /**
     * If waiting for a resize event (iOS)
     */
    private waitingForResize = false;
    private resizeAnimationFrameRequestId = 0;

    /**
     * For when the parent element is not document.body
     */
    private resizeObserver?: ResizeObserver;


    constructor(private options: Required<CanvasSizeOptions>, public readonly isFullscreen = true, public readonly parentElement?: HTMLElement) {
        this.resizeHandler = this.resizeHandler.bind(this);
        if (isFullscreen) {
            addEventListener("resize", this.resizeHandler);
        } else if (this.parentElement) {
            this.resizeObserver = new ResizeObserver(this.resizeHandler);
            this.resizeObserver.observe(this.parentElement);
        } else {
            throw new Error("If not fullscreen, the parent element must be specified.");
        }
        this.findConstraintsAndResize();
    }

    public _dispose() {
        if (this.isFullscreen) {
            removeEventListener("resize", this.resizeHandler);
        } else {
            this.resizeObserver?.disconnect();
        }
    }

    /**
     * Resizes the canvas based on the supplied CanvasSizeOptions and current constraintWidth/Height
     */
    public resizeOnConstraints(width: number, height: number) {
        this.constraintWidth = width;
        this.constraintHeight = height;

        const scaling = this.determineCanvasBoundingBoxScaling();
        const targetWidth = this.options.width === "auto" ? this.constraintWidth / scaling : this.options.width;
        const targetHeight = this.options.height === "auto" ? this.constraintHeight / scaling : this.options.height;
        this.boundingBoxWidth = Math.round(targetWidth * scaling);
        this.boundingBoxHeight = Math.round(targetHeight * scaling);
        this.domPixelsToWorldScale = 1 / scaling;

        // Setting new canvas size.
        let newWidth;
        let newHeight;

        // 'resize' and 'scale' both match the found bounding box
        if (this.options.sizingMethod === "resize") {
            newWidth = this.boundingBoxWidth;
            newHeight = this.boundingBoxHeight;
            this.scaling = 1;
            this.domPixelsToWorldScale = 1;
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
        this.dprScaling = this.options.dpr === "none" ? 1 : window.devicePixelRatio || 1;
        if (this.options.dpr === "scale") {
            this.scaling *= this.dprScaling;
        } else if (this.options.dpr === "oneToOne") {
            newWidth *= this.dprScaling;
            newHeight *= this.dprScaling;
            this.domPixelsToWorldScale *= this.dprScaling;
        } // else this.options.this.dprScaling === "none"

        // Centering the canvas.
        if (this.options.centering) {
            this.offset.x = (this.constraintWidth - this.boundingBoxWidth) / 2;
            this.offset.y = (this.constraintHeight - this.boundingBoxHeight) / 2;
        } else {
            this.offset.x = this.offset.y = 0;
        }

        // Apply
        this.width = newWidth;
        this.height = newHeight;
        this.actualWidth = Math.round(this.scaling * newWidth);
        this.actualHeight = Math.round(this.scaling * newHeight);

        this.lastConstraintWidth = innerWidth;
        this.lastConstraintHeight = innerHeight;

        this.onResize.send();
    }

    public screenPosToCanvasPos(screenPos: Vec2): Vec2 {
        return Vec2M.subtract(screenPos, this.offset).scale(this.domPixelsToWorldScale);
    }

    /**
     * Find how much to increase width and height of canvas size to fulfills requirements.
     */
    private determineCanvasBoundingBoxScaling(): number {
        if (this.options.width === 'auto' && this.options.height === 'auto') {
            return 1;
        }

        if (this.options.sizing === "fit") {
            const widthScaling = this.options.width === 'auto' ? Infinity : this.constraintWidth / this.options.width;
            const heightScaling = this.options.height === 'auto' ? Infinity : this.constraintHeight / this.options.height;
            return Math.min(widthScaling, heightScaling);
        } else if (this.options.sizing === "cover") {
            const widthScaling = this.options.width === 'auto' ? 0 : this.constraintWidth / this.options.width;
            const heightScaling = this.options.height === 'auto' ? 0 : this.constraintHeight / this.options.height;
            return Math.max(widthScaling, heightScaling);
        } else { // this.options.sizing === "none"
            return 1;
        }
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
            this.findConstraintsAndResize();
        }
    }

    private findConstraintsAndResize() {
        if (this.isFullscreen) {
            this.resizeOnConstraints(innerWidth, innerHeight);
        } else if (this.parentElement) {
            if (this.parentElement.clientWidth === 0 && this.parentElement.clientHeight === 0) {
                // wait one frame to see if the sizes change
                requestAnimationFrame(() => {
                    this.resizeOnConstraints(this.parentElement!.clientWidth, this.parentElement!.clientHeight);
                });
            } else {
                this.resizeOnConstraints(this.parentElement.clientWidth, this.parentElement.clientHeight);
            }
        } else {
            throw new Error("Not fullscreen but parent element is not specified. Cannot resize.");
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
     * 'auto' usually corresponds to innerHeight.
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
