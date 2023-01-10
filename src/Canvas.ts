export class Canvas {
    private canvas = document.createElement("canvas");
    public X = this.canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;

    public width = 0;
    public height = 0;
    public actualWidth = 0;
    public actualHeight = 0;
    public dprScaling = 0;

    constructor() {
        if (!this.X) { alert("Browser not supported"); throw new Error("Browser not supported: cannot get canvas context"); }
        this.resizeHandler = this.resizeHandler.bind(this);
    }

    public resizeToScreen() {
        const dpr = window.devicePixelRatio || 1;

        this.width = innerWidth;
        this.height = innerHeight;
        
        this.canvas.width = this.actualWidth = dpr * this.width;
        this.canvas.height = this.actualHeight = dpr * this.height;

        this.X.scale(dpr, dpr);
    }

    public resize(width: number, height: number) {
        this.width = this.canvas.width = width;
        this.height = this.canvas.height = height;
    }

    public _startAutoResize() {
        addEventListener("resize", this.resizeHandler);
    }

    public _stopAutoResize() {
        removeEventListener("resize", this.resizeHandler);
    }

    public appendTo(parent: HTMLElement) {
        parent.appendChild(this.canvas);
    }

    private resizeHandler() {
        this.resizeToScreen();
    }
}

class Canvas2 {
    private canvas: HTMLCanvasElement;

    constructor(o: { width: number, height: number }) {
        this.canvas = document.createElement("canvas");
        this.canvas.classList.add("JaPNaA");
        this.canvas.width = o.width;
        this.canvas.height = o.height;

        addEventListener("resize", this.resizeHandler.bind(this));
        this.resizeHandler();
    }

    public appendTo(parent: HTMLElement) {
        parent.appendChild(this.canvas);
    }

    private resizeHandler() {
        if (this.canvas.width >= innerWidth || this.canvas.height >= innerHeight) {
            const screenRatio = innerWidth / innerHeight;
            const canvasRatio = this.canvas.width / this.canvas.height;
            if (screenRatio < canvasRatio) {
                this.canvas.classList.add("width-bound");
                this.canvas.classList.remove("height-bound");
            } else {
                this.canvas.classList.remove("width-bound");
                this.canvas.classList.add("height-bound");
            }
        } else {
            this.canvas.classList.remove("width-bound", "height-bound");
        }
    }
    resize() {
        if (this.resizing || !this.started && this.lastSize.has) return;
        var dpr = window.devicePixelRatio || 1,
            w = window.innerWidth,
            h = window.innerHeight;

        if (w == this.lastSize.w && h == this.lastSize.h && this.lastSize.has) {
            this.resizing = true;
            this.resizeLoop();
            return;
        }

        if (h * this.ratio < w) {
            this.canvas.classList.remove("h");
            document.body.classList.remove("h");

            this.canvas.width = h * this.ratio * dpr;
            this.canvas.height = h * dpr;

            this.offsetX = (w - this.canvas.width / dpr) / 2;
            this.canvas.style.left = this.offsetX + "px";

            this.offsetY = 0;
            this.canvas.style.top = 0;
        } else {
            this.canvas.classList.add("h");
            document.body.classList.add("h");

            this.canvas.width = w * dpr;
            this.canvas.height = w / this.ratio * dpr;

            this.offsetX = 0;
            this.canvas.style.left = 0;

            this.offsetY = (h - this.canvas.height / dpr) / 2;
            this.canvas.style.top = this.offsetY + "px";
        }

        this.lastSize.w = window.innerWidth;
        this.lastSize.h = window.innerHeight;
        this.lastSize.has = true;

        this.X.resetTransform();
        this.scaleX = this.canvas.width / this.width;
        this.scaleY = this.canvas.height / this.height;
        this.X.scale(this.scaleX, this.scaleY);
    }
    resizeLoop() { // because ios is bad
        if (window.innerWidth == this.lastSize.w && window.innerHeight == this.lastSize.h) {
            requestAnimationFrame(() => this.resizeLoop());
        } else {
            this.resizing = false;
            this.resize();
        }
    }
}