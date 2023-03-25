import { WorldElm } from "./canvasElm/WorldElm.js";
import { CanvasSizer } from "./CanvasSizer.js";
import { RectangleM } from "./geometry/Rectangle.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";

export class Camera {
    public rect = new RectangleM(0, 0, 1, 1);
    public scale: number;

    private tScale: number;

    private pos = new Vec2M(0, 0);
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
            const dx = -(x - this.pos.x) * (factor - 1);
            const dy = -(y - this.pos.y) * (factor - 1);
            this.pos.x += dx;
            this.pos.y += dy;
        }

        this.tScale *= factor;
    }

    public applyTransform(X: CanvasRenderingContext2D): void {
        X.translate(this.rect.width / 2, this.rect.height / 2);
        X.scale(this.scale, this.scale);
        X.translate(-this.pos.x, -this.pos.y);
    }

    public applyTranslateOnly(X: CanvasRenderingContext2D): void {
        X.translate(-this.rect.x, -this.rect.y);
    }

    public canvasToWorldPos(canvasPos: Vec2): Vec2 {
        return new Vec2M(
            (canvasPos.x - this.rect.width / 2) / this.scale + this.pos.x,
            (canvasPos.y - this.rect.height / 2) / this.scale + this.pos.y
        );
    }


    public attachTo(entity?: WorldElm): void {
        this.attachee = entity;
    }

    public tick() {
        if (this.attachee) {
            this.pos.x = this.attachee.rect.centerX();
            this.pos.y = this.attachee.rect.centerY();
        }

        this.rect.x = this.pos.x - this.rect.width / 2;
        this.rect.y = this.pos.y - this.rect.height / 2;
    }

    private resizeHandler() {
        this.rect.width = this.sizer.width;
        this.rect.height = this.sizer.height;
    }
}
