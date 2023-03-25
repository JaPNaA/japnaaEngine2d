import { Rectangle, RectangleM } from "../geometry/Rectangle.js";
import { Vec2M } from "../geometry/Vec2.js";
import { Collidable, Hitbox } from "./Hitbox.js";

/**
 * The root of a quad tree implementation that checks for
 * collisions with circles
 */
class QuadTree implements QuadTreeChild {
    private static leafMax = 6;
    private static branchMin = 6;

    public elements: Hitbox<Collidable>[];
    public elementCount: number;

    /** Quadrants [I (++), II (-+), III (--), IV(+-)] */
    public children: QuadTreeChild[] | null;

    private halfSize: number;

    /**
     * @param size max width and height of the quad tree
     */
    constructor(size: number) {
        this.elements = [];
        this.elementCount = 0;
        this.children = null;

        this.halfSize = size / 2;
    }

    public add(obj: Hitbox<Collidable>): void {
        const x = obj.rectangle.x;
        const y = obj.rectangle.y;
        const rightX = obj.rectangle.rightX();
        const bottomY = obj.rectangle.bottomY();

        obj._quadTreeRecord.copy(obj.rectangle);

        let currTree: QuadTreeChild = this;
        let cx: number = this.halfSize;
        let cy: number = this.halfSize;
        let qSize: number = this.halfSize / 2;
        let eSize!: number;
        // let depth: number = 0;

        while (true) {
            eSize = qSize / 2;
            currTree.elementCount++;
            // depth++;

            if (currTree.children === null) {
                // add to leaf
                currTree.elements.push(obj);
                if (currTree.elementCount > QuadTree.leafMax) {
                    this.growLeaf(currTree, cx, cy);
                }
                break;
            } else {
                if (y > cy) {
                    if (x > cx) {
                        if (x >= cx && y >= cy) {
                            currTree = currTree.children[0];
                            cx += qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            currTree.elements.push(obj); // put on branch if can't fully fit in leaf
                            break;
                        }
                    } else {
                        if (rightX <= cx && y >= cy) {
                            currTree = currTree.children[1];
                            cx -= qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            currTree.elements.push(obj);
                            break;
                        }
                    }
                } else {
                    if (x > cx) {
                        if (x >= cx && bottomY <= cy) {
                            currTree = currTree.children[3];
                            cx += qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            currTree.elements.push(obj);
                            break;
                        }
                    } else {
                        if (rightX <= cx && bottomY <= cy) {
                            currTree = currTree.children[2];
                            cx -= qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            currTree.elements.push(obj);
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
    public updateSingle(obj: Hitbox<Collidable>): void {
        const qtX = obj._quadTreeRecord.x;
        const qtY = obj._quadTreeRecord.y;
        const qtRightX = obj._quadTreeRecord.rightX();
        const qtBottomY = obj._quadTreeRecord.bottomY();
        const newX = obj.rectangle.x;
        const newY = obj.rectangle.y;
        const newBottomY = obj.rectangle.bottomY();
        const newRightX = obj.rectangle.rightX();

        obj._quadTreeRecord.copy(obj.rectangle);

        // keep track of "stack"
        /** [child, cx, cy, halfSize of child] */
        const treeStack: [QuadTreeChild, number, number, number][] = [];

        let lowBranch: QuadTreeChild | undefined;

        let found = false;
        let that: QuadTreeChild = this;
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

            // ------------ code below can probably be optimized
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
                cx - hSize < newX &&
                cx + hSize > newRightX &&
                cy - hSize < newY &&
                cy + hSize > newBottomY
            ) {
                // can fit
                break;
            }


            if (!lowBranch && that.elementCount < QuadTree.branchMin) {
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
                if (that.elementCount > QuadTree.leafMax) {
                    this.growLeaf(that, cx, cy);
                }
                break;
            } else {
                if (newY > cy) {
                    if (newX > cx) {
                        if (newX >= cx && newY >= cy) {
                            that = that.children[0];
                            cx += qSize;
                            cy += qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj); // put on branch if can't fully fit in leaf
                            break;
                        }
                    } else {
                        if (newRightX <= cx && newY >= cy) {
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
                        if (newX >= cx && newBottomY <= cy) {
                            that = that.children[3];
                            cx += qSize;
                            cy -= qSize;
                            qSize = eSize;
                        } else {
                            that.elements.push(obj);
                            break;
                        }
                    } else {
                        if (newRightX <= cx && newBottomY <= cy) {
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

    public remove(obj: Hitbox<Collidable>): void {
        const x = obj._quadTreeRecord.x;
        const y = obj._quadTreeRecord.y;

        let lowBranch: QuadTreeChild | undefined;

        let that: QuadTreeChild = this;
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
                if (!lowBranch && that.elementCount < QuadTree.branchMin) {
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

    public queryOne(rectangle: Rectangle, exclude?: Hitbox<Collidable>): Hitbox<Collidable> | undefined {
        // possible optimization: check if query only collides with 3 quadrants
        const x = rectangle.x;
        const y = rectangle.y;
        const width = rectangle.width;
        const height = rectangle.height;

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild, number, number, number][] = [
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
                        if (x < cx) {
                            que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            if (y < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y < cy) {
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                        if (x + width > cx) {
                            que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            if (y < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            }
                        }
                    }
                } else {
                    if (x > cx) {
                        que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                        if (x < cx) {
                            que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            if (y + height > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + height > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                        if (x + width > cx) {
                            que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            if (y + height > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + height > cy) {
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        }
                    }
                }
            }

            for (let i = that.elements.length - 1; i >= 0; i--) {
                if (that.elements[i] === exclude) { continue; }

                const element = that.elements[i].rectangle;

                if (RectangleM.isColliding(element, rectangle)) {
                    return that.elements[i];
                }
            }
        }
    }

    public query(rectangle: Rectangle): Hitbox<Collidable>[] {
        // possible optimization: check if query only collides with 3 quadrants
        const x = rectangle.x;
        const y = rectangle.y;
        const width = rectangle.width;
        const height = rectangle.height;

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild, number, number, number][] = [
            [this, this.halfSize, this.halfSize, this.halfSize / 2]
        ];
        const entities: Hitbox<Collidable>[] = [];

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
                        if (x < cx) {
                            que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            if (y < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y < cy) {
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                        if (x + width > cx) {
                            que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            if (y < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            }
                        }
                    }
                } else {
                    if (x > cx) {
                        que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                        if (x < cx) {
                            que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            if (y + height > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + height > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                        if (x + width > cx) {
                            que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            if (y + height > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + height > cy) {
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        }
                    }
                }
            }


            for (let i = that.elements.length - 1; i >= 0; i--) {
                const element = that.elements[i].rectangle;

                if (RectangleM.isColliding(element, rectangle)) {
                    entities.push(that.elements[i]);
                }
            }
        }

        return entities;
    }

    /**
     * Querys a rectangle in the quadtree without checking if the
     * entities actually collide with the given rectangle
     */
    public rectQueryNoVerify(x_: number, y_: number, width_: number, height_: number): Hitbox<Collidable>[] {
        const x = x_ + width_ / 2;
        const y = y_ + height_ / 2;
        const hwidth = width_ / 2;
        const hheight = height_ / 2;

        const elms = [];

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild, number, number, number][] = [
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

    public __debugRender(X: CanvasRenderingContext2D): void {
        X.save();
        X.strokeStyle = "#ff8888";
        X.font = "bold 16px Arial";
        X.textAlign = "center";
        X.textBaseline = "middle";
        X.lineWidth = 1;

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild, number, number, number][] = [
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

    private growLeaf(that: QuadTreeChild, cx: number, cy: number): void {
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
            const x = element._quadTreeRecord.x;
            const y = element._quadTreeRecord.y;
            const rightX = element._quadTreeRecord.rightX();
            const bottomY = element._quadTreeRecord.bottomY();

            if (y > cy) {
                if (x > cx) {
                    if (x >= cx && y >= cy) {
                        that.children[0].elements.push(element);
                        that.children[0].elementCount++;
                    } else {
                        that.elements.push(element); // put on branch if can't fully fit in new leaf
                    }
                } else {
                    if (rightX <= cx && y >= cy) {
                        that.children[1].elements.push(element);
                        that.children[1].elementCount++;
                    } else {
                        that.elements.push(element);
                    }
                }
            } else {
                if (x > cx) {
                    if (x >= cx && bottomY <= cy) {
                        that.children[3].elements.push(element);
                        that.children[3].elementCount++;
                    } else {
                        that.elements.push(element);
                    }
                } else {
                    if (rightX <= cx && bottomY <= cy) {
                        that.children[2].elements.push(element);
                        that.children[2].elementCount++;
                    } else {
                        that.elements.push(element);
                    }
                }
            }
        }
    }

    private mergeBranch(branch: QuadTreeChild): void {
        const elements: Hitbox<Collidable>[] = [];
        const que: QuadTreeChild[] = [branch];

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

function createQuadTreeChild(): QuadTreeChild {
    return {
        elements: [],
        children: null,
        elementCount: 0
    };
}

interface QuadTreeChild {
    elements: Hitbox<Collidable>[];
    children: QuadTreeChild[] | null;
    elementCount: number;
}

export { QuadTree };
