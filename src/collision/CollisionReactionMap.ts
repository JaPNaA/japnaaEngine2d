import { Collidable, Hitbox } from "./Hitbox.js";

type ReactionFunction = (a: Hitbox<any>, b: Hitbox<any>) => void

export class CollisionReactionMap {
    private map: Map<symbol, Map<symbol, ReactionFunction>> = new Map();

    public setCollisionReaction(a: symbol, b: symbol, reaction: ReactionFunction) {
        this.setEntry(a, b, reaction);
        this.setEntry(b, a, (a, b) => reaction(b, a));
    }

    public triggerReaction(a: Hitbox<Collidable>, b: Hitbox<Collidable>) {
        if (a.elm.onCollision) {
            a.elm.onCollision(b.elm);
        }
        if (b.elm.onCollision) {
            b.elm.onCollision(a.elm);
        }

        const entry = this.map.get(a.elm.collisionType);
        if (!entry) { return; }
        const reactionFunc = entry.get(b.elm.collisionType);
        if (!reactionFunc) { return; }
        reactionFunc(a, b);
    }

    private setEntry(a: symbol, b: symbol, reaction: ReactionFunction) {
        const existingEntry = this.map.get(a);
        if (existingEntry) {
            existingEntry.set(b, reaction);
        } else {
            const newEntry = new Map();
            newEntry.set(b, reaction);
            this.map.set(a, newEntry);
        }
    }
}
