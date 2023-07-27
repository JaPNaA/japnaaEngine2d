import { Camera } from "./Camera.js";
import { Canvas, CanvasOptions } from "./Canvas.js";
import { ParentWorldElm } from "./canvasElm/ParentWorldElm.js";
import { WorldElm } from "./canvasElm/WorldElm.js";
import { SubscriptionsComponent } from "./canvasElm/components/SubscriptionsComponent.js";
import { KeyboardMovementComponent } from "./canvasElm/components/KeyboardMovementComponent.js";
import { ParentComponent } from "./canvasElm/components/ParentComponent.js";
import { CanvasSizeOptions, CanvasSizer } from "./CanvasSizer.js";
import { CollisionSystem, CollisionSystemQuadTree, CollisionSystemSimple, CollisionSystemSorted, NoCollisionSystem } from "./collision/CollisionSystem.js";
import { Component, Elm, InputElm } from "./elements.js";
import { HTMLOverlay, HTMLOverlayOptions } from "./HTMLOverlay.js";
import { KeyboardInput } from "./KeyboardInput.js";
import { MouseInput, MouseInputWithCollision, MouseInputWithoutCollision } from "./MouseInput.js";
import { Ticker } from "./Ticker.js";
import { World } from "./World.js";
import { WorldElmWithComponents } from "./canvasElm/WorldElmWithComponents.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";
import { CollisionReactionMap } from "./collision/CollisionReactionMap.js";
import { PrerenderCanvas } from "./PrerenderCanvas.js";
import { Collidable, Hitbox } from "./collision/Hitbox.js";
import { Rectangle, RectangleM } from "./geometry/Rectangle.js";
import { EventBus } from "./util/EventBus.js";
import { Renderer } from "./Renderer.js";

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
    /** Detects collisions between elements */
    public collisions: CollisionSystem;
    /** Handles collisions */
    public collisionReactions: CollisionReactionMap;
    /** The world contains all elements */
    public world: World;
    /** Controls timing of events in the engine */
    public ticker: Ticker;
    /** Renders the scene */
    public renderer: Renderer;

    private options: Required<JaPNaAEngine2dOptions>;

    constructor(options?: JaPNaAEngine2dOptions) {
        this.options = {
            ...defaultJaPNaAEngineOptions,
            ...options
        };

        const isFullscreen = this.options.parentElement === document.body;

        if (this.options.mouseInCollisionSystem) {
            this.mouse = new MouseInputWithCollision(isFullscreen, this.options.parentElement);
        } else {
            this.mouse = new MouseInputWithoutCollision(isFullscreen, this.options.parentElement);
        }

        this.keyboard = new KeyboardInput();

        this.sizer = new CanvasSizer({
            ...defaultCanvasSizeOptions,
            ...this.options.sizing
        }, isFullscreen, this.options.parentElement);

        if (isFullscreen) {
            const style = document.createElement("style");
            style.innerHTML = "body { overflow: hidden; margin: 0; } canvas.JaPNaAEngine2dCanvas, .HTMLOverlay.JaPNaAEngine2dHTMLOverlay { position: absolute; pointer-events: none; }";
            document.head.appendChild(style);
        } else {
            const style = document.createElement("style");
            style.innerHTML = "canvas.JaPNaAEngine2dCanvas, .HTMLOverlay.JaPNaAEngine2dHTMLOverlay { position: absolute; pointer-events: none; top: 0; left: 0; }";
            document.head.appendChild(style);

            // when resize called after detecting parentElement size change,
            // we need to redraw the canvas to prevent flickering
            if (this.options.ticks.fps !== "none") {
                this.sizer.onResize.subscribe(() => this.renderer.render());
            }

            // MouseInput and CanvasSizer expect the parent element to be not static
            if (getComputedStyle(this.options.parentElement).position === 'static') {
                this.options.parentElement.style.position = 'relative';
            }
        }

        this.canvas = new Canvas({
            ...defaultCanvasOptions,
            ...this.options.canvas
        }, this.sizer);

        this.htmlOverlay = new HTMLOverlay({
            ...defaultHTMLOverlayOptions,
            ...this.options.htmlOverlay
        }, this.sizer);

        this.camera = new Camera(this.sizer);

        if (typeof this.options.collision === "string") {
            this.options.collision = {
                ...defaultCollisionOptions,
                system: this.options.collision
            };
        }

        const collisionOptions: Required<CollisionOptions> = {
            ...defaultCollisionOptions,
            ...this.options.collision
        };

        if (collisionOptions.system === "none") {
            this.collisions = new NoCollisionSystem(collisionOptions);
        } else if (collisionOptions.system === "quadTree") {
            this.collisions = new CollisionSystemQuadTree(collisionOptions);
        } else if (collisionOptions.system === "simple") {
            this.collisions = new CollisionSystemSimple(collisionOptions);
        } else {
            const collisionSystemSorted = new CollisionSystemSorted(collisionOptions);
            this.collisions = collisionSystemSorted;
            if (collisionOptions.system === "sortedX") {
                collisionSystemSorted.axisFixed = true;
                collisionSystemSorted.useYAxis = false;
            } else if (collisionOptions.system === "sortedY") {
                collisionSystemSorted.axisFixed = true;
                collisionSystemSorted.useYAxis = true;
            }
        }
        this.collisionReactions = new CollisionReactionMap();
        this.collisions._setReactions(this.collisionReactions);
        this.world = new World(this);
        this.ticker = new Ticker(this, {
            ...defaultTickOptions,
            ...this.options.ticks
        });
        this.renderer = new Renderer(this, {
            ...defaultRenderOptions,
            ...this.options.render
        });

        const screenToWorldPos = (screenPos: Vec2) => this.camera.canvasToWorldPos(this.canvas.screenPosToCanvasPos(screenPos));
        this.htmlOverlay._screenToWorldPos = this.mouse._screenToWorldPos = screenToWorldPos;

        if (this.options.mouseInCollisionSystem) {
            const mouse = this.mouse as MouseInputWithCollision;
            this.collisions.addHitbox(mouse.hitbox);
        }

        this.canvas.appendTo(this.options.parentElement);
        this.htmlOverlay.appendTo(this.options.parentElement);

        this.ticker.startNormalTickLoopIfShould();
    }

    /**
     * Start a requestAnimationFrame loop for ticks and draws, and a
     * setInterval for fixedTicks. (If both options are enabled.)
     */
    public start() {
        throw new Error("Not implemented.");
    }

    /**
     * Triggers a tick for components other than the Ticker.
     * 
     * Client could should not use this method.
     */
    public _tickComponents() {
        this.mouse.tick();
        // this.ticker.tickAll(this.world.getElms());
    }

    public dispose() {
        this.ticker._dispose();
        this.keyboard._dispose();
        this.mouse._dispose();
        this.sizer._dispose();
        this.canvas._dispose();
        this.htmlOverlay._dispose();
    }
}

