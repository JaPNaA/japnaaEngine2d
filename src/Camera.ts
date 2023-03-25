import { WorldElm } from "./canvasElm/WorldElm.js";
import { CanvasSizer } from "./CanvasSizer.js";
import { RectangleM } from "./geometry/Rectangle.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";

export class Camera {
    public rect = new RectangleM(0, 0, 1, 1);
    public scale: number;

    private tScale: number;

    private attachee?: WorldElm;

    constructor(private sizer: CanvasSizer) {
        this.tScale = this.scale = 1;
        this.sizer.onResize.subscribe(() => {
            this.resizeHandler();
        });
        this.resizeHandler();
        this.tick();
    }

    public goto(x: number, y: number, scale?: number): void {
        if (scale) {
            this.tScale = scale;
        }
        this.rect.x = x;
        this.rect.y = y;
    }

    public gotoNoTransition(x: number, y: number, scale?: number): void {
        this.goto(x, y, scale);
        this.scale = this.tScale;
    }

    public move(dx: number, dy: number): void {
        this.rect.x += dx;
        this.rect.y += dy;
    }

    public zoomInto(factor: number, x: number, y: number): void {
        if (!this.attachee) {
            const dx = -(x - this.rect.x) * (factor - 1);
            const dy = -(y - this.rect.y) * (factor - 1);
            this.rect.x += dx;
            this.rect.y += dy;
        }

        this.tScale *= factor;
    }

    public applyTransform(X: CanvasRenderingContext2D): void {
        X.translate(this.rect.width / 2, this.rect.height / 2);
        X.scale(this.scale, this.scale);
        X.translate(-this.rect.centerX(), -this.rect.centerY());
    }

    public applyTranslateOnly(X: CanvasRenderingContext2D): void {
        X.translate(-this.rect.x, -this.rect.y);
    }

    public canvasToWorldPos(canvasPos: Vec2): Vec2 {
        return new Vec2M(
            (canvasPos.x - this.rect.width / 2) / this.scale + this.rect.centerX(),
            (canvasPos.y - this.rect.height / 2) / this.scale + this.rect.centerY()
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

    private resizeHandler() {
        this.rect.width = this.sizer.width;
        this.rect.height = this.sizer.height;
    }
}
