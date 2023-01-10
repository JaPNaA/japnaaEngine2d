import { Rectangle } from "../util/Rectangle";

export interface Collidable {
    collisionType: Symbol;
    onCollision?: (other: Collidable) => void;
}

export class Hitbox<T extends Collidable> {
    constructor(public rectangle: Rectangle, public elm: T) {
    }
}