// include elements.ts exports
export { Elm, InputElm, Component };
// include world elements
export { ParentWorldElm, WorldElm, WorldElmWithComponents };
// include world element components
export { SubscriptionsComponent, KeyboardMovementComponent, ParentComponent };
// include collision, geometry
export { Hitbox, Collidable, RectangleM, Rectangle, Vec2M, Vec2 };
// include utils
export { PrerenderCanvas, EventBus };

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
    stick: true,
    relativeToWorld: false
};

/**
 * Default PerformanceOptions
 */
const defaultTickOptions: Required<TickOptions> = {
    fps: 'auto',
    normalTicks: true,
    fixedTick: 1 / 120,
    maxTickDeltaTime: false,
    collisionCheckEveryFixedTick: true,
    visiblityHiddenBehaviour: 'pause',
    longDelayBehaviour: 'skip',
    longDelayLength: 0.5,
    enableDirtySystem: false
};

/**
 * Default CollisionOptions
 */
const defaultCollisionOptions: Required<CollisionOptions> = {
    system: 'quadTree',
    autoCheck: true
};

/**
 * Default renderer options
 */
const defaultRenderOptions: Required<RenderOptions> = {
    culling: "none"
};

/**
 * Default JaPNaAEngine2dOptions
 */
const defaultJaPNaAEngineOptions: Required<JaPNaAEngine2dOptions> = {
    canvas: defaultCanvasOptions,
    htmlOverlay: defaultHTMLOverlayOptions,
    sizing: defaultCanvasSizeOptions,
    ticks: defaultTickOptions,
    collision: defaultCollisionOptions,
    parentElement: document.body,
    render: defaultRenderOptions,
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
     * Performance and timing options related to ticking and frames.
     * 
     * By default, the fps and normal ticks rate is automatic. Fixed ticks run
     * 120 times a second. The engine stops ticking when the game is not
     * visible, and ignores long delays.
     */
    ticks?: TickOptions;

    /**
     * Performanace options related to the collision system.
     * 
     * By default, the engine uses a QuadTree and automatically checks
     * collisions and triggers reactions.
     */
    collision?: CollisionSystemName | CollisionOptions;

    /**
     * Performance options related to rendering one frame.
     */
    render?: RenderOptions;

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
    // !!!!!!!!!!!!! WORK IN PROGRESS !!!!!!!!!!!!!!!!!!!
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

export interface TickOptions {
    /**
     * The target frames per second. 'auto' will match requestAnimationFrame's rate.
     * 
     * The actual frames per second output will never exceed 'auto'.
     * 
     * If you set fps to 'none', you will have to call engine.tickAndDraw()
     * manually.
     * 
     * default: 'auto'
     */
    fps?: number | 'auto' | 'none';

    /**
     * Should use normal ticks? Normal ticks run before every frame.
     * 
     * If you disable this option, the game will only update on fixedTicks.
     * 
     * default: true
     */
    normalTicks?: boolean;

    /**
     * The seconds between each fixedTick.
     * 
     * Physics simulation is usually done in fixedTick. A lower fixedTick
     * results in more accurate physics.
     * 
     * Setting to false disables fixedTicks.
     * 
     * Warning: a fixedTick value too small may result in your game freezing.
     * 
     * default: 1/120
     */
    fixedTick?: number | false;

    /**
     * The maximum seconds allowed between normal ticks.
     * 
     * maxTickDeltaTime is the alternative for fixedTick. Best if you don't
     * care about accurate physics, but don't want things to pass through
     * walls.
     * 
     * Warning: a maxTickDeltaTime too small may result in your game freezing.
     * 
     * default: false
     */
    maxTickDeltaTime?: number | false;

    /**
     * Check collisions every fixed tick?
     * 
     * Turning this off means collisions will only be checked every normal
     * (non-fixed) tick. Can be a great performance improvement.
     * 
     * If disabled, consider using maxTickDeltaTime to ensure things don't
     * pass through walls.
     * 
     * This option only has an effect is `ticks.fixedTick` and
     * `collisions.autoCheck` is true.
     * 
     * default: true
     */
    collisionCheckEveryFixedTick?: boolean;

    /**
     * What to do when the game or tab is hidden?
     * 
     *   - 'pause' means the game will pause.
     *   - 'continue' means the game will continue fixedTick in the background. If maxTickDeltaTime is not false, tick will also run in the background. (Do note that browsers may prevent continued execution.)
     * 
     * default: 'pause'
     */
    visiblityHiddenBehaviour?: 'pause' | 'continue';

    /**
     * What to do when the game doesn't tick for a long time ('long' defined
     * by the longDelayLength option).
     * 
     *   - 'pause' means the game will pause and ignore the long period.
     *     - It is your responsibility to handle the pause and resume the game
     *   - 'continue' means the game will 'catch up' by running all the ticks it needs
     *   - 'skip' means the game will ignore the long period and only perform one tick
     * 
     * default: 'skip'
     */
    longDelayBehaviour?: 'pause' | 'continue' | 'skip';

    /**
     * How many seconds between ticks is a "long delay"?
     * 
     * This determines when longDelayBehaviour is performed.
     * 
     * default: 0.5
     */
    longDelayLength?: number;

    /**
     * Enable the dirty system?
     * 
     * If this is true, fixedTick should be 'false'.
     * 
     * The dirty system prevents ticks and draws from running every frame. Ticks and
     * draws will only run on a frame if the `dirty` flag is set to `true` on that frame.
     * Call `engine.ticker.requestTick` to set the `dirty` flag to `true` for one frame.
     * 
     * default: false
     */
    enableDirtySystem?: boolean;
}

type CollisionSystemName = 'none' | 'simple' | 'sortedX' | 'sortedY' | 'sortedAuto' | 'quadTree';

export interface CollisionOptions {
    /**
     * Selects the system to use for collision detection.
     * 
     *   - 'none' - collisions are not detected
     *   - 'simple' - every object's aabb bounding boxes are checked with every other
     *   - 'sortedX' / 'sortedY' / 'sortedAuto' - sorts every object by x or y axis, then checks collisions with neighbors on x/y axis
     *     - Faster if most of your objects are lined up in a straight line (ex. side-scrolling)
     *   - 'quadTree' - organizes objects in a quadTree and checks collisions with nearby objects
     *     - Hitboxes in the collision system will be converted to QuadTreeHitboxes
     *     - Faster for large maps in both axis.
     * 
     * default: 'quadTree'
     */
    system?: CollisionSystemName;

    /**
     * If true, automatically check for collisions and trigger reactions
     * between all registered HitBoxes in the collision system.
     * 
     * If false, you can still check collisions by calling
     * `engine.collisions.getCollisionsWith`.
     * 
     * Note: Disabling autoChecking for fixed ticks only is specified in
     * `ticks.collisionCheckEveryFixedTick`.
     */
    autoCheck?: boolean;
}

export interface RenderOptions {
    /**
     * How does the renderer determine which elements to `draw`?
     * 
     *   - 'none' - all elements are always drawn during rendering
     *     - May be a performance issue if there are hundreds of elements to
     *       draw each frame
     *   - 'cameraCollisions' - only elements that collide with the camera in
     *     the collision system drawn.
     *     - Useful if all elements have hitboxes, and all elements' graphics
     *       are fully contained in their hitbox
     *   - 'rendererQuadtree' - only elements that have registered hitboxes in
     *     the renderer.
     *     - Useful if you have a lot of elements, and the elements usually
     *       don't move.
     *     - Consider `QuadtreeParentComponent` instead if your game uses
     *       the `ParentComponent`.
     *     - Creates a *new* quadtree only used to determine if elements should
     *       be drawn.
     *     - You must register `Hitbox`es with `engine.renderer.addHitbox` and
     *       update hitboxes when they move with `engine.renderer.updateHitbox`
     *       for the element to be drawn.
     * 
     * default: 'none'
     */
    culling: "none" | "cameraCollisions" | "rendererQuadtree";
}