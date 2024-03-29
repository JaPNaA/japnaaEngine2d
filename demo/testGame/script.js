import { Hitbox } from "../../build/collision/Hitbox.js";
import { Elm, JaPNaAEngine2d, KeyboardMovementComponent, SubscriptionsComponent, WorldElmWithComponents } from "../../build/JaPNaAEngine2d.js";

const engine = new JaPNaAEngine2d({
    sizing: {
        width: 1280, height: 720,
        sizingMethod: "scale",
        sizing: 'fit',
        dpr: 'oneToOne'
    },
    collision: "quadTree",
    mouseInCollisionSystem: true,
    htmlOverlay: {
        relativeToWorld: true
    },
    ticks: {
        collisionCheckEveryFixedTick: false,
        fixedTick: false,
        fps: 'auto',
        maxTickDeltaTime: false,
        normalTicks: true,
        longDelayLength: 1
    },
    render: {
        culling: 'cameraCollisions'
    }
});

class Square extends WorldElmWithComponents {
    constructor() {
        super();

        this.collisionType = Square.collisionType;
        this.color = "#fff";

        this.rect.x = 50;
        this.rect.y = 50;
        this.rect.width = 50;
        this.rect.height = 50;
    }

    _setEngine(engine) {
        super._setEngine(engine);
        this.engine.collisions.addHitbox(this.hitbox = new Hitbox(this.rect, this));
    }

    resetX() {
        this.rect.x = 50;
    }

    resetY() {
        this.rect.y = 50;
    }


    drawRelative() {
        const X = this.engine.canvas.X;

        X.fillStyle = this.color;
        X.fillRect(0, 0, 50, 50);
    }

    /**
     * @param {import("../../build/collision/Hitbox.js").Collidable} other
     */
    onCollision(other) {
        // if (other.collisionType === engine.mouse.collisionType) {
        //     this.color = "#0f0";
        // }
    }

    remove() {
        // @ts-ignore
        this.engine.collisions.removeHitbox(this.hitbox);
        super.remove();
    }
}

Square.collisionType = Symbol();

class KeyboardMovingSquare extends Square {
    constructor() {
        super();
        this.subscriptions = this.addComponent(new SubscriptionsComponent());

        this.subscriptions.subscribe(engine.keyboard.getKeydownBus(["Space", "KeyQ"]), this.resetX);
        this.subscriptions.subscribe(engine.keyboard.getKeydownBus(["Space", "KeyE"]), this.resetY);
        this.subscriptions.subscribe(engine.keyboard.getKeydownBus(["Escape", "KeyC"]), this.remove);

        this.keyboardMovement = this.addComponent(new KeyboardMovementComponent());
    }
}

class DraggableSquare extends Square {
    constructor() {
        super();
        this.hold = false;
        this.subscriptions = this.addComponent(new SubscriptionsComponent());
        this.subscriptions.subscribe(engine.mouse.onMousedown, this.onMousedown);
        this.subscriptions.subscribe(engine.mouse.onMouseup, () => this.hold = false);
    }

    onMousedown() {
        if (this.rect.containsVec2(this.engine.mouse.worldPos)) {
            this.hold = true;
        }
    }

    tick() {
        super.tick();
        // this.rect.x++;
        if (!this.hold) { return; }
        this.rect.x = this.engine.mouse.worldPos.x;
        this.rect.y = this.engine.mouse.worldPos.y;
    }
}

engine.collisionReactions.setCollisionReaction(Square.collisionType, engine.mouse.collisionType, (square, mouse) => {
    square.elm.color = "#00f";
});

// function requanf() {
//     engine.tick();

//     engine.draw();

//     engine.camera.scale += (targetScale - engine.camera.scale) / 10;

//     const X = engine.canvas.X;
//     X.strokeStyle = "#f00";
//     X.lineWidth = 4;
//     X.beginPath();
//     X.rect(0, 0, engine.canvas.width, engine.canvas.height);
//     X.stroke();

//     requestAnimationFrame(requanf);
// }

let zoomedIn = false;
let targetScale = 1;

// setInterval(() => {
//     if (zoomedIn) {
//         engine.camera.setScale(1);
//         zoomedIn = false;
//     } else {
//         engine.camera.setScale(1.2);
//         zoomedIn = true;
//     }
// }, 750);


engine.htmlOverlay.elm.append(
    new Elm().append("Text sticking on the canvas!")
        .attribute("style", "position: relative; color: red; top: 50px; left: 50px;")
);

const squares = [];

for (let i = 0; i < 1000; i++) {
    const square = new DraggableSquare();
    squares.push(square);
    square.rect.x = Math.random() * 10000;
    square.rect.y = Math.random() * 1000;
    engine.world.addElm(square);
}

const square3 = new KeyboardMovingSquare();
square3.rect.x += 100;
square3.rect.y += 100;
engine.camera.attachTo(square3);
engine.world.addElm(square3);

// requanf();

console.log(engine);

// todo: test
// Ticker
// Renderer
// options:
//  collision
//  tick
//  touchInputAsMouseInput
//  parentElement
