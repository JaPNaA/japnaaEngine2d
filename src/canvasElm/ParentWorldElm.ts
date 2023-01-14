import { WorldElm } from "./WorldElm.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { JaPNaAEngine2d } from "../JaPNaAEngine2d.js";

export class ParentWorldElm extends WorldElm {
    private children: WorldElm[] = [];

    public draw() {
        for (const child of this.children) {
            child.draw();
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
        super.remove();
        for (const child of this.children) {
            child.remove();
        }
    }

    protected addChild(child: WorldElm) {
        this.children.push(child);
        if (this.engine) {
            child._setEngine(this.engine);
        }
    }

    protected removeChild(child: WorldElm) {
        removeElmFromArray(child, this.children);
        child.remove();
    }
}
