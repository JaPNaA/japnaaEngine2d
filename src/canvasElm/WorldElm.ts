import { RectangleM } from "../geometry/Rectangle.js";
import { JaPNaAEngine2d } from "../JaPNaAEngine2d.js";

export abstract class WorldElm {
    protected engine!: JaPNaAEngine2d;
    public rect = new RectangleM(0, 0, 0, 0);
    public toBeRemoved = false;
    public sleeping = false;

    /**
     * Draw the element. The default WorldElm implementation calls drawRelative
     * after transforming the canvas.
     */
    public draw(): void {
        const X = this.engine.canvas.X;
        X.translate(this.rect.x, this.rect.y);
        this.drawRelative();
        X.translate(-this.rect.x, -this.rect.y);
    }
    /** Update the element */
    public tick(): void { }
    /** Update the element, where each update is a fixed amount of time apart */
    public fixedTick(): void { }

    /** Draw the element transformed. (Called by WorldElm#draw) */
    protected drawRelative(): void { };

    public _setEngine(engine: JaPNaAEngine2d) {
        this.engine = engine;
    }

    public remove() {
        this.toBeRemoved = true;
        // @ts-expect-error
        this.engine = undefined;
    }
}
