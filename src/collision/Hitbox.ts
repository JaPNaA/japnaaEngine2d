import { RectangleM } from "../geometry/Rectangle.js";

export interface Collidable {
    collisionType: symbol;
    onCollision?: (other: Collidable) => void;
}

export class Hitbox<T> {
    constructor(public rectangle: RectangleM, public elm: T) { }
}
