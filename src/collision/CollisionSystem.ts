import { Rectangle } from "../geometry/Rectangle.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { CollisionReactionMap } from "./CollisionReactionMap.js";
import { Hitbox } from "./Hitbox.js";

export class CollisionSystem {
    public reactions = new CollisionReactionMap();

    private hitboxes: Hitbox<any>[] = [];

    public addHitbox(rectangle: Hitbox<any>) {
        this.hitboxes.push(rectangle);
    }

    public removeHitbox(rectangle: Hitbox<any>) {
        removeElmFromArray(rectangle, this.hitboxes);
    }

    public getCollisionsWith(rectangle: Rectangle): Hitbox<any>[] {
        const colliding: Hitbox<any>[] = [];
        for (const hitbox of this.hitboxes) {
            if (Rectangle.isColliding(rectangle, hitbox.rectangle)) {
                colliding.push(hitbox);
            }
        }
        return colliding;
    }

    public _checkCollisions() {
        const numHitboxes = this.hitboxes.length;

        for (let i = 0; i < numHitboxes; i++) {
            const rect1 = this.hitboxes[i].rectangle;

            for (let j = i + 1; j < numHitboxes; j++) {
                const rect2 = this.hitboxes[j].rectangle;

                if (Rectangle.isColliding(rect1, rect2)) {
                    this.reactions.triggerReaction(this.hitboxes[i], this.hitboxes[j]);
                }
            }
        }
    }
}
