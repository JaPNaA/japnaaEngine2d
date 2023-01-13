import { Canvas, CanvasOptions } from "./Canvas.js";
import { CanvasSizeOptions, CanvasSizer } from "./CanvasSizer.js";
import { Component, Elm, InputElm } from "./elements.js";
import { HTMLOverlay, HTMLOverlayOptions } from "./HTMLOverlay.js";
import { KeyboardInput } from "./KeyboardInput.js";
import { MouseInput, MouseInputWithCollision, MouseInputWithoutCollision } from "./MouseInput.js";

export class JaPNaAEngine2d {
    // public world: World;
    // public collider: Collider;
    public keyboard: KeyboardInput; // keyboard mouse touch should only be enabled once used
    public mouse: MouseInput; // mouse.collisionType getter gives error if mouseInCollisionSystem is false
    // public touch: TouchInput;
    public canvas: Canvas;
    public sizer: CanvasSizer;
    public htmlOverlay: HTMLOverlay;

    private options: Required<JaPNaAEngine2dOptions>;

    constructor(options?: JaPNaAEngine2dOptions) {
        this.options = {
            ...defaultJaPNaAEngineOptions,
            ...options
        };

        if (this.options.mouseInCollisionSystem) {
            this.mouse = new MouseInputWithCollision();
        } else {
            this.mouse = new MouseInputWithoutCollision();
        }

        this.keyboard = new KeyboardInput();

        this.sizer = new CanvasSizer({
            ...defaultCanvasSizeOptions,
            ...this.options.sizing
        });

        this.canvas = new Canvas({
            ...defaultCanvasOptions,
            ...this.options.canvas
        }, this.sizer);

        this.htmlOverlay = new HTMLOverlay({
            ...defaultHTMLOverlayOptions,
            ...this.options.htmlOverlay
        }, this.sizer);

        if (this.options.parentElement === document.body) {
            this.canvas.appendTo(this.options.parentElement);
            this.htmlOverlay.appendTo(this.options.parentElement);
            const style = document.createElement("style");
            style.innerHTML = "body { overflow: hidden; margin: 0; } canvas, .HTMLOverlay { position: absolute; }";
            document.head.appendChild(style);
        } else {
            throw new Error("Not implemented");
        }

        // this.world = new World();
    }
}

// include elements.ts exports
export { Elm, InputElm, Component };

/**
 * Default CanvasSizeOptions
 */
const defaultCanvasSizeOptions: Required<CanvasSizeOptions> = {
    width: 'auto',
    height: 'auto',
    autoResize: true,
    centering: true,
    sizingMethod: 'scale',
    sizing: 'fit',
    dpr: 'scale'
};

/**
 * Default CanvasSizeOptions
 */
const defaultCanvasOptions: Required<CanvasOptions> = {
    alpha: false
};

/**
 * Default HTMLOverlayOptions
 */
const defaultHTMLOverlayOptions: Required<HTMLOverlayOptions> = {
    scale: true,
    stick: true
};

/**
 * Default JaPNaAEngine2dOptions
 */
const defaultJaPNaAEngineOptions: Required<JaPNaAEngine2dOptions> = {
    canvas: defaultCanvasOptions,
    sizing: defaultCanvasSizeOptions,
    htmlOverlay: defaultHTMLOverlayOptions,
    collision: 'sortedAuto',
    parentElement: document.body,
    touchInputAsMouseInput: true,
    mouseInCollisionSystem: true
};

export interface JaPNaAEngine2dOptions {
    /**
     * Controls the canvas options. (Change sizing options in `sizing`).
     * 
     * By default, the canvas will have no transparency.
     */
    canvas?: CanvasOptions;

    /**
     * Controls HTMLOverlay options.
     * 
     * By default, the htmlOverlay will scale and 'stick' to the canvas.
     */
    htmlOverlay?: HTMLOverlayOptions;

    /**
     * How the Canvas should be positioned on the screen and in world space.
     * 
     * By default, the canvas will cover the entire screen and respond to devicePixelRatio.
     */
    sizing?: CanvasSizeOptions;

    /**
     * Selects the system to use for collision detection.
     * 
     *   - 'none' - collisions are not detected
     *   - 'simple' - every object's aabb bounding boxes are checked with every other
     *   - 'sortedX' / 'sortedY' / 'sortedAuto' - sorts every object by x or y axis, then checks collisions with neighbors on x/y axis
     *   - 'quadTree' - organizes objects in a quadTree and checks collisions with nearby objects
     *     - Hitboxes in the collision system must be QuadTreeHitbox
     * 
     * default: 'sortedAuto'
     */
    collision?: 'none' | 'simple' | 'sortedX' | 'sortedY' | 'sortedAuto' | 'quadTree';

    /**
     * A parent element for the HTMLCanvas.
     * 
     * If parentElement is document.body, the canvas will be appended directly to the body and a \<style> will be appended to document.head.
     * 
     * If parentElement is anything other than document.body, the canvas will be wrapped in a \<div class='JaPNaAEngine2dWrapper'>.
     * 
     * default: document.body
     */
    parentElement?: HTMLElement;

    /**
     * If set true, the engine will detect touch events and convert the events equivalent 'mousedown' 'mouseup' 'wheel' (pinch) events
     * 
     * default: true
     */
    touchInputAsMouseInput?: boolean;

    /**
     * If set true, the mouse is added to the collision system as a mouse.collisionType.
     * 
     * Adding the mouse to the collision system may be useful if ui elements are in the game (ex. hovering over an enemy).
     * 
     * default: false
     */
    mouseInCollisionSystem?: boolean;
}
