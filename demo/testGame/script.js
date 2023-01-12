import { JaPNaAEngine2d } from "../../build/JaPNaAEngine2d.js";

const engine = new JaPNaAEngine2d({
    canvasSize: {
        width: "auto", height: 600,
        sizingMethod: "scale",
        sizing: "fit"
    }
});

function requanf() {
    engine.canvas.X.fillStyle = "#fff";
    engine.canvas.X.fillRect(50, 50, 50, 50);
    requestAnimationFrame(requanf);
}

requanf();

console.log(engine);

// todo: test
// EventBus
// MouseInput (with and without collision)
// KeyboardInput (superbus: especially subscribing and unsubscribing)
