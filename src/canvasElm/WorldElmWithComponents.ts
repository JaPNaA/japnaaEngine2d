import { JaPNaAEngine2d } from "../JaPNaAEngine2d.js";
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

    // each of these are DirtyArrays, but optimized through inlining.
    private drawFuncs: (Partial<WorldElmComponent> | undefined)[] = [];
    private drawFuncsDirty: boolean = false;

    private tickFuncs: (Partial<WorldElmComponent> | undefined)[] = [];
    private tickFuncsDirty: boolean = false;

    private fixedTickFuncs: (Partial<WorldElmComponent> | undefined)[] = [];
    private fixedTickFuncsDirty: boolean = false;

    private drawRelativeFuncs: (Partial<WorldElmComponent> | undefined)[] = [];
    private drawRelativeFuncsDirty: boolean = false;

    private setEngineFuncs: (Partial<WorldElmComponent> | undefined)[] = [];
    private setEngineFuncsDirty: boolean = false;

    private removeFuncs: (Partial<WorldElmComponent> | undefined)[] = [];
    private removeFuncsDirty: boolean = false;

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

        if (component.draw) {
            this.replaceWithUndefined(this.drawFuncs, component);
            this.drawFuncsDirty = true;
        }
        if (component.tick) {
            this.replaceWithUndefined(this.tickFuncs, component);
            this.tickFuncsDirty = true;
        }
        if (component.fixedTick) {
            this.replaceWithUndefined(this.fixedTickFuncs, component);
            this.fixedTickFuncsDirty = true;
        }
        if (component.drawRelative) {
            this.replaceWithUndefined(this.drawRelativeFuncs, component);
            this.drawRelativeFuncsDirty = true;
        }
        if (component._setEngine) {
            this.replaceWithUndefined(this.setEngineFuncs, component);
            this.setEngineFuncsDirty = true;
        }

        if (component.remove) {
            this.replaceWithUndefined(this.removeFuncs, component);
            this.removeFuncsDirty = true;
            component.remove();
        }

        return component;
    }

    private replaceWithUndefined<T>(array: (T | undefined)[], item: T) {
        const index = array.indexOf(item);
        if (index < 0) { throw new Error("Tried to remove element not in array"); }
        array[index] = undefined;
    }

    private cleanArray<T>(array: (T | undefined)[]) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i] === undefined) {
                array.splice(i, 1);
            }
        }
    }

    public draw(): void {
        for (const component of this.drawFuncs) {
            component?.draw!();
        }
        super.draw();
        if (this.drawFuncsDirty) {
            this.cleanArray(this.drawFuncs);
            this.drawFuncsDirty = false;
        }
    }

    public tick(): void {
        for (const component of this.tickFuncs) {
            component?.tick!();
        }
        if (this.tickFuncsDirty) {
            this.cleanArray(this.tickFuncs);
            this.tickFuncsDirty = false;
        }
    }

    public fixedTick(): void {
        for (const component of this.fixedTickFuncs) {
            component?.fixedTick!();
        }
        if (this.fixedTickFuncsDirty) {
            this.cleanArray(this.fixedTickFuncs);
            this.fixedTickFuncsDirty = false;
        }
    }

    protected drawRelative(): void {
        for (const component of this.drawRelativeFuncs) {
            component?.drawRelative!();
        }
        if (this.drawRelativeFuncsDirty) {
            this.cleanArray(this.drawRelativeFuncs);
            this.drawRelativeFuncsDirty = false;
        }
    }

    public _setEngine(engine: JaPNaAEngine2d): void {
        super._setEngine(engine);
        for (const component of this.setEngineFuncs) {
            component?._setEngine!(engine);
        }
        if (this.setEngineFuncsDirty) {
            this.cleanArray(this.setEngineFuncs);
            this.setEngineFuncsDirty = false;
        }
    }

    public remove() {
        super.remove();
        for (const component of this.removeFuncs) {
            component?.remove!();
        }
        if (this.removeFuncsDirty) {
            this.cleanArray(this.removeFuncs);
            this.removeFuncsDirty = false;
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
