import { Collidable, Hitbox } from "./collision/Hitbox.js";
import { RectangleM } from "./geometry/Rectangle.js";
import { Vec2, Vec2M } from "./geometry/Vec2.js";
import { EventBus } from "./util/EventBus.js";

export abstract class MouseInput {
    public abstract readonly collisionType: symbol;
    public leftDown = false;
    public rightDown = false;
    public screenPos: Vec2M = new Vec2M(0, 0);

    public onMouseup = new EventBus<MouseEvent>();
    public onMousedown = new EventBus<MouseEvent>();
    public onMousemove = new EventBus<MouseEvent>();

    constructor() {
        this.mouseupHandler = this.mouseupHandler.bind(this);
        this.mousedownHandler = this.mousedownHandler.bind(this);
        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.contextmenuHandler = this.contextmenuHandler.bind(this);

        addEventListener("mouseup", this.mouseupHandler);
        addEventListener("mousedown", this.mousedownHandler);
        addEventListener("mousemove", this.mousemoveHandler);
        addEventListener("contextmenu", this.contextmenuHandler);
    }

    public _dispose() {
        removeEventListener("mouseup", this.mouseupHandler);
        removeEventListener("mousedown", this.mousedownHandler);
        removeEventListener("mousemove", this.mousemoveHandler);
        removeEventListener("contextmenu", this.contextmenuHandler);
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
        } else {
            this.rightDown = true;
        }
        this.onMousedown.send(event);
    }

    protected mousemoveHandler(event: MouseEvent) {
        this.screenPos.x = event.clientX;
        this.screenPos.y = event.clientY;
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
    /**
     * Function that transforms from screen to world position. If left unset,
     * does not do anything.
     */
    public transformToWorldPos: (screenPos: Vec2) => Vec2 = x => x;

    constructor() {
        super();
        this.hitbox = new Hitbox(this.rect, this);
    }

    protected mousemoveHandler(event: MouseEvent): void {
        super.mousemoveHandler(event);
        const worldPos = this.transformToWorldPos(this.screenPos);
        this.rect.x = worldPos.x;
        this.rect.y = worldPos.y;
    }
}

export class MouseInputWithoutCollision extends MouseInput {
    public get collisionType(): symbol {
        throw new Error("Set mouseInCollisionSystem to true in JaPNaAEngine2d constructor options to use enable the mouse hitbox");
    }
}
