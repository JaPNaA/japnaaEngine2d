import { JaPNaAEngine2d, RenderOptions } from "./JaPNaAEngine2d.js";
import { WorldElm } from "./canvasElm/WorldElm.js";
import { Hitbox } from "./collision/Hitbox.js";


export class Renderer {
    public render: () => void;
    // todo: Hitbox<WorldElm>
    public addHitbox: (hitbox: Hitbox<any>) => void;

    constructor(private engine: JaPNaAEngine2d, options: Required<RenderOptions>) {
        if (options.culling === 'rendererQuadtree') {
            throw new Error("Not implemented");
            // this.render = this._renderInQuadtree;
            // this.addHitbox = this._addHitbox;
        } else if (options.culling === "cameraCollisions") {
            this.render = this._renderElementsCollidingWithCamera;
            this.addHitbox = () => { };
        } else { // options.culling === 'none'
            this.render = this._renderAll;
            this.addHitbox = () => { };
        }
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
