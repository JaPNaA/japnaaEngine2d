import { JaPNaAEngine2d, RectangleM, RenderOptions } from "./JaPNaAEngine2d.js";
import { WorldElm } from "./canvasElm/WorldElm.js";
import { Hitbox } from "./collision/Hitbox.js";
import { QuadTree, QuadTreeHitbox } from "./collision/QuadTree.js";
import { removeElmFromArray } from "./util/removeElmFromArray.js";

export class Renderer {
    public render: () => void;
    public addHitbox: (hitbox: Hitbox<WorldElm>) => void;
    public updateHitbox: (hitbox: Hitbox<WorldElm>) => void;
    public removeHitbox: (hitbox: Hitbox<WorldElm>) => void;

    /** quadTree is only defined when options.culling == 'rendererQuadtree' */
    private quadTree!: QuadTree<WorldElm>;
    /** hitboxes is only defined when options.culling == 'rendererQuadtree' */
    private hitboxes!: Hitbox<WorldElm>[];

    constructor(private engine: JaPNaAEngine2d, options: Required<RenderOptions>) {
        if (options.culling === 'rendererQuadtree') {
            this.quadTree = new QuadTree(1447); // initial start at 1447 (arbitrary)
            this.render = this._renderInQuadtree;
            this.addHitbox = this._addHitbox;
            this.updateHitbox = this._updateHitbox;
            this.removeHitbox = this._removeHitbox;
        } else if (options.culling === "cameraCollisions") {
            this.render = this._renderElementsCollidingWithCamera;
            this.addHitbox = () => { console.warn("Trying to add hitbox when culling does not use renderer-registered hitboxes."); };
            this.updateHitbox = () => { };
            this.removeHitbox = () => { };
        } else { // options.culling === 'none'
            this.render = this._renderAll;
            this.addHitbox = () => { console.warn("Trying to add hitbox when culling is disabled and does not use hitboxes."); };
            this.updateHitbox = () => { };
            this.removeHitbox = () => { };
        }
    }

    private _addHitbox(hitbox: Hitbox<WorldElm>) {
        const cast = hitbox as QuadTreeHitbox<WorldElm>;
        cast._collidedWith = [];
        cast._quadTreeRecord = new RectangleM(0, 0, 0, 0);
        this.hitboxes.push(cast);
        this.quadTree.add(cast);
    }

    private _updateHitbox(hitbox: Hitbox<WorldElm>) {
        this.quadTree.updateSingle(hitbox as QuadTreeHitbox<WorldElm>);
    }

    private _removeHitbox(hitbox: Hitbox<WorldElm>) {
        this.quadTree.remove(hitbox as QuadTreeHitbox<WorldElm>);
        removeElmFromArray(hitbox, this.hitboxes);
    }

    private _renderInQuadtree() {
        const X = this.engine.canvas.X;
        this.engine.camera.tick();
        this.engine.htmlOverlay.tick();

        const collisions = this.quadTree.query(this.engine.camera.rect);

        X.clearRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

        X.save();

        this.engine.camera.applyTransform(X);

        for (const collision of collisions) {
            collision.elm.draw();
        }

        X.restore();
    }

    private _renderAll() {
        const X = this.engine.canvas.X;
        this.engine.camera.tick();
        this.engine.htmlOverlay.tick();

        X.clearRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

        X.save();

        this.engine.camera.applyTransform(X);

        for (const elm of this.engine.world.getElms()) {
            elm.draw();
        }

        X.restore();
    }

    private _renderElementsCollidingWithCamera() {
        const X = this.engine.canvas.X;
        this.engine.camera.tick();
        this.engine.htmlOverlay.tick();

        const collisions = this.engine.collisions.getCollisionsWith(this.engine.camera.rect);

        X.clearRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

        X.save();

        this.engine.camera.applyTransform(X);

        for (const collision of collisions) {
            if (collision.elm instanceof WorldElm) {
                collision.elm.draw();
            }
        }

        X.restore();
    }
}
