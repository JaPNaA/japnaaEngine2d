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
        if (this.options.collision === "none") {
            this.collisions = new NoCollisionSystem();
        } else if (this.options.collision === "quadTree") {
            this.collisions = new CollisionSystemQuadTree();
        } else if (this.options.collision === "simple") {
            this.collisions = new CollisionSystemSimple();
        } else {
            const collisionSystemSorted = new CollisionSystemSorted();
            this.collisions = collisionSystemSorted;
            if (this.options.collision === "sortedX") {
                collisionSystemSorted.axisFixed = true;
                collisionSystemSorted.useYAxis = false;
            } else if (this.options.collision === "sortedY") {
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

        const screenToWorldPos = (screenPos: Vec2) => this.camera.canvasToWorldPos(this.canvas.screenPosToCanvasPos(screenPos));
        this.htmlOverlay._screenToWorldPos = this.mouse._screenToWorldPos = screenToWorldPos;

        if (this.options.mouseInCollisionSystem) {
            const mouse = this.mouse as MouseInputWithCollision;
            this.collisions.addHitbox(mouse.hitbox);
        }

        if (this.options.parentElement === document.body) {
            this.canvas.appendTo(this.options.parentElement);
            this.htmlOverlay.appendTo(this.options.parentElement);
            const style = document.createElement("style");
            style.innerHTML = "body { overflow: hidden; margin: 0; } canvas, .HTMLOverlay { position: absolute; }";
            document.head.appendChild(style);
        } else {
            throw new Error("Not implemented");
        }

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

    // todo: make private
    public draw() {
        const X = this.canvas.X;
        this.camera.tick();
        this.htmlOverlay.tick();

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
export { ParentWorldElm, WorldElm, WorldElmWithComponents };
// include world element components
export { SubscriptionsComponent, KeyboardMovementComponent, ParentComponent };
// include collision, geometry
export { Hitbox, Collidable, RectangleM, Rectangle, Vec2M, Vec2 };
// include other stuff
export { PrerenderCanvas };

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
    longDelayLength: 0.5
};

/**
 * Default JaPNaAEngine2dOptions
 */
const defaultJaPNaAEngineOptions: Required<JaPNaAEngine2dOptions> = {
    canvas: defaultCanvasOptions,
    htmlOverlay: defaultHTMLOverlayOptions,
    sizing: defaultCanvasSizeOptions,
    ticks: defaultTickOptions,
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
     * Performance options related to ticking and frames.
     * 
     * By default, the fps and normal ticks rate is automatic. Fixed ticks run
     * 120 times a second. The engine stops ticking when the game is not
     * visible, and ignores long delays.
     */
    ticks?: TickOptions;

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
     * This option only has an effect is fixedTick is not false.
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
}
