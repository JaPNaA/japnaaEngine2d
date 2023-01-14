import { RectangleM } from "../geometry/Rectangle.js";

export interface Collidable {
    collisionType: Symbol;
    onCollision?: (other: Collidable) => void;
}

export class Hitbox<T extends Collidable> {
    constructor(public rectangle: RectangleM, public elm: T) {
    }
}
