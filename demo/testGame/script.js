import { Elm, JaPNaAEngine2d, WorldElmWithSubscriptions } from "../../build/JaPNaAEngine2d.js";

const engine = new JaPNaAEngine2d({
    sizing: {
        width: 1280, height: 720,
        sizingMethod: "scale",
        sizing: 'fit',
        dpr: 'oneToOne'
    }
});

class Square extends WorldElmWithSubscriptions {
    constructor() {
        super();

        this.rect.x = 50;
        this.rect.y = 50;
        this.rect.width = 50;
        this.rect.height = 50;

        this.subscribe(engine.keyboard.getKeydownBus(["Space", "KeyQ"]), this.resetX);
        this.subscribe(engine.keyboard.getKeydownBus(["Space", "KeyE"]), this.resetY);
        this.subscribe(engine.keyboard.getKeydownBus(["Escape", "KeyC"]), this.remove);
    }

    resetX() {
        this.rect.x = 50;
    }

    resetY() {
        this.rect.y = 50;
    }

    tick() {
        let vx = 0, vy = 0;
        if (this.engine.keyboard.isDown(['ArrowUp', 'KeyW'])) {
            vy--;
        }
        if (this.engine.keyboard.isDown(['ArrowDown', 'KeyS'])) {
            vy++;
        }
        if (this.engine.keyboard.isDown(['ArrowLeft', 'KeyA'])) {
            vx--;
        }
        if (this.engine.keyboard.isDown(['ArrowRight', 'KeyD'])) {
            vx++;
        }
        if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
        this.rect.x += vx * 800 * this.engine.ticker.timeElapsed;
        this.rect.y += vy * 800 * this.engine.ticker.timeElapsed;
    }

    drawRelative() {
        const X = this.engine.canvas.X;

        X.fillStyle = "#fff";
        X.fillRect(0, 0, 50, 50);
    }
}

class DraggableSquare extends Square {
    constructor() {
        super();
        this.hold = false;
        this.subscribe(engine.mouse.onMousedown, this.onMousedown);
        this.subscribe(engine.mouse.onMousemove, this.onMousemove);
        this.subscribe(engine.mouse.onMouseup, () => this.hold = false);
    }

    onMousedown() {
        const canvasPos = this.engine.canvas.screenPosToCanvasPos(this.engine.mouse.screenPos);
        if (this.rect.containsVec2(canvasPos)) {
            this.hold = true;
        }
    }

    onMousemove() {
        if (!this.hold) { return; }
        const canvasPos = this.engine.canvas.screenPosToCanvasPos(this.engine.mouse.screenPos);
        this.rect.x = canvasPos.x;
        this.rect.y = canvasPos.y;
    }
}

function requanf() {
    engine.tick();

    engine.draw();

    const X = engine.canvas.X;
    X.strokeStyle = "#f00";
    X.lineWidth = 4;
    X.beginPath();
    X.rect(0, 0, engine.canvas.width, engine.canvas.height);
    X.stroke();

    requestAnimationFrame(requanf);
}


engine.htmlOverlay.elm.append(
    new Elm().append("Text sticking on the canvas!")
        .attribute("style", "position: relative; color: red; top: 50px; left: 50px;")
);

const square1 = new DraggableSquare();
engine.world.addElm(square1);

const square2 = new DraggableSquare();
square2.rect.x += 50;
square2.rect.y += 50;
engine.world.addElm(square2);

const square3 = new Square();
square3.rect.x += 100;
square3.rect.y += 100;
engine.camera.attachTo(square3);
engine.world.addElm(square3);

requanf();

console.log(engine);

// todo: test
// MouseInput (with and without collision)
// Camera
// CollisionSystem
// Ticker
