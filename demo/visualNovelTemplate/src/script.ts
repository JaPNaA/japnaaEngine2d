import { JaPNaAEngine2d, SubscriptionsComponent, WorldElm, WorldElmWithComponents } from "../../../build/JaPNaAEngine2d.js";

const GAME_TITLE = "Dokidoki Tokimeki Kirakira Raburabu Game";
const WIDTH = 1280;
const HEIGHT = 720;

document.title = GAME_TITLE;

const image = new Image();
image.src = "tekitou-chan.png";

class TitleScreen extends WorldElmWithComponents {
    private subscriptions: SubscriptionsComponent = this.addComponent(new SubscriptionsComponent());
    
    constructor() {
        super();
        this.rect.width = WIDTH;
        this.rect.height = HEIGHT;
    }

    _setEngine(engine: JaPNaAEngine2d) {
        super._setEngine(engine);

        this.subscriptions.subscribe(this.engine.mouse.onMousedown, this.continueHandler);
        this.subscriptions.subscribe(this.engine.keyboard.getKeydownBus("Space"), this.continueHandler);
    }

    continueHandler() {
        this.engine.world.addElm(new VisualNovelPlayer());
        this.remove();
    }

    drawRelative() {
        super.drawRelative();

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

        const clickToContinueText = "Click or press space to start";
        X.font = "16px Arial";
        X.strokeText(clickToContinueText, textX, textY + 32);
        X.fillText(clickToContinueText, textX, textY + 32);
    }
}

class VisualNovelPlayer extends WorldElmWithComponents {
    drawRelative() {
        const X = this.engine.canvas.X;
        X.fillStyle = "#f00";
        X.fillRect(0, 0, 100, 100);
    }
}

const engine = new JaPNaAEngine2d({
    sizing: { width: WIDTH, height: HEIGHT }
});

engine.world.addElm(new TitleScreen());
// image.addEventListener("load", () => {
//     engine.draw();
// });
