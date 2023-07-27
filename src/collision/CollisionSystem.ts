import { Rectangle, RectangleM } from "../geometry/Rectangle.js";
import { removeElmFromArray } from "../util/removeElmFromArray.js";
import { QuadTree } from "./QuadTree.js";
import { CollisionReactionMap } from "./CollisionReactionMap.js";
import { Collidable, Hitbox } from "./Hitbox.js";
import { CollisionOptions } from "../JaPNaAEngine2d.js";

const SLEEP_THRESHOLD = 0.0000005;

export interface CollisionSystem {
    autoCheck: boolean;
    addHitbox(hitbox: Hitbox<any>): void;
    removeHitbox(hitbox: Hitbox<any>): void;
    getCollisionsWith(rectangle: Rectangle): Hitbox<any>[];
    _setReactions(reactions: CollisionReactionMap): void;
    _checkCollisions(): void;
}

export interface QuadTreeHitbox<T extends Collidable> {
    rectangle: RectangleM;
    elm: T;
    _quadTreeRecord: RectangleM;
    _collidedWith: Hitbox<Collidable>[];
}

/**
 * Collision system with hitboxes organized in a quadtree.
 */
export class CollisionSystemQuadTree implements CollisionSystem {
    public autoCheck: boolean;

    private reactions!: CollisionReactionMap;
    private quadTree = new QuadTree(1447); // initial start at 1447 (arbitrary); todo: make modifyable through settings
    private sleepingArray = new Array(10);

    private hitboxes: QuadTreeHitbox<any>[] = [];

    constructor(options: Required<CollisionOptions>) {
        this.autoCheck = options.autoCheck;
    }

    public addHitbox(hitbox: QuadTreeHitbox<any>) {
        hitbox._collidedWith = [];
        hitbox._quadTreeRecord = new RectangleM(0, 0, 0, 0);
        this.hitboxes.push(hitbox);
        this.quadTree.add(hitbox);
    }

    public removeHitbox(hitbox: QuadTreeHitbox<any>) {
        removeElmFromArray(hitbox, this.hitboxes);
        this.quadTree.remove(hitbox);
    }

    public getCollisionsWith(rectangle: Rectangle): Hitbox<any>[] {
        return this.quadTree.query(rectangle);
    }

    public __debugRenderQuadTree(X: CanvasRenderingContext2D) {
        this.quadTree.__debugRender(X);
    }

    public _setReactions(reactions: CollisionReactionMap): void {
        this.reactions = reactions;
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

            if (hitbox._collidedWith.length) {
                hitbox._collidedWith.length = 0;
            }
            if (!this.sleepingArray[i]) {
                this.quadTree.updateSingle(hitbox);
            }
        }

        if (this.autoCheck) {
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
        }

        this.quadTree.shrinkRootIfCan();
    }
}

/**
 * Collision system with collisions detected by checking every
 * bounding box with another.
 */
export class CollisionSystemSimple implements CollisionSystem {
    public autoCheck: boolean;
    private reactions!: CollisionReactionMap;

    private hitboxes: Hitbox<any>[] = [];

    constructor(options: Required<CollisionOptions>) {
        this.autoCheck = options.autoCheck;
    }

    public addHitbox(rectangle: Hitbox<any>) {
        this.hitboxes.push(rectangle);
    }

    public removeHitbox(rectangle: Hitbox<any>) {
        removeElmFromArray(rectangle, this.hitboxes);
    }

    public getCollisionsWith(rectangle: Rectangle): Hitbox<any>[] {
        const colliding: Hitbox<any>[] = [];
        for (const hitbox of this.hitboxes) {
            const hitboxRect = hitbox.rectangle;
            // if (RectangleM.isColliding(rectangle, hitbox.rectangle)) {
            // inlined
            if (rectangle.x < hitboxRect.x + hitboxRect.width &&
                rectangle.x + rectangle.width > hitboxRect.x &&
                rectangle.y < hitboxRect.y + hitboxRect.height &&
                rectangle.y + rectangle.height > hitboxRect.y) {
                colliding.push(hitbox);
            }
        }
        return colliding;
    }

    public _setReactions(reactions: CollisionReactionMap) { this.reactions = reactions; }

    public _checkCollisions() {
        if (!this.autoCheck) { return; }
        const numHitboxes = this.hitboxes.length;

        for (let i = 0; i < numHitboxes; i++) {
            const rect1 = this.hitboxes[i].rectangle;

            for (let j = i + 1; j < numHitboxes; j++) {
                const rect2 = this.hitboxes[j].rectangle;

                // if (RectangleM.isColliding(rect1, rect2)) {
                // inlined
                if (rect1.x < rect2.x + rect2.width &&
                    rect1.x + rect1.width > rect2.x &&
                    rect1.y < rect2.y + rect2.height &&
                    rect1.y + rect1.height > rect2.y) {
                    this.reactions.triggerReaction(this.hitboxes[i], this.hitboxes[j]);
                }
            }
        }
    }
}


/**
 * Collision system with collisions detected by sorting hitboxes
 * on an axis, then comparing nodes nearby.
 */
export class CollisionSystemSorted implements CollisionSystem {
    public autoCheck: boolean;
    public useYAxis = false;
    public axisFixed = false;
    private reactions!: CollisionReactionMap;

    private hitboxes: Hitbox<any>[] = [];

