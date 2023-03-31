import { JaPNaAEngine2d, WorldElm } from "../../../build/JaPNaAEngine2d.js";

const GAME_TITLE = "Dokidoki Tokimeki Kirakira Raburabu Game";
const WIDTH = 1280;
const HEIGHT = 720;

document.title = GAME_TITLE;

const image = new Image();
image.src = "tekitou-chan.png";

class TitleScreen extends WorldElm {
    constructor() {
        super();
        this.rect.width = WIDTH;
        this.rect.height = HEIGHT;
    }

    drawRelative() {
        const X = this.engine.canvas.X;
        const gradient = X.createLinearGradient(0, 0, 0, HEIGHT);
        gradient.addColorStop(0, "#ff8888");
        gradient.addColorStop(1, "#ffffff");
        X.fillStyle = gradient;
        X.fillRect(0, 0, this.rect.width, this.rect.height);

        X.drawImage(image, 0, 0, this.rect.width, this.rect.height);

        const textX = 20;
        const textY = HEIGHT / 2;
        X.fillStyle = "#ffffff";
        X.strokeStyle = "#000000";
        X.textBaseline = "middle";
        X.font = "40px Arial";
        X.lineWidth = 4;
        X.strokeText(GAME_TITLE, textX, textY);
        X.fillText(GAME_TITLE, textX, textY);
    }
}

const engine = new JaPNaAEngine2d({
    sizing: { width: WIDTH, height: HEIGHT }
});

engine.world.addElm(new TitleScreen());
image.addEventListener("load", () => {
    engine.draw();
});
