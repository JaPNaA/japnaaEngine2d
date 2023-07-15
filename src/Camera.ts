import { WorldElm } from "./canvasElm/WorldElm.js";
import { CanvasSizer } from "./CanvasSizer.js";
import { RectangleM } from "./geometry/Rectangle.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";

export class Camera {
    public rect = new RectangleM(0, 0, 1, 1);
    private scale: number;

    private attachee?: WorldElm;

    constructor(private sizer: CanvasSizer) {
        this.scale = 1;
        this.tick();
        this.sizer.onResize.subscribe(() => {
            this.updateSize();
        });
        this.updateSize();
    }

    public goto(pos: Vec2, scale?: number): void {
        if (scale) {
            this.scale = scale;
        }
        this.rect.x = pos.x;
        this.rect.y = pos.y;
    }

    public move(dx: number, dy: number): void {
        this.rect.x += dx;
        this.rect.y += dy;
    }

    public getScale() {
        return this.scale;
    }

    public setScale(scale: number): void {
        this.scale = scale;
        this.updateSize();
    }

    public zoomInto(factor: number, pos: Vec2): void {
        if (!this.attachee) {
            const dx = (pos.x - this.rect.x) * (1 - 1 / factor)
            const dy = (pos.y - this.rect.y) * (1 - 1 / factor)
            this.rect.x += dx;
            this.rect.y += dy;
        }

        this.scale *= factor;

        this.updateSize();
    }

    public applyTransform(X: CanvasRenderingContext2D): void {
        X.scale(this.scale, this.scale);
        X.translate(-this.rect.x, -this.rect.y);
    }

    public applyTranslateOnly(X: CanvasRenderingContext2D): void {
        X.translate(-this.rect.x, -this.rect.y);
    }

    public canvasToWorldPos(canvasPos: Vec2): Vec2 {
        return new Vec2M(
            canvasPos.x / this.scale + this.rect.x,
            canvasPos.y / this.scale + this.rect.y
        );
    }


    public attachTo(entity?: WorldElm): void {
        this.attachee = entity;
    }

    public tick() {
        if (this.attachee) {
            this.rect.x = this.attachee.rect.centerX() - this.rect.width / 2;
            this.rect.y = this.attachee.rect.centerY() - this.rect.height / 2;
        }
    }

    private updateSize() {
        this.rect.width = this.sizer.width / this.scale;
        this.rect.height = this.sizer.height / this.scale;
    }
}
