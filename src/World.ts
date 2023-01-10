import { Camera } from "./Camera";
import { Canvas } from "./Canvas";
import { CanvasElm } from "./canvasElm/CanvasElm";
import { CanvasElmWithEventBus } from "./canvasElm/CanvasElmWithEventBus";
import { CollisionSystem } from "./collision/CollisionSystem";
import { EventBus } from "./util/EventBus";
import { HTMLOverlay } from "./HTMLOverlay";
import { KeyboardInput } from "./KeyboardInput";
import { MouseInput } from "./MouseInput";

export class World {
    public canvas = new Canvas();
    public htmlOverlay = new HTMLOverlay();
    public camera = new Camera(this);

    public eventBus = new EventBus();
    public keyboard = new KeyboardInput();
    public mouse = new MouseInput(this.eventBus);

    public collisionSystem = new CollisionSystem();

    public timeElapsed = 0;

    private elms: CanvasElm[] = [];

    private lastTime = performance.now();
    private maxTickTimeElapse = 0.020;

    constructor() {
        this.canvas.resizeToScreen();
    }

    public startListen() {
        this.keyboard._startListen();
        this.mouse._startListen();
        this.canvas._startAutoResize();
    }

    public stopListen() {
        this.keyboard._stopListen();
        this.mouse._stopListen();
        this.canvas._stopAutoResize();
    }

    public addElm(elm: CanvasElm, index?: number) {
        elm.setWorld(this);
        if (elm instanceof CanvasElmWithEventBus) {
            elm.eventBus._attach(this.eventBus);
        }

        //* temporary -- introduce zIndex
        if (index !== undefined) {
            this.elms.splice(index, 0, elm);
        } else {
            this.elms.push(elm);
        }
    }

    public removeElm(elm: CanvasElm) {
        elm.dispose();

        const index = this.elms.indexOf(elm);
        if (index < 0) { throw new Error("Tried removing element that wasn't added"); }
        this.elms.splice(index, 1);
    }

    public removeMarkedElms() {
        for (let i = 0; i < this.elms.length; i++) {
            const obj = this.elms[i];

            if (obj.toBeRemoved) {
                this.elms.splice(i, 1);
            }
        }
    }

    public draw() {
        const X = this.canvas.X;

        const now = performance.now();
        let timeElapsed = (now - this.lastTime) / 1000;
        this.lastTime = now;

        for (; timeElapsed > this.maxTickTimeElapse; timeElapsed -= this.maxTickTimeElapse) {
            this.timeElapsed = this.maxTickTimeElapse;
            this.tick();
        }

        this.timeElapsed = timeElapsed;
        this.tick();

        this.camera._update();

        X.fillStyle = "#000000";
        X.fillRect(0, 0, this.canvas.width, this.canvas.height);

        X.save();

        this.camera._applyTransform(X);

        for (const elm of this.elms) {
            elm.draw();
        }

        X.restore();
    }

    private tick() {
        for (const elm of this.elms) {
            elm.tick();
        }

        this.collisionSystem._checkCollisions();
    }

    public appendTo(parent: HTMLElement) {
        this.canvas.appendTo(parent);
        this.htmlOverlay.appendTo(parent);
    }
}


class Engine<T extends IEntity> {
    public canvas: Canvas;
    public camera: Camera;

    public debugRenderQuadTree: boolean;
    public debugDrawHitCircles: boolean;

    private paused: boolean;

    private renderer: Renderer;
    private ticker: Ticker<T>;
    private collider: CircleCollider<T>;
    private bounder: Bounder;
    private remover: Remover<T>;
    private sleeper: Sleeper;
    private entities: T[];
    private renderHooks: Function[];

    constructor(entities: T[]) {
        this.debugDrawHitCircles = false;
        this.debugRenderQuadTree = false;

        this.paused = false;

        this.canvas = new Canvas();
        this.camera = new Camera(this.canvas);
        this.renderer = new Renderer(this.canvas, this.camera);
        this.collider = new CircleCollider();
        this.ticker = new Ticker();
        this.remover = new Remover(this.collider);
        this.bounder = new Bounder();
        this.sleeper = new Sleeper();
        this.entities = entities;

        this.renderHooks = [];
        mouse.attachCamera(this.camera);
    }

    public pause() {
        this.paused = true;
    }

    public resume() {
        if (!this.paused) { return; }
        this.paused = false;
        this.ticker.resume();
    }

    public render() {
        if (this.paused) {
            this.camera.updateLocation();

            this.renderer.debugDrawHitCircle = this.debugDrawHitCircles
            this.renderer.renderEntitiesInTree(this.collider.quadTree);

            if (this.debugRenderQuadTree) {
                this.renderer.debugRenderQuadtree(this.collider.quadTree);
            }
        } else {
            this.ticker.tickAll(this.entities);
            this.collider.collideAll(this.entities);
            this.bounder.boundAll(this.entities);
            this.remover.removeAllIfDestoryed(this.entities);

            this.camera.updateLocation();

            this.renderer.debugDrawHitCircle = this.debugDrawHitCircles
            this.renderer.renderEntitiesInTree(this.collider.quadTree);

            if (this.debugRenderQuadTree) {
                this.renderer.debugRenderQuadtree(this.collider.quadTree);
            }

            this.sleeper.sleepAll(this.entities);

            for (const hook of this.renderHooks) {
                hook();
            }
        }
    }

    public attachCameraTo(entity?: T): void {
        this.camera.attachTo(entity);
    }

    public setBoundaries(boundaries: Vec2): void {
        this.bounder.setBoundaries(boundaries);
        this.collider.setBoundaries(boundaries);
    }

    public newEntity(entity: T): void {
        this.collider.newEntity(entity);
    }

    public appendTo(parent: HTMLElement): void {
        this.canvas.appendTo(parent);
    }

    public getQuadTree(): CircleQuadTree<T> {
        return this.collider.getQuadTree();
    }

}

class Ticker<T extends IEntity> {
    public static fixedTime: number = 1000 / 120;

    private leftOverFixed: number;
    private then: number;

    constructor() {
        this.then = performance.now();
        this.leftOverFixed = 0;
    }

    public resume(): void {
        this.then = performance.now();
    }

    public tickAll(entities: T[]): void {
        const now = performance.now();
        const deltaTime = now - this.then;
        this.then = now;

        for (const entity of entities) {
            entity.tick(deltaTime);
        }

        for (this.leftOverFixed += deltaTime; this.leftOverFixed >= Ticker.fixedTime; this.leftOverFixed -= Ticker.fixedTime) {
            for (const entity of entities) {
                if (entity._sleeping) { continue; }
                entity.fixedTick();
            }
        }
    }
}
