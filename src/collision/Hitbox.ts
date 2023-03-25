import { RectangleM } from "../geometry/Rectangle.js";

export interface Collidable {
    collisionType: symbol;
    onCollision?: (other: Collidable) => void;
}

export class Hitbox<T extends Collidable> {
    public _quadTreeRecord: RectangleM;
    public _collidedWith: Hitbox<Collidable>[] = [];

    constructor(public rectangle: RectangleM, public elm: T) {
        this._quadTreeRecord = new RectangleM(0, 0, 0, 0);
    }
}
