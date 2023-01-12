import { EventBus } from "./util/EventBus.js";

export abstract class MouseInput {
    public abstract readonly collisionType: Symbol;
    public leftDown = false;
    public rightDown = false;
    public x = 0;
    public y = 0;

    public mouseup = new EventBus<MouseEvent>();
    public mousedown = new EventBus<MouseEvent>();
    public mousemove = new EventBus<MouseEvent>();

    constructor() {
        this.mouseupHandler = this.mouseupHandler.bind(this);
        this.mousedownHandler = this.mousedownHandler.bind(this);
        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.contextmenuHandler = this.contextmenuHandler.bind(this);
    }

    public _startListen() {
        addEventListener("mouseup", this.mouseupHandler);
        addEventListener("mousedown", this.mousedownHandler);
        addEventListener("mousemove", this.mousemoveHandler);
        addEventListener("contextmenu", this.contextmenuHandler);
    }

    public _stopListen() {
        removeEventListener("mouseup", this.mouseupHandler);
        removeEventListener("mousedown", this.mousedownHandler);
        removeEventListener("mousemove", this.mousemoveHandler);
        removeEventListener("contextmenu", this.contextmenuHandler);
    }

    private mouseupHandler(event: MouseEvent) {
        if (event.button === 0) {
            this.leftDown = false;
        } else if (event.button === 2) {
            this.rightDown = false;
        }
        this.mouseup.send(event);
    }

    private mousedownHandler(event: MouseEvent) {
        if (event.button === 0) {
            this.leftDown = true;
        } else {
            this.rightDown = true;
        }
        this.mousedown.send(event);
    }

    private mousemoveHandler(event: MouseEvent) {
        this.x = event.clientX;
        this.y = event.clientY;
        this.mousemove.send(event);
    }

    private contextmenuHandler(event: Event) {
        event.preventDefault();
    }
}

export class MouseInputWithCollision extends MouseInput {
    public readonly collisionType: Symbol = Symbol();
}

export class MouseInputWithoutCollision extends MouseInput {
    public get collisionType(): Symbol {
        throw new Error("Set mouseInCollisionSystem to true in JaPNaAEngine2d constructor options to use enable the mouse hitbox");
    }
}
