import { RectangleM } from "../geometry/Rectangle.js";

export interface Collidable {
    collisionType: symbol;
    onCollision?: (other: Collidable) => void;
}

export class Hitbox<T extends Collidable> {
    constructor(public rectangle: RectangleM, public elm: T) {
    }
}
