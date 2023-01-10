import { Canvas } from "./Canvas";
import { KeyboardInput } from "./KeyboardInput";
import { MouseInput, MouseInputWithCollision, MouseInputWithoutCollision } from "./MouseInput";

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
 * Default CanvasSizeOptions if canvasSize is not 'auto'
 */
const defaultCanvasSizeOptionsNotAuto: Required<CanvasSizeOptions> = {
    width: 1280,
    height: 720,
    sizingMethod: 'resize',
    sizing: 'fit',
    dpr: true
};

interface JaPNaAEngine2dOptions {
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

interface CanvasSizeOptions {
    /**
     * Width of the canvas.
     * 
     * 'auto' corresponds to innerWidth
     */
    width: number | 'auto';

    /**
     * Height of the canvas.
     * 
     * 'auto' corresponds to innerHeight
     */
    height: number | 'auto';

    /**
     * Controls if the canvas will automatically resize when the user resizes the window
     * 
     * default: true
     */
    autoResize: boolean;

    /**
     * Controls how large the canvas will resize to.
     *   - 'none' - The canvas will not become larger or smaller than your specified width and height
     *     - If width or height is 'auto', the canvas will still resize. If you don't want the canvas to change size during runtime, set `autoResize: false`
     *   - 'fit' - be as large as possible without going outside the screen (retaining aspect ratio)
     *   - 'cover' - zoom to cover the entire screen (retaining aspect ratio). Some pixels may be lost.
     *     - Usually `{ width: 'auto', height: 'auto', resizing: 'none' }` is a better option
     * 
     * default: fit
     */
    sizing?: 'none' | 'cover' | 'fit';


    /**
     * Controls the method to resize the canvas
     *   - 'resize' - Changes the canvas's width and height, retaining aspect ratio
     *   - 'scale' - Enlarges the canvas without changing width and height
     * 
     * default: 'resize'; no effect if resizing is 'none'
     */
    sizingMethod?: 'resize' | 'scale';

    /**
     * Controls how the canvas responds to the devicePixelRatio
     *   - 'none' - No effect (width = targetWidth; height = targetHeight)
     *   - 'scale' - Scales up the canvas (actualWidth = targetWidth * dpr; actualHeight = targetHeight * dpr; renderingContext.scale(dpr, dpr); width = targetWidth; height = targetHeight)
     *      - Your app will still the the canvas size uneffected by devicePixelRatio, but the rendering will be done on a larger canvas
     *   - 'oneToOne' - (width = targetWidth * dpr; height = targetHeight * dpr)
     *      - The canvas will retain a one-to-one ratio with the screen's pixels.
     *      - Your app will have to manually adjust for the devicePixelRatio
     * If the canvas size should change based on the dpr.
     * 
     * default: 'scale'
     */
    dpr?: 'none' | 'scale' | 'oneToOne';
}
