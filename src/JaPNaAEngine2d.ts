import { Canvas, CanvasSizeOptions } from "./Canvas.js";
import { KeyboardInput } from "./KeyboardInput.js";
import { MouseInput, MouseInputWithCollision, MouseInputWithoutCollision } from "./MouseInput.js";

export class JaPNaAEngine2d {
    public world: World;
    public collider: Collider;
    public keyboard: KeyboardInput; // keyboard mouse touch should only be enabled once used
    public mouse: MouseInput; // mouse.collisionType getter gives error if mouseInCollisionSystem is false
    public touch: TouchInput;
    public canvas: Canvas;

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
        this.canvas = new Canvas();
    }
}

/**
 * Default JaPNaAEngine2dOptions
 */
const defaultJaPNaAEngineOptions: Required<JaPNaAEngine2dOptions> = {
    canvasSize: 'auto',
    collision: 'sortedAuto',
    parentElement: document.body,
    touchInputAsMouseInput: true,
    mouseInCollisionSystem: true
};

/**
 * Default CanvasSizeOptions
 */
const defaultCanvasSizeOptions: Required<CanvasSizeOptions> = {
    width: 'auto',
    height: 'auto',
    autoResize: true,
    centering: true,
    sizingMethod: 'resize',
    sizing: 'fit',
    dpr: 'scale'
};

export interface JaPNaAEngine2dOptions {
    /**
     * Controls the canvas size.
     * 
     * The default 'auto' will cover the screen, matching the window's aspect ratio.
     */
    canvasSize?: 'auto' | CanvasSizeOptions;

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
     * If parentElement is document.body, the canvas will be appended directly to the body and a <style> will be appended to document.head.
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
