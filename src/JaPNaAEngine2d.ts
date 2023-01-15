import { Camera } from "./Camera.js";
import { Canvas, CanvasOptions } from "./Canvas.js";
import { ParentWorldElm } from "./canvasElm/ParentWorldElm.js";
import { WorldElm } from "./canvasElm/WorldElm.js";
import { SubscriptionsComponent } from "./canvasElm/components/SubscriptionsComponent.js";
import { CanvasSizeOptions, CanvasSizer } from "./CanvasSizer.js";
import { CollisionSystem } from "./collision/CollisionSystem.js";
import { Component, Elm, InputElm } from "./elements.js";
import { HTMLOverlay, HTMLOverlayOptions } from "./HTMLOverlay.js";
import { KeyboardInput } from "./KeyboardInput.js";
import { MouseInput, MouseInputWithCollision, MouseInputWithoutCollision } from "./MouseInput.js";
import { Ticker } from "./Ticker.js";
import { World } from "./World.js";
import { KeyboardMovementComponent } from "./canvasElm/components/KeyboardMovementComponent.js";

export class JaPNaAEngine2d {
    /** Keyboard input */
    public keyboard: KeyboardInput; // keyboard mouse touch should only be enabled once used
    /** Mouse input */
    public mouse: MouseInput; // mouse.collisionType getter gives error if mouseInCollisionSystem is false
    // public touch: TouchInput;

    /** The size of the canvas */
    public sizer: CanvasSizer;
    /** The canvas everything is rendered to */
    public canvas: Canvas;
    /** An alternate 'canvas' using HTML elements. Useful for getting user input. */
    public htmlOverlay: HTMLOverlay;

    /** Offsetting and zooming in the canvas */
    public camera: Camera;
    /** Detects and handles collisions between elements */
    public collisions: CollisionSystem;
    /** The world contains all elements */
    public world: World;
    /** Controls timing of events in the engine */
    public ticker: Ticker;
    // public renderer: Renderer;

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
        
        this.camera = new Camera(this.sizer);
        this.collisions = new CollisionSystem();
        this.world = new World(this);
        this.ticker = new Ticker(this);

        if (this.options.parentElement === document.body) {
            this.canvas.appendTo(this.options.parentElement);
            this.htmlOverlay.appendTo(this.options.parentElement);
            const style = document.createElement("style");
            style.innerHTML = "body { overflow: hidden; margin: 0; } canvas, .HTMLOverlay { position: absolute; }";
            document.head.appendChild(style);
        } else {
            throw new Error("Not implemented");
        }
    }

    public tick() {
        this.ticker.tickAll(this.world.getElms());
    }

    public draw() {
        const X = this.canvas.X;

        X.clearRect(0, 0, this.canvas.width, this.canvas.height);

        X.save();

        this.camera.applyTransform(X);

        for (const elm of this.world.getElms()) {
            elm.draw();
        }

        X.restore();
    }

    public dispose() {
        this.keyboard._dispose();
        this.mouse._dispose();
        this.sizer._dispose();
    }
}

// include elements.ts exports
export { Elm, InputElm, Component };
// include world elements
export { ParentWorldElm, WorldElm }
// include world element components
export { SubscriptionsComponent, KeyboardMovementComponent }

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
