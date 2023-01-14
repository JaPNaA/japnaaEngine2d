import { CanvasSizer } from "./CanvasSizer.js";
import { Component } from "./elements.js";

export class HTMLOverlay extends Component {
    constructor(private options: Required<HTMLOverlayOptions>, private sizer: CanvasSizer) {
        super("HTMLOverlay");

        this.elm.on("mousedown", e => e.stopPropagation());
        this.elm.on("keydown", e => e.stopPropagation());
        this.elm.on("keyup", e => e.stopPropagation());

        this.sizer.onResize.subscribe(() => this.updateSizes());
        this.updateSizes();
    }

    private updateSizes() {
        const elm = this.elm.getHTMLElement();
        // note: this implementation is problematic because the correct behaviour of
        // stick relies on `{ scale: true }`
        // this implementation doesn't handle high dpr correctly, and is not tested with all the
        // different types of sizings provided by the sizer
        if (this.options.stick) { 
            elm.style.left = this.sizer.offset.x + "px";
            elm.style.top = this.sizer.offset.y + "px";
        }
        if (this.options.scale) {
            elm.style.transformOrigin = "0 0";
            elm.style.transform = "scale(" + this.sizer.scaling + ")";
        }
    }
}

export interface HTMLOverlayOptions {
    /**
     * Controls if (x, y) positions of CanvasElm in HTMLOverlay will match with the canvas's
     * 
     * default: true
     */
    stick?: boolean;
    /**
     * Controls if the HTMLOverlay will `transform: scale(...)` the same as the canvas
     * 
     * default: true
     */
    scale?: boolean;
}
