import { CanvasElm } from "./CanvasElm.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { World } from "../World.js";
import { CanvasElmWithEventBus } from "./CanvasElmWithEventBus.js";

export class ParentCanvasElm extends CanvasElmWithEventBus {
    private children: CanvasElm[] = [];

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

    public setWorld(world: World) {
        super.setWorld(world);
        for (const child of this.children) {
            child.setWorld(world);
        }
    }

    public dispose() {
        super.dispose();
        for (const child of this.children) {
            child.dispose();
        }
    }

    protected addChild(child: CanvasElm) {
        this.children.push(child);
        if (this.world) {
            child.setWorld(this.world);
        }

        if (child instanceof CanvasElmWithEventBus) {
            child.eventBus._attach(this.eventBus);
        }
    }

    protected removeChild(child: CanvasElm) {
        removeElmFromArray(child, this.children);
        child.dispose();
    }
}
