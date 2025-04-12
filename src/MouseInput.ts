import { Collidable, Hitbox } from "./collision/Hitbox.js";
import { RectangleM } from "./geometry/Rectangle.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";
import { EventBus } from "./util/EventBus.js";

export abstract class MouseInput {
    public abstract readonly collisionType: symbol;
    public leftDown = false;
    public rightDown = false;
    public screenPos: Vec2M = new Vec2M(0, 0);
    public worldPos: Vec2M = new Vec2M(0, 0);

    /**
     * Function that transforms from screen to world position. If left unset,
     * does not do anything.
     */
    public _screenToWorldPos: (screenPos: Vec2) => Vec2 = x => x;

    public onMouseup = new EventBus<MouseEvent>();
    public onMousedown = new EventBus<MouseEvent>();
    public onMousemove = new EventBus<MouseEvent>();

    constructor(private readonly isFullscreen: boolean, private parentElement?: HTMLElement) {
        this.mouseupHandler = this.mouseupHandler.bind(this);
        this.mousedownHandler = this.mousedownHandler.bind(this);
        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.contextmenuHandler = this.contextmenuHandler.bind(this);

        addEventListener("mouseup", this.mouseupHandler);
        if (this.isFullscreen) {
            addEventListener("mousedown", this.mousedownHandler);
            addEventListener("mousemove", this.mousemoveHandler);
            addEventListener("contextmenu", this.contextmenuHandler);
        } else if (this.parentElement) {
            this.parentElement.addEventListener("mousedown", this.mousedownHandler);
            this.parentElement.addEventListener("mousemove", this.mousemoveHandler);
            this.parentElement.addEventListener("contextmenu", this.contextmenuHandler);
        } else {
            throw new Error("If not fullscreen, must specify parent element");
        }
    }

    public tick() {
        const worldPos = this._screenToWorldPos(this.screenPos);
        this.worldPos.x = worldPos.x;
        this.worldPos.y = worldPos.y;
    }

    public _dispose() {
        removeEventListener("mouseup", this.mouseupHandler);
        if (this.isFullscreen) {
            removeEventListener("mousedown", this.mousedownHandler);
            removeEventListener("mousemove", this.mousemoveHandler);
            removeEventListener("contextmenu", this.contextmenuHandler);
        } else if (this.parentElement) {
            this.parentElement.removeEventListener("mousedown", this.mousedownHandler);
            this.parentElement.removeEventListener("mousemove", this.mousemoveHandler);
            this.parentElement.removeEventListener("contextmenu", this.contextmenuHandler);
        } else {
            throw new Error("If not fullscreen, must specify parent element");
        }
    }

    protected mouseupHandler(event: MouseEvent) {
        if (event.button === 0) {
            this.leftDown = false;
        } else if (event.button === 2) {
            this.rightDown = false;
        }
        this.onMouseup.send(event);
    }

    protected mousedownHandler(event: MouseEvent) {
        if (event.button === 0) {
            this.leftDown = true;
        } else if (event.button === 2) {
            this.rightDown = true;
        }
        this.onMousedown.send(event);
    }

    protected mousemoveHandler(event: MouseEvent) {
        if (this.isFullscreen) {
            this.screenPos.x = event.clientX;
            this.screenPos.y = event.clientY;
        } else if (this.parentElement) {
            const boundingBox = this.parentElement.getBoundingClientRect();
            this.screenPos.x = event.clientX - boundingBox.x;
            this.screenPos.y = event.clientY - boundingBox.y;
        }

        this.tick();
        this.onMousemove.send(event);
    }

    private contextmenuHandler(event: Event) {
        event.preventDefault();
    }
}

export class MouseInputWithCollision extends MouseInput implements Collidable {
    public readonly collisionType: symbol = Symbol();
    public hitbox: Hitbox<MouseInputWithCollision>;
    public rect: RectangleM = new RectangleM(0, 0, 0, 0);

    constructor(isFullscreen: boolean, parentElement?: HTMLElement) {
        super(isFullscreen, parentElement);
        this.hitbox = new Hitbox(this.rect, this);
    }

    public tick(): void {
        super.tick();
        this.rect.x = this.worldPos.x;
        this.rect.y = this.worldPos.y;
    }
}

export class MouseInputWithoutCollision extends MouseInput {
    public get collisionType(): symbol {
        throw new Error("Set mouseInCollisionSystem to true in JaPNaAEngine2d constructor options to use enable the mouse hitbox");
    }
}
