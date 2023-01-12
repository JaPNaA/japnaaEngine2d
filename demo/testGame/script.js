import { JaPNaAEngine2d } from "../../build/JaPNaAEngine2d.js";

const engine = new JaPNaAEngine2d({
    canvasSize: {
        width: "auto", height: 600,
        sizingMethod: "scale",
        sizing: "fit"
    }
});


let x = 50;
let y = 50;

function requanf() {
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

    if (engine.keyboard.isDown(['ArrowUp', 'KeyW'])) {
        y--;
    }
    if (engine.keyboard.isDown(['ArrowDown', 'KeyS'])) {
        y++;
    }
    if (engine.keyboard.isDown(['ArrowLeft', 'KeyA'])) {
        x--;
    }
    if (engine.keyboard.isDown(['ArrowRight', 'KeyD'])) {
        x++;
    }

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

requanf();

console.log(engine);

// todo: test
// EventBus
// MouseInput (with and without collision)
