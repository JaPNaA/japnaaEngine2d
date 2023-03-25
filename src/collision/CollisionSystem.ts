import { Rectangle, RectangleM } from "../geometry/Rectangle.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { QuadTree } from "./CircleQuadTree.js";
import { CollisionReactionMap } from "./CollisionReactionMap.js";
import { Hitbox } from "./Hitbox.js";

const SLEEP_THRESHOLD = 0.0000005;

export class CollisionSystem {
    public reactions = new CollisionReactionMap();
    private quadTree = new QuadTree(10000);

    private hitboxes: Hitbox<any>[] = [];

    public addHitbox(hitbox: Hitbox<any>) {
        this.hitboxes.push(hitbox);
        this.quadTree.add(hitbox);
    }

    public removeHitbox(hitbox: Hitbox<any>) {
        removeElmFromArray(hitbox, this.hitboxes);
        this.quadTree.add(hitbox);
    }

    public getCollisionsWith(rectangle: Rectangle): Hitbox<any>[] {
        const colliding: Hitbox<any>[] = [];
        for (const hitbox of this.hitboxes) {
            if (RectangleM.isColliding(rectangle, hitbox.rectangle)) {
                colliding.push(hitbox);
            }
        }
        return colliding;
    }

    public __debugRenderQuadTree(X: CanvasRenderingContext2D) {
        this.quadTree.__debugRender(X);
    }

    public _checkCollisions() {
        const numHitboxes = this.hitboxes.length;
        const sleepingArray = new Array(numHitboxes);
        for (let i = 0; i < numHitboxes; i++) {
            const hitbox = this.hitboxes[i];
            sleepingArray[i] = hitbox.rectangle.sameWithinThreshold(hitbox._quadTreeRecord, SLEEP_THRESHOLD);
            hitbox._collidedWith.length = 0;
            if (!sleepingArray[i]) {
                this.quadTree.updateSingle(hitbox);
            }
        }

        for (let i = 0; i < numHitboxes; i++) {
            const hitbox = this.hitboxes[i];
            if (sleepingArray[i]) { continue; }
            const collisions = this.quadTree.query(hitbox.rectangle);
            for (const collision of collisions) {
                if (collision !== hitbox && !collision._collidedWith.includes(hitbox)) {
                    this.reactions.triggerReaction(hitbox, collision);
                    hitbox._collidedWith.push(collision);
                }
            }
        }
    }
}
