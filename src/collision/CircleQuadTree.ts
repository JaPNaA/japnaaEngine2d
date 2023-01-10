import { Vec2 } from "../geometry/Vec2";


// --- quadtree circle collider
interface IEntity {
    radius: number;
    x: number;
    y: number;
    vx: number;
    vy: number;

    _quadTreeX: number;
    _quadTreeY: number;
    _collisionObj?: IEntity;
    _canSleep: boolean;
    _sleeping: boolean;
}

/**
 * The root of a quad tree implementation that checks for
 * collisions with circles
 */
class CircleQuadTree<T extends IEntity> implements QuadTreeChild<T> {
    private static leafMax = 6;
    private static branchMin = 6;
    private static maxDepth = 8;

    public elements: T[];
    public elementCount: number;

    /** Quadrants [I (++), II (-+), III (--), IV(+-)] */
    public children: QuadTreeChild<T>[] | null;

    private halfSize: number;

    constructor(size: number) {
        this.elements = [];
        this.elementCount = 0;
        this.children = null;

        this.halfSize = size / 2;
    }

    public addAll(objs: T[]): void {
        for (const obj of objs) {
            this.add(obj);
        }
    }

    public add(obj: T): void {
        const x = obj.x;
        const y = obj.y;
        const radius = obj.radius;

        obj._quadTreeX = x;
        obj._quadTreeY = y;

        let that: QuadTreeChild<T> = this;
        let cx: number = this.halfSize;
        let cy: number = this.halfSize;
        let qSize: number = this.halfSize / 2;
        let eSize!: number;
        // let depth: number = 0;

        while (true) {
            eSize = qSize / 2;
            that.elementCount++;
            // depth++;

            if (that.children === null) {
                // add to leaf
                that.elements.push(obj);
                if (that.elementCount > CircleQuadTree.leafMax) {
                    this.growLeaf(that, cx, cy);
                }
                break;
            } else {
                if (y > cy) {
                    if (x > cx) {
                        if (x - radius >= cx && y - radius >= cy) {
                            that = that.children[0];
                            cx += qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj); // put on branch if can't fully fit in leaf
                            break;
                        }
                    } else {
                        if (x + radius <= cx && y - radius >= cy) {
                            that = that.children[1];
                            cx -= qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    }
                } else {
                    if (x > cx) {
                        if (x - radius >= cx && y + radius <= cy) {
                            that = that.children[3];
                            cx += qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    } else {
                        if (x + radius <= cx && y + radius <= cy) {
                            that = that.children[2];
                            cx -= qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * Update single element in tree
     */
    public updateSingle(obj: T): void {
        const qtX = obj._quadTreeX;
        const qtY = obj._quadTreeY;
        const newX = obj.x;
        const newY = obj.y;
        const radius = obj.radius;

        obj._quadTreeX = newX;
        obj._quadTreeY = newY;

        // keep track of "stack"
        /** [child, cx, cy, halfSize of child] */
        const treeStack: [QuadTreeChild<T>, number, number, number][] = [];

        let lowBranch: QuadTreeChild<T> | undefined;

        let found = false;
        let that: QuadTreeChild<T> = this;
        let cx: number = this.halfSize;
        let cy: number = this.halfSize;
        let qSize: number = this.halfSize / 2;
        let eSize!: number;

        // search for object
        outer: while (true) {
            eSize = qSize / 2;

            const index = that.elements.indexOf(obj);
            if (index >= 0) {
                that.elements.splice(index, 1);
                found = true;
                break outer;
            }

            treeStack.push([that, cx, cy, qSize]);

            // if wasn't found in elements, go one level deeper
            if (that.children === null) {
                break; // end of tree
            } else {
                if (qtY > cy) {
                    if (qtX > cx) {
                        that = that.children[0];
                        cx += qSize;
                        cy += qSize;
                        qSize = eSize;
                    } else {
                        that = that.children[1];
                        cx -= qSize;
                        cy += qSize;
                        qSize = eSize;
                    }
                } else {
                    if (qtX > cx) {
                        that = that.children[3];
                        cx += qSize;
                        cy -= qSize;
                        qSize = eSize;
                    } else {
                        that = that.children[2];
                        cx -= qSize;
                        cy -= qSize;
                        qSize = eSize;
                    }
                }
            }
        }

        if (!found) { throw new Error("Could not find obj to update"); }

        // propagate upwards until the object can fit in the child
        let stack;

        that.elementCount--;

        while (true) {
            const hSize = qSize * 2;
            if (
                cx - hSize < newX - radius &&
                cx + hSize > newX + radius &&
                cy - hSize < newY - radius &&
                cy + hSize > newY + radius
            ) {
                // can fit
                break;
            }


            if (!lowBranch && that.elementCount < CircleQuadTree.branchMin) {
                lowBranch = that;
            }

            // can't fit
            stack = treeStack.pop();
            if (!stack) {
                break;
            }
            that = stack[0];
            cx = stack[1];
            cy = stack[2];
            qSize = stack[3];

            that.elementCount--;
        }

        // propagate back downwards to last child which can contain the obj
        while (true) {
            eSize = qSize / 2;
            that.elementCount++;

            if (that.children === null) {
                // add to leaf
                that.elements.push(obj);
                if (that.elementCount > CircleQuadTree.leafMax) {
                    this.growLeaf(that, cx, cy);
                }
                break;
            } else {
                if (newY > cy) {
                    if (newX > cx) {
                        if (newX - radius >= cx && newY - radius >= cy) {
                            that = that.children[0];
                            cx += qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj); // put on branch if can't fully fit in leaf
                            break;
                        }
                    } else {
                        if (newX + radius <= cx && newY - radius >= cy) {
                            that = that.children[1];
                            cx -= qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    }
                } else {
                    if (newX > cx) {
                        if (newX - radius >= cx && newY + radius <= cy) {
                            that = that.children[3];
                            cx += qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    } else {
                        if (newX + radius <= cx && newY + radius <= cy) {
                            that = that.children[2];
                            cx -= qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    }
                }
            }
        }

        if (lowBranch) {
            this.mergeBranch(lowBranch);
        }
    }

    public remove(obj: T): void {
        const x = obj._quadTreeX;
        const y = obj._quadTreeY;

        let lowBranch: QuadTreeChild<T> | undefined;

        let that: QuadTreeChild<T> = this;
        let cx: number = this.halfSize;
        let cy: number = this.halfSize;
        let qSize: number = this.halfSize / 2;
        let eSize!: number;

        while (true) {
            that.elementCount--;

            eSize = qSize / 2;

            const index = that.elements.indexOf(obj);
            if (index >= 0) {
                that.elements.splice(index, 1);
                if (lowBranch) {
                    this.mergeBranch(lowBranch);
                }
                return;
            }

            if (that.children === null) {
                throw new Error("Could not find obj for removal");
            } else {
                if (!lowBranch && that.elementCount < CircleQuadTree.branchMin) {
                    lowBranch = that;
                }

                if (y > cy) {
                    if (x > cx) {
                        that = that.children[0];
                        cx += qSize
                        cy += qSize
                        qSize = eSize;
                    } else {
                        that = that.children[1];
                        cx -= qSize;
                        cy += qSize;
                        qSize = eSize;
                    }
                } else {
                    if (x > cx) {
                        that = that.children[3];
                        cx += qSize;
                        cy -= qSize;
                        qSize = eSize;
                    } else {
                        that = that.children[2];
                        cx -= qSize;
                        cy -= qSize;
                        qSize = eSize;
                    }
                }
            }
        }
    }

    public queryOne(x: number, y: number, radius: number, exclude?: T): T | undefined {
        // possible optimization: check if query only collides with 3 quadrants

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize, this.halfSize, this.halfSize / 2]
        ];

        let queItem;
        while (queItem = que.pop()) {
            const that = queItem[0];

            if (that.children !== null) {
                const cx = queItem[1];
                const cy = queItem[2];
                const qSize = queItem[3];
                const eSize = qSize / 2;

                if (y > cy) {
                    if (x > cx) {
                        que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                        if (x - radius < cx) {
                            que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            if (y - radius < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - radius < cy) {
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                        if (x + radius > cx) {
                            que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            if (y - radius < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - radius < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            }
                        }
                    }
                } else {
                    if (x > cx) {
                        que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                        if (x - radius < cx) {
                            que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            if (y + radius > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + radius > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                        if (x + radius > cx) {
                            que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            if (y + radius > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + radius > cy) {
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        }
                    }
                }
            }

            for (let i = that.elements.length - 1; i >= 0; i--) {
                if (that.elements[i] === exclude) { continue; }

                const element = that.elements[i];
                const dx = element.x - x;
                const dy = element.y - y;
                const r = element.radius + radius;

                if (dx * dx + dy * dy < r * r) {
                    return element;
                }
            }
        }
    }

    public query(x: number, y: number, radius: number): T[] {
        // possible optimization: check if query only collides with 3 quadrants

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize, this.halfSize, this.halfSize / 2]
        ];
        const entities: T[] = [];

        let queItem;
        while (queItem = que.pop()) {
            const that = queItem[0];

            if (that.children !== null) {
                const cx = queItem[1];
                const cy = queItem[2];
                const qSize = queItem[3];
                const eSize = qSize / 2;

                if (y > cy) {
                    if (x > cx) {
                        que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                        if (x - radius < cx) {
                            que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            if (y - radius < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - radius < cy) {
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                        if (x + radius > cx) {
                            que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            if (y - radius < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - radius < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            }
                        }
                    }
                } else {
                    if (x > cx) {
                        que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                        if (x - radius < cx) {
                            que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            if (y + radius > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + radius > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                        if (x + radius > cx) {
                            que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            if (y + radius > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + radius > cy) {
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        }
                    }
                }
            }

            for (let i = that.elements.length - 1; i >= 0; i--) {
                const element = that.elements[i];
                const dx = element.x - x;
                const dy = element.y - y;
                const r = element.radius + radius;

                if (dx * dx + dy * dy < r * r) {
                    entities.push(element);
                }
            }
        }

        return entities;
    }

    /**
     * Querys a rectangle in the quadtree without checking if the
     * entities actually collide with the given rectangle
     */
    public rectQueryNoVerify(x_: number, y_: number, width_: number, height_: number): T[] {
        const x = x_ + width_ / 2;
        const y = y_ + height_ / 2;
        const hwidth = width_ / 2;
        const hheight = height_ / 2;

        const elms = [];

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize, this.halfSize, this.halfSize / 2]
        ];

        let queItem;
        while (queItem = que.pop()) {
            const that = queItem[0];

            if (that.children !== null) {
                const cx = queItem[1];
                const cy = queItem[2];
                const qSize = queItem[3];
                const eSize = qSize / 2;

                if (y > cy) {
                    if (x > cx) {
                        que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                        if (x - hwidth < cx) {
                            que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            if (y - hheight < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - hheight < cy) {
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                        if (x + hwidth > cx) {
                            que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            if (y - hheight < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - hheight < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            }
                        }
                    }
                } else {
                    if (x > cx) {
                        que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                        if (x - hwidth < cx) {
                            que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            if (y + hheight > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + hheight > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                        if (x + hwidth > cx) {
                            que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            if (y + hheight > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + hheight > cy) {
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        }
                    }
                }
            }

            for (let i = that.elements.length - 1; i >= 0; i--) {
                const element = that.elements[i];
                elms.push(element);
            }
        }

        return elms;
    }

    public debugRender(X: CanvasRenderingContext2D): void {
        X.save();
        X.strokeStyle = "#ff8888";
        X.font = "bold 16px Arial";
        X.textAlign = "center";
        X.textBaseline = "middle";
        X.lineWidth = 1;

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize, this.halfSize, this.halfSize / 2]
        ];

        let queItem;
        while (queItem = que.pop()) {
            const that = queItem[0];
            const cx = queItem[1];
            const cy = queItem[2];
            const qSize = queItem[3];
            const eSize = qSize / 2;
            const hSize = qSize * 2;

            if (that.children !== null) {
                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
            }

            X.fillStyle = "#dd5555";
            X.fillText(that.elementCount.toString(), cx, cy);

            X.beginPath();
            X.fillStyle = "#ff000008";
            X.rect(cx - hSize, cy - hSize, hSize * 2, hSize * 2);
            X.stroke();
            X.fill();
        }

        X.restore();
    }

    private growLeaf(that: QuadTreeChild<T>, cx: number, cy: number): void {
        // grow the leaf into a branch
        that.children = [
            createQuadTreeChild(),
            createQuadTreeChild(),
            createQuadTreeChild(),
            createQuadTreeChild(),
        ];

        const oldElements = that.elements;
        that.elements = [];

        // put elements into the leaves
        for (let i = oldElements.length - 1; i >= 0; i--) {
            const element = oldElements[i];
            const x = element._quadTreeX;
            const y = element._quadTreeY;
            const radius = element.radius;

            if (y > cy) {
                if (x > cx) {
                    if (x - radius >= cx && y - radius >= cy) {
                        that.children[0].elements.push(element);
                        that.children[0].elementCount++;
                    } else {
                        that.elements.push(element); // put on branch if can't fully fit in new leaf
                    }
                } else {
                    if (x + radius <= cx && y - radius >= cy) {
                        that.children[1].elements.push(element);
                        that.children[1].elementCount++;
                    } else {
                        that.elements.push(element);
                    }
                }
            } else {
                if (x > cx) {
                    if (x - radius >= cx && y + radius <= cy) {
                        that.children[3].elements.push(element);
                        that.children[3].elementCount++;
                    } else {
                        that.elements.push(element);
                    }
                } else {
                    if (x + radius <= cx && y + radius <= cy) {
                        that.children[2].elements.push(element);
                        that.children[2].elementCount++;
                    } else {
                        that.elements.push(element);
                    }
                }
            }
        }
    }

    private mergeBranch(branch: QuadTreeChild<T>): void {
        const elements: T[] = [];
        const que: QuadTreeChild<T>[] = [branch];

        let curr;
        while (curr = que.pop()) {
            if (curr.children !== null && curr.elementCount > 0) {
                que.push(curr.children[0]);
                que.push(curr.children[1]);
                que.push(curr.children[2]);
                que.push(curr.children[3]);
            }

            for (let i = curr.elements.length - 1; i >= 0; i--) {
                elements.push(curr.elements[i]);
            }
        }

        branch.elements = elements;
        branch.children = null;
    }
}

function createQuadTreeChild<T>(): QuadTreeChild<T> {
    return {
        elements: [],
        children: null,
        elementCount: 0
    };
}

interface QuadTreeChild<T> {
    elements: T[];
    children: QuadTreeChild<T>[] | null;
    elementCount: number;
}

export default CircleQuadTree;


const SLEEP_THRESHOLD = 0.0005;

class Sleeper {
    public sleepAll(entities: IEntity[]) {
        for (const entity of entities) {
            entity._sleeping =
                entity._canSleep &&
                Math.abs(entity.vx) + Math.abs(entity.vy) < SLEEP_THRESHOLD;
        }
    }
}

interface Collidable extends IEntity {
    _collisionObj: any;
    _sleeping: boolean;
    x: number;
    y: number;
    radius: number;
    collideWith: any;
}

class CircleCollider<T extends Collidable> {
    public quadTree!: CircleQuadTree<T>;

    public collideAll(entities: T[]): void {
        for (const entity of entities) {
            entity._collisionObj = undefined;
            if (entity._sleeping) { continue; }
            this.quadTree.updateSingle(entity);
        }

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity._sleeping) { continue; }
            const other = this.quadTree.queryOne(entity.x, entity.y, entity.radius, entity);
            if (other) {
                if (other._collisionObj !== entity) {
                    entity.collideWith(other);
                    entity._collisionObj = other;
                }
            }
        }
    }

    public setBoundaries(boundaries: Vec2): void {
        this.quadTree = new CircleQuadTree(Math.max(boundaries.x, boundaries.y));
    }

    public getQuadTree(): CircleQuadTree<T> {
        return this.quadTree;
    }

    public newEntity(collidable: T): void {
        this.quadTree.add(collidable);
    }

    public removeEntity(entity: T): void {
        this.quadTree.remove(entity);
    }
}
