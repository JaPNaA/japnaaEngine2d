import { WorldElm } from "./canvasElm/WorldElm.js";
import { JaPNaAEngine2d } from "./JaPNaAEngine2d.js";

export class World {
    public timeElapsed = 0;

    private elms: WorldElm[] = [];

    constructor(private engine: JaPNaAEngine2d) { }

    public addElm(elm: WorldElm, index?: number) {
        elm._setEngine(this.engine);

        //* temporary -- introduce zIndex
        if (index !== undefined) {
            this.elms.splice(index, 0, elm);
        } else {
            this.elms.push(elm);
        }
    }

    public getElms(): ReadonlyArray<WorldElm> {
        return this.elms;
    }

    public removeMarkedElms() {
        for (let i = this.elms.length - 1; i >= 0; i--) {
            const obj = this.elms[i];

            if (obj.toBeRemoved) {
                this.elms.splice(i, 1);
            }
        }
    }
}


// class Engine<T extends IEntity> {
//     public canvas: Canvas;
//     public camera: Camera;

//     public debugRenderQuadTree: boolean;
//     public debugDrawHitCircles: boolean;

//     private paused: boolean;

//     private renderer: Renderer;
//     private ticker: Ticker<T>;
//     private collider: CircleCollider<T>;
//     private bounder: Bounder;
//     private remover: Remover<T>;
//     private sleeper: Sleeper;
//     private entities: T[];
//     private renderHooks: Function[];

//     constructor(entities: T[]) {
//         this.debugDrawHitCircles = false;
//         this.debugRenderQuadTree = false;

//         this.paused = false;

//         this.canvas = new Canvas();
//         this.camera = new Camera(this.canvas);
//         this.renderer = new Renderer(this.canvas, this.camera);
//         this.collider = new CircleCollider();
//         this.ticker = new Ticker();
//         this.remover = new Remover(this.collider);
//         this.bounder = new Bounder();
//         this.sleeper = new Sleeper();
//         this.entities = entities;

//         this.renderHooks = [];
//         mouse.attachCamera(this.camera);
//     }

//     public pause() {
//         this.paused = true;
//     }

//     public resume() {
//         if (!this.paused) { return; }
//         this.paused = false;
//         this.ticker.resume();
//     }

//     public render() {
//         if (this.paused) {
//             this.camera.updateLocation();

//             this.renderer.debugDrawHitCircle = this.debugDrawHitCircles
//             this.renderer.renderEntitiesInTree(this.collider.quadTree);

//             if (this.debugRenderQuadTree) {
//                 this.renderer.debugRenderQuadtree(this.collider.quadTree);
//             }
//         } else {
//             this.ticker.tickAll(this.entities);
//             this.collider.collideAll(this.entities);
//             this.bounder.boundAll(this.entities);
//             this.remover.removeAllIfDestoryed(this.entities);

//             this.camera.updateLocation();

//             this.renderer.debugDrawHitCircle = this.debugDrawHitCircles
//             this.renderer.renderEntitiesInTree(this.collider.quadTree);

//             if (this.debugRenderQuadTree) {
//                 this.renderer.debugRenderQuadtree(this.collider.quadTree);
//             }

//             this.sleeper.sleepAll(this.entities);

//             for (const hook of this.renderHooks) {
//                 hook();
//             }
//         }
//     }

//     public attachCameraTo(entity?: T): void {
//         this.camera.attachTo(entity);
//     }

//     public setBoundaries(boundaries: Vec2): void {
//         this.bounder.setBoundaries(boundaries);
//         this.collider.setBoundaries(boundaries);
//     }

//     public newEntity(entity: T): void {
//         this.collider.newEntity(entity);
//     }

//     public appendTo(parent: HTMLElement): void {
//         this.canvas.appendTo(parent);
//     }

//     public getQuadTree(): CircleQuadTree<T> {
//         return this.collider.getQuadTree();
//     }

// }
