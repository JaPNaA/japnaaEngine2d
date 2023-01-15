import { JaPNaAEngine2d } from "../JaPNaAEngine2d.js";
import { DirtyArray } from "../util/DirtyArray.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { WorldElm } from "./WorldElm.js";

/**
 * WorldElm with a components that define the behaviour of the element.
 * 
 * Recommended using the alternative WorldElm if initializing many (ten-thousands) of
 * elements.
 * 
 * DO NOT OVERRIDE ANY METHODS other than the constructor in subclasses
 * without calling the super method.
 */
export class WorldElmWithComponents extends WorldElm {
    private components: Partial<WorldElmComponent>[] = [];
    private drawFuncs = new DirtyArray<Partial<WorldElmComponent>>();
    private tickFuncs = new DirtyArray<Partial<WorldElmComponent>>();
    private fixedTickFuncs = new DirtyArray<Partial<WorldElmComponent>>();
    private drawRelativeFuncs = new DirtyArray<Partial<WorldElmComponent>>();
    private setEngineFuncs = new DirtyArray<Partial<WorldElmComponent>>();
    private removeFuncs = new DirtyArray<Partial<WorldElmComponent>>();

    public addComponent<T extends Partial<WorldElmComponent>>(component: T): T {
        this.components.push(component);

        if (component.draw) { this.drawFuncs.push(component); }
        if (component.tick) { this.tickFuncs.push(component); }
        if (component.fixedTick) { this.fixedTickFuncs.push(component); }
        if (component.drawRelative) { this.drawRelativeFuncs.push(component); }
        if (component.remove) { this.removeFuncs.push(component); }

        if (component._setEngine) {
            this.setEngineFuncs.push(component);
            if (this.engine) {
                component._setEngine(this.engine);
            }
        }
        if (component._setParent) {
            component._setParent(this);
        }

        return component;
    }

    public removeComponent<T extends Partial<WorldElmComponent>>(component: T): T {
        removeElmFromArray(component, this.components);

        if (component.draw) { this.drawFuncs.remove(component); }
        if (component.tick) { this.tickFuncs.remove(component); }
        if (component.fixedTick) { this.fixedTickFuncs.remove(component); }
        if (component.drawRelative) { this.drawRelativeFuncs.remove(component); }
        if (component._setEngine) { this.setEngineFuncs.remove(component); }

        if (component.remove) {
            this.removeFuncs.remove(component);
            component.remove();
        }

        return component;
    }

    public draw(): void {
        for (const component of this.drawFuncs) {
            component.draw!();
        }
        super.draw();
    }

    public tick(): void {
        for (const component of this.tickFuncs) {
            component.tick!();
        }
    }

    public fixedTick(): void {
        for (const component of this.fixedTickFuncs) {
            component.fixedTick!();
        }
    }

    protected drawRelative(): void {
        for (const component of this.drawRelativeFuncs) {
            component.drawRelative!();
        }
    }

    public _setEngine(engine: JaPNaAEngine2d): void {
        super._setEngine(engine);
        for (const component of this.setEngineFuncs) {
            component._setEngine!(engine);
        }
    }

    public remove() {
        super.remove();
        for (const component of this.removeFuncs) {
            component.remove!();
        }
    }
}

export abstract class WorldElmComponent {
    protected engine!: JaPNaAEngine2d;
    protected parent!: WorldElmWithComponents;

    public draw?(): void;
    public tick?(): void;
    public fixedTick?(): void;
    public drawRelative?(): void;
    public remove?(): void;

    public _setEngine(engine: JaPNaAEngine2d): void {
        this.engine = engine;
    }
    public _setParent(parent: WorldElmWithComponents): void {
        this.parent = parent;
    }
}
