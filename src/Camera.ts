import { Rectangle } from "./Rectangle";

class Camera {
    public rect = new Rectangle(0, 0, 1, 1);
    public scale: number;
    
    private tScale: number;

    private cursorLocked: boolean;

    private attachee?: any;
    private canvas: Canvas;

    constructor(canvas: Canvas) {
        this.tScale = this.scale = 1;
        this.canvas = canvas;

        this.cursorLocked = false;
    }

    public goto(x: number, y: number, scale?: number): void {
        if (scale) {
            this.tScale = scale;
        }
        this.x = -x * this.tScale + this.canvas.width / 2;
        this.y = -y * this.tScale + this.canvas.height / 2;
    }

    private move(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    public apply(X: CanvasRenderingContext2D): void {
        X.translate(this.x, this.y);
        X.scale(this.scale, this.scale);
    }

    public applyTranslateOnly(X: CanvasRenderingContext2D): void {
        X.translate(this.x, this.y);
    }

    public gotoNoTransition(x: number, y: number, scale?: number): void {
        if (scale) {
            this.scale = this.tScale = scale;
        }
        this.x = -x * this.tScale + this.canvas.width / 2;
        this.y = -y * this.tScale + this.canvas.height / 2;
    }

    public attachTo(entity?: IEntity): void {
        this.attachee = entity;
    }


    public _update() {
        this.rect.width = this.canvas.width;
        this.rect.height = this.canvas.height;

        if (!this.following) { return; }
        this.rect.x = this.following.x + this.following.width / 2 - this.rect.width / 2 / this.scale;
        this.rect.y = this.following.y + this.following.height / 2 - this.rect.height / 2 / this.scale;
    }

    public updateLocation(): void {
        this.updateTarget();
    }

    private zoomInto(factor: number, x_: number, y_: number): void {
        if (this.attachee) {
            this.goto(this.attachee!.x, this.attachee!.y);
        } else {
            let x = x_;
            let y = y_;

            if (this.cursorLocked) {
                x = innerWidth / 2;
                y = innerHeight / 2;
            }

            const dx = -(x - this.tx) * (factor - 1);
            const dy = -(y - this.ty) * (factor - 1);
            this.tx += dx;
            this.ty += dy;
        }

        this.tScale *= factor;
    }
}

export default Camera;