import { WorldElm } from "../WorldElm.js";
import { removeElmFromArray } from "../../util/removeElmFromArray.js";
import { Hitbox, JaPNaAEngine2d, RectangleM } from "../../JaPNaAEngine2d.js";
import { WorldElmComponent } from "../WorldElmWithComponents.js";
import { QuadTree, QuadTreeHitbox } from "../../collision/QuadTree.js";

/**
 * Replacement for ParentComponent that only renders children that collide
 * with the camera in a quadtree.
 * 
 * Allows nesting of world elements using .addChild.
 */
export class QuadtreeParentComponent extends WorldElmComponent {
    private children: WorldElm[] = [];
    private quadtree = new QuadTree<WorldElm>(1447); // 1447 is an arbitrary initial size

    public draw() {
        const elms = this.quadtree.query(this.engine.camera.rect);

        for (const child of elms) {
            child.elm.draw();
        }
    }

    public tick() {
        for (const child of this.children) {
            child.tick();
        }
    }

    public _setEngine(engine: JaPNaAEngine2d) {
        super._setEngine(engine);
        for (const child of this.children) {
            child._setEngine(engine);
        }
    }

    public remove() {
        for (const child of this.children) {
            child.remove();
        }
    }

    public addChild(child: QuadtreeElmChild) {
        this.children.push(child);

        const cast = child.graphicHitbox as QuadTreeHitbox<QuadtreeElmChild>;
        cast._collidedWith = [];
        cast._quadTreeRecord = new RectangleM(0, 0, 0, 0);
        this.quadtree.add(cast);

        child.setGraphicHitboxUpdateCallback(() => {
            this.quadtree.updateSingle(cast);
        });

        if (this.engine) {
            child._setEngine(this.engine);
        }
    }

    public removeChild(child: QuadtreeElmChild) {
        removeElmFromArray(child, this.children);
        this.quadtree.remove(child.graphicHitbox as QuadTreeHitbox<QuadtreeElmChild>);
        child.remove();
    }

    public removeAllChildren() {
        for (const child of this.children) {
            child.remove();
        }
        this.children.length = 0;
    }
}

export interface QuadtreeElmChild extends WorldElm {
    /**
     * Called when the child is added to the QuadtreeParentComponent.
     * The callback is to be called whenever the child changes position.
     */
    setGraphicHitboxUpdateCallback(callback: () => void): void;

    /**
     * A hitbox that contains everything the WorldElm will draw.
     * DO NOT REASSIGN.
     */
    graphicHitbox: Hitbox<QuadtreeElmChild>;
}
