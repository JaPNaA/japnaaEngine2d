import { Rectangle } from "../geometry/Rectangle.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { QuadTree } from "./QuadTree.js";
import { CollisionReactionMap } from "./CollisionReactionMap.js";
import { Hitbox } from "./Hitbox.js";

const SLEEP_THRESHOLD = 0.0000005;

export class CollisionSystem {
    public reactions = new CollisionReactionMap();
    private quadTree = new QuadTree(1000);
    private sleepingArray = new Array(10);

    private hitboxes: Hitbox<any>[] = [];

    constructor() { }

    public addHitbox(hitbox: Hitbox<any>) {
        this.hitboxes.push(hitbox);
        this.quadTree.add(hitbox);
    }

    public removeHitbox(hitbox: Hitbox<any>) {
        removeElmFromArray(hitbox, this.hitboxes);
        this.quadTree.add(hitbox);
    }

    public getCollisionsWith(rectangle: Rectangle): Hitbox<any>[] {
        return this.quadTree.query(rectangle);
    }

    public __debugRenderQuadTree(X: CanvasRenderingContext2D) {
        this.quadTree.__debugRender(X);
    }

    public _checkCollisions() {
        const numHitboxes = this.hitboxes.length;
        this.sleepingArray.length = numHitboxes;
        const abs = Math.abs;
        for (let i = 0; i < numHitboxes; i++) {
            const hitbox = this.hitboxes[i];
            // sleepingArray[i] = hitbox.rectangle.sameWithinThreshold(hitbox._quadTreeRecord, SLEEP_THRESHOLD);
            // next line is inlined version
            this.sleepingArray[i] = abs(hitbox.rectangle.x - hitbox._quadTreeRecord.x) < SLEEP_THRESHOLD &&
                abs(hitbox.rectangle.y - hitbox._quadTreeRecord.y) < SLEEP_THRESHOLD &&
                abs(hitbox.rectangle.width - hitbox._quadTreeRecord.width) < SLEEP_THRESHOLD &&
                abs(hitbox.rectangle.height - hitbox._quadTreeRecord.height) < SLEEP_THRESHOLD;

            hitbox._collidedWith.length = 0;
            if (!this.sleepingArray[i]) {
                this.quadTree.updateSingle(hitbox);
            }
        }

        for (let i = 0; i < numHitboxes; i++) {
            const hitbox = this.hitboxes[i];
            if (this.sleepingArray[i]) { continue; }
            const collisions = this.quadTree.query(hitbox.rectangle);
            for (const collision of collisions) {
                if (collision !== hitbox && !collision._collidedWith.includes(hitbox)) {
                    this.reactions.triggerReaction(hitbox, collision);
                    hitbox._collidedWith.push(collision);
                }
            }
        }

        this.quadTree.shrinkRootIfCan();
    }
}
