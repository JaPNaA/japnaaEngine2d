import { CanvasSizer } from "./CanvasSizer.js";
import { Component } from "./elements.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";

export class HTMLOverlay extends Component {
    public _screenToWorldPos: (v2: Vec2) => Vec2 = x => x;

    constructor(private options: Required<HTMLOverlayOptions>, private sizer: CanvasSizer) {
        super("HTMLOverlay");

        this.elm.class("JaPNaAEngine2dHTMLOverlay");

        this.elm.on("mousedown", e => e.stopPropagation());
        this.elm.on("keydown", e => e.stopPropagation());
        this.elm.on("keyup", e => e.stopPropagation());

        this.sizer.onResize.subscribe(() => this.updateTransform());
        this.updateTransform();
    }

    public tick() {
        if (this.options.relativeToWorld) {
            this.updateTransform();
        }
    }

    private updateTransform() {
        const elm = this.elm.getHTMLElement();
        // note: this implementation is problematic because the correct behaviour of
        // stick relies on `{ scale: true }`
        if (this.options.relativeToWorld) {
            const offset = this._screenToWorldPos(new Vec2M(0, 0));
            const scale = Vec2M.subtract(this._screenToWorldPos(new Vec2M(1, 1)), offset);
            if (this.options.stick) {
                elm.style.left = -offset.x / scale.x + "px";
                elm.style.top = -offset.y / scale.y + "px";
            }
            if (this.options.scale) {
                elm.style.transformOrigin = "0 0";
                elm.style.transform = "scale(" + (1 / scale.x) + ", " + (1 / scale.y) + ")";
            }
        } else {
            if (this.options.stick) {
                elm.style.left = this.sizer.offset.x + "px";
                elm.style.top = this.sizer.offset.y + "px";
            }
            if (this.options.scale) {
                elm.style.transformOrigin = "0 0";
                elm.style.transform = "scale(" + this.sizer.htmlScaling + ")";
            }
        }
        elm.style.width = this.sizer.width + "px";
        elm.style.height = this.sizer.height + "px";
    }

    public _dispose() {
        this.elm.remove();
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
    /**
     * Should the HTMLOverlay be positioned in the engine's world? / Does the
     * camera effect the HTMLOverlay?
     * 
     *   - false -> The elements do not move when the camera moves
     *   - true -> The elements move when the camera moves
     * 
     * default: false
     */
    relativeToWorld?: boolean;
}