    constructor(options: Required<CollisionOptions>) {
        this.autoCheck = options.autoCheck;
    }

    public addHitbox(rectangle: Hitbox<any>) {
        this.hitboxes.push(rectangle);
    }

    public removeHitbox(rectangle: Hitbox<any>) {
        removeElmFromArray(rectangle, this.hitboxes);
    }

    public getCollisionsWith(rectangle: Rectangle): Hitbox<any>[] {
        const colliding: Hitbox<any>[] = [];
        for (const hitbox of this.hitboxes) {
            const hitboxRect = hitbox.rectangle;
            // if (RectangleM.isColliding(rectangle, hitbox.rectangle)) {
            // inlined
            if (rectangle.x < hitboxRect.x + hitboxRect.width &&
                rectangle.x + rectangle.width > hitboxRect.x &&
                rectangle.y < hitboxRect.y + hitboxRect.height &&
                rectangle.y + rectangle.height > hitboxRect.y) {
                colliding.push(hitbox);
            }
        }
        return colliding;
    }

    public _setReactions(reactions: CollisionReactionMap) { this.reactions = reactions; }

    public _checkCollisions() {
        if (!this.autoCheck) { return; }
        const numHitboxes = this.hitboxes.length;
        // note about the repeated code:
        //   it's for the speed

        if (this.useYAxis) {
            if (this.axisFixed) {
                this.hitboxes.sort((a, b) => a.rectangle.y - b.rectangle.y);

                for (let i = 0; i < numHitboxes; i++) {
                    const rect1 = this.hitboxes[i].rectangle;

                    for (let j = i + 1; j < numHitboxes; j++) {
                        const rect2 = this.hitboxes[j].rectangle;

                        if (rect1.y + rect1.height > rect2.y) {
                            if (rect1.x < rect2.x + rect2.width &&
                                rect1.x + rect1.width > rect2.x) {
                                this.reactions.triggerReaction(this.hitboxes[i], this.hitboxes[j]);
                            }
                        } else {
                            break;
                        }
                    }
                }
            } else {
                // if axis not fixed, try to determine best axis
                this.hitboxes.sort((a, b) => a.rectangle.y - b.rectangle.y);
                const yRange = this.hitboxes[numHitboxes - 1].rectangle.y - this.hitboxes[0].rectangle.y;
                let minX = Infinity;
                let maxX = -Infinity;

                for (let i = 0; i < numHitboxes; i++) {
                    const rect1 = this.hitboxes[i].rectangle;
                    if (rect1.x < minX) { minX = rect1.x; }
                    if (rect1.x > maxX) { maxX = rect1.x; }

                    for (let j = i + 1; j < numHitboxes; j++) {
                        const rect2 = this.hitboxes[j].rectangle;

                        if (rect1.y + rect1.height > rect2.y) {
                            if (rect1.x < rect2.x + rect2.width &&
                                rect1.x + rect1.width > rect2.x) {
                                this.reactions.triggerReaction(this.hitboxes[i], this.hitboxes[j]);
                            }
                        } else {
                            break;
                        }
                    }
                }

                const xRange = maxX - minX;
                if (xRange > yRange) { this.useYAxis = false; }
            }
        } else {
            if (this.axisFixed) {
                this.hitboxes.sort((a, b) => a.rectangle.x - b.rectangle.x);

                for (let i = 0; i < numHitboxes; i++) {
                    const rect1 = this.hitboxes[i].rectangle;

                    for (let j = i + 1; j < numHitboxes; j++) {
                        const rect2 = this.hitboxes[j].rectangle;

                        if (rect1.x + rect1.width > rect2.x) {
                            if (rect1.y < rect2.y + rect2.height &&
                                rect1.y + rect1.height > rect2.y) {
                                this.reactions.triggerReaction(this.hitboxes[i], this.hitboxes[j]);
                            }
                        } else {
                            break;
                        }
                    }
                }
            } else {
                // if axis not fixed, try to determine best axis
                this.hitboxes.sort((a, b) => a.rectangle.x - b.rectangle.x);
                const xRange = this.hitboxes[numHitboxes - 1].rectangle.x - this.hitboxes[0].rectangle.x;
                let minY = Infinity;
                let maxY = -Infinity;

                for (let i = 0; i < numHitboxes; i++) {
                    const rect1 = this.hitboxes[i].rectangle;

                    if (rect1.y < minY) { minY = rect1.y; }
                    if (rect1.y > maxY) { maxY = rect1.y; }

                    for (let j = i + 1; j < numHitboxes; j++) {
                        const rect2 = this.hitboxes[j].rectangle;

                        if (rect1.x + rect1.width > rect2.x) {
                            if (rect1.y < rect2.y + rect2.height &&
                                rect1.y + rect1.height > rect2.y) {
                                this.reactions.triggerReaction(this.hitboxes[i], this.hitboxes[j]);
                            }
                        } else {
                            break;
                        }
                    }
                }

                const yRange = maxY - minY;
                if (xRange < yRange) { this.useYAxis = true; }
            }
        }
    }
}

/**
 * A collision system that does nothing. No collisions are detected.
 */
export class NoCollisionSystem implements CollisionSystem {
    public autoCheck = false;
    constructor(options: Required<CollisionOptions>) { }
    public addHitbox() { }
    public removeHitbox() { }
    public getCollisionsWith() { return []; }
    public _checkCollisions() { }
    public _setReactions() { }
}
