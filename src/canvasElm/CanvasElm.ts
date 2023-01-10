import { World } from "../World";

export abstract class CanvasElm {
    protected world!: World;

    public abstract draw(): void;
    public tick(): void { }

    public setWorld(world: World) {
        this.world = world;
    }

    public dispose() {
        // @ts-expect-error
        this.world = undefined;
    }
}
