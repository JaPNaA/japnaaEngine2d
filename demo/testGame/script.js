import { JaPNaAEngine2d } from "../../build/JaPNaAEngine2d.js";

const engine = new JaPNaAEngine2d({
    canvas: {
        sizing: {
            width: 1280, height: 720,
            sizingMethod: "resize",
            sizing: 'fit',
            dpr: 'oneToOne'
        }
    }
});


let x = 50;
let y = 50;

function requanf() {
    let vx = 0, vy = 0;
    if (engine.keyboard.isDown(['ArrowUp', 'KeyW'])) {
        vy--;
    }
    if (engine.keyboard.isDown(['ArrowDown', 'KeyS'])) {
        vy++;
    }
    if (engine.keyboard.isDown(['ArrowLeft', 'KeyA'])) {
        vx--;
    }
    if (engine.keyboard.isDown(['ArrowRight', 'KeyD'])) {
        vx++;
    }
    if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
    x += vx * 2;
    y += vy * 2;

    if (engine.mouse.leftDown) {
        const canvasPos = engine.canvas.screenPosToCanvasPos(engine.mouse.screenPos);
        x = canvasPos.x;
        y = canvasPos.y;
    }

    const X = engine.canvas.X;
    X.fillStyle = "#000";
    X.strokeStyle = "#f00";
    X.lineWidth = 4;
    X.beginPath();
    X.rect(0, 0, engine.canvas.width, engine.canvas.height);
    X.fill();
    X.stroke();

    X.fillStyle = "#fff";
    X.fillRect(x, y, 50, 50);

    requestAnimationFrame(requanf);
}

function resetX() {
    x = 50;
}

function resetY() {
    y = 50;
}

function resetKeybinds() {
    engine.keyboard.getKeydownBus(["Space", "KeyQ"]).unsubscribe(resetX);
    engine.keyboard.getKeydownBus(["Space", "KeyE"]).unsubscribe(resetY);
    engine.keyboard.getKeydownBus(["Escape", "KeyC"]).unsubscribe(resetKeybinds);
}

engine.keyboard.getKeydownBus(["Space", "KeyQ"]).subscribe(resetX);
engine.keyboard.getKeydownBus(["Space", "KeyE"]).subscribe(resetY);
engine.keyboard.getKeydownBus(["Escape", "KeyC"]).subscribe(resetKeybinds);
engine.mouse.mouseup.subscribe(resetX);
engine.mouse.mousemove.subscribe(resetY);

requanf();

console.log(engine);

// todo: test
// MouseInput (with and without collision)
