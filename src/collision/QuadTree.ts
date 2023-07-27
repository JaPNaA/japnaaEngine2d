import { Rectangle, RectangleM } from "../geometry/Rectangle.js";
import { Hitbox } from "./Hitbox.js";

/**
 * The root of a quad tree implementation that checks for
 * collisions with circles
 */
class QuadTree<T> implements QuadTreeChild<T> {
    private static leafMax = 6;
    private static branchMin = 6;
    // maxDepth is used to prevent seven RectM(1, 1, 0, 0)s from making a black hole in the quadtree, etc.
    // not honored percisely
    private static maxDepth = 40;

    public elements: QuadTreeHitbox<T>[];
    public elementCount: number;

    /** Quadrants [I (++), II (-+), III (--), IV(+-)] */
    public children: QuadTreeChild<T>[] | null;

    private size: number;
    private x: number;
    private y: number;
    private halfSize: number;
    /** The amount the tree has grown. Does not exceed maxDepth */
    private growDepth: number;

    /**
     * @param size initial width and height of the quad tree
     */
    constructor(size: number) {
        this.elements = [];
        this.elementCount = 0;
        this.children = null;

        this.size = size;
        this.x = 0;
        this.y = 0;
        this.halfSize = size / 2;
        this.growDepth = 0;
    }

    public add(obj: QuadTreeHitbox<T>): void {
        const x = obj.rectangle.x;
        const y = obj.rectangle.y;
        const rightX = obj.rectangle.rightX();
        const bottomY = obj.rectangle.bottomY();

        obj._quadTreeRecord.copy(obj.rectangle);

        // grow quadtree if too small
        while ( // obj not contained in root
            (x <= this.x ||
                rightX >= this.x + this.size ||
                y <= this.y ||
                bottomY >= this.y + this.size) && this.growDepth < QuadTree.maxDepth
        ) {
            if (obj.rectangle.centerX() > this.halfSize + this.x) {
                if (obj.rectangle.centerY() > this.halfSize + this.y) {
                    this.growRoot(2);
                } else {
                    this.growRoot(1);
                }
            } else {
                if (obj.rectangle.centerY() > this.halfSize + this.y) {
                    this.growRoot(3);
                } else {
                    this.growRoot(0);
                }
            }
        }

        let currTree: QuadTreeChild<T> = this;
        let cx: number = this.halfSize + this.x; // center x of currTree
        let cy: number = this.halfSize + this.y; // center y of currTree
        let qSize: number = this.halfSize / 2;
        let eSize!: number;
        let depth: number = 0;

        while (true) {
            eSize = qSize / 2;
            currTree.elementCount++;
            depth++;

            if (currTree.children === null) {
                // add to leaf
                currTree.elements.push(obj);
                if (currTree.elementCount > QuadTree.leafMax && depth < QuadTree.maxDepth) {
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
    public updateSingle(obj: QuadTreeHitbox<T>): void {
        const qtX = obj._quadTreeRecord.x;
        const qtY = obj._quadTreeRecord.y;
        const newX = obj.rectangle.x;
        const newY = obj.rectangle.y;
        const newBottomY = obj.rectangle.bottomY();
        const newRightX = obj.rectangle.rightX();

        // grow quadtree if too small
        while ( // obj not contained in root
            (newX < this.x ||
                newRightX > this.x + this.size ||
                newY < this.y ||
                newBottomY > this.y + this.size) && this.growDepth < QuadTree.maxDepth
        ) {
            if (obj.rectangle.centerX() > this.halfSize + this.x) {
                if (obj.rectangle.centerY() > this.halfSize + this.y) {
                    this.growRoot(2);
                } else {
                    this.growRoot(1);
                }
            } else {
                if (obj.rectangle.centerY() > this.halfSize + this.y) {
                    this.growRoot(3);
                } else {
                    this.growRoot(0);
                }
            }
        }

        obj._quadTreeRecord.copy(obj.rectangle);

        // keep track of "stack"
        /** [child, cx, cy, halfSize of child] */
        const treeStack: [QuadTreeChild<T>, number, number, number][] = [];

        let lowBranch: QuadTreeChild<T> | undefined;

        let found = false;
        let that: QuadTreeChild<T> = this;
        let cx: number = this.halfSize + this.x;
        let cy: number = this.halfSize + this.y;
        let qSize: number = this.halfSize / 2;
        let eSize!: number;
        let depth: number = 0;

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
                depth++;
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


            if (that.elementCount < QuadTree.branchMin) {
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
            depth--;

            that.elementCount--;
        }

        // propagate back downwards to last child which can contain the obj
        while (true) {
            eSize = qSize / 2;
            that.elementCount++;
            depth++;

            if (that.children === null) {
                // add to leaf
                that.elements.push(obj);
                if (that.elementCount > QuadTree.leafMax && depth < QuadTree.maxDepth) {
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

    public remove(obj: QuadTreeHitbox<T>): void {
        const x = obj._quadTreeRecord.x;
        const y = obj._quadTreeRecord.y;

        let lowBranch: QuadTreeChild<T> | undefined;

        let that: QuadTreeChild<T> = this;
        let cx: number = this.halfSize + this.x;
        let cy: number = this.halfSize + this.y;
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

    public queryOne(rectangle: Rectangle, exclude?: QuadTreeHitbox<T>): QuadTreeHitbox<T> | undefined {
        // possible optimization: check if query only collides with 3 quadrants
        const x = rectangle.x;
        const y = rectangle.y;
        const width = rectangle.width;
        const height = rectangle.height;

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize + this.x, this.halfSize + this.y, this.halfSize / 2]
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

                // inlined version of
                // if (RectangleM.isColliding(element, rectangle)) {
                if (element.x < rectangle.x + rectangle.width &&
                    element.x + element.width > rectangle.x &&
                    element.y < rectangle.y + rectangle.height &&
                    element.y + element.height > rectangle.y) {
                    return that.elements[i];
                }
            }
        }
    }

    public query(rectangle: Rectangle): QuadTreeHitbox<T>[] {
        // possible optimization: check if query only collides with 3 quadrants
        const x = rectangle.x;
        const y = rectangle.y;
        const width = rectangle.width;
        const height = rectangle.height;

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize + this.x, this.halfSize + this.y, this.halfSize / 2]
        ];
        const entities: QuadTreeHitbox<T>[] = [];

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

                // inlined version of
                // if (RectangleM.isColliding(element, rectangle)) {
                if (element.x < rectangle.x + rectangle.width &&
                    element.x + element.width > rectangle.x &&
                    element.y < rectangle.y + rectangle.height &&
                    element.y + element.height > rectangle.y) {
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
    public rectQueryNoVerify(rect: Rectangle): QuadTreeHitbox<T>[] {
        const x = rect.x;
        const y = rect.y;
        const width = rect.width;
        const height = rect.height;
        const elms = [];

        // as an alternative to recursive
        /** [child, cx, cy, halfSize of child] */
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize + this.x, this.halfSize + this.y, this.halfSize / 2]
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
                        if (x - width / 2 < cx) {
                            que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            if (y - height / 2 < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - height / 2 < cy) {
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                        if (x + width / 2 > cx) {
                            que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            if (y - height / 2 < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                                que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            }
                        } else {
                            if (y - height / 2 < cy) {
                                que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            }
                        }
                    }
                } else {
                    if (x > cx) {
                        que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                        if (x - width / 2 < cx) {
                            que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                            if (y + height / 2 > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + height / 2 > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                            }
                        }
                    } else {
                        que.push([that.children[2], cx - qSize, cy - qSize, eSize]);
                        if (x + width / 2 > cx) {
                            que.push([that.children[3], cx + qSize, cy - qSize, eSize]);
                            if (y + height / 2 > cy) {
                                que.push([that.children[0], cx + qSize, cy + qSize, eSize]);
                                que.push([that.children[1], cx - qSize, cy + qSize, eSize]);
                            }
                        } else {
                            if (y + height / 2 > cy) {
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
        const que: [QuadTreeChild<T>, number, number, number][] = [
            [this, this.halfSize + this.x, this.halfSize + this.y, this.halfSize / 2]
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
            createQuadTreeChild<T>(),
            createQuadTreeChild<T>(),
            createQuadTreeChild<T>(),
            createQuadTreeChild<T>(),
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

    /**
     * Changes the root so that the root becomes a child in the specified quadrant.
     * 
     * Precondition: all elements are contained in the quadtree. (Not outside bounds.)
     */
    private growRoot(quadrant: number) {
        const newChildren = [
            createQuadTreeChild<T>(),
            createQuadTreeChild<T>(),
            createQuadTreeChild<T>(),
            createQuadTreeChild<T>()
        ];
        const newRootChild = newChildren[quadrant];
        newRootChild.children = this.children;
        newRootChild.elements = this.elements;
        newRootChild.elementCount = this.elementCount;
        this.children = newChildren;
        this.elements = [];
        switch (quadrant) {
            case 0:
                this.x -= this.size;
                this.y -= this.size;
                break;
            case 1:
                this.y -= this.size;
                break;
            case 2:
                break;
            case 3:
                this.x -= this.size;
                break;
        }
        this.size *= 2;
        this.halfSize *= 2;
        this.growDepth++;
    }

    /**
     * Shrinks boundaries of the root of the quadtree if possible
     */
    public shrinkRootIfCan() {
        if (!this.children) { return; }
        if (this.elements.length !== 0) { return; }
        let numEmpty = 0;
        let nonEmpty = 0;
        if (this.children[0].elementCount === 0) { numEmpty++; }
        if (this.children[1].elementCount === 0) { numEmpty++; } else { nonEmpty = 1; }
        if (this.children[2].elementCount === 0) { numEmpty++; } else { nonEmpty = 2; }
        if (this.children[3].elementCount === 0) { numEmpty++; } else { nonEmpty = 3; }
        if (numEmpty === 3) {
            this.shrinkRoot(nonEmpty);
        }
    }

    /**
     * Changes root to one of the root's children (specified by quadrant).
     * 
     * Precondition: The other quadrants in the root and root.elements contain no elements.
     * 
     * Quadrants: [I (++), II (-+), III (--), IV(+-)]
     */
    private shrinkRoot(quadrant: number) {
        if (this.children == null) {
            this.growLeaf(this, this.halfSize, this.halfSize);
        }

        const targetChild = this.children![quadrant];
        this.children = targetChild.children;
        this.elements = targetChild.elements;
        this.elementCount = targetChild.elementCount;

        switch (quadrant) {
            case 0:
                this.x += this.halfSize;
                this.y += this.halfSize;
                break;
            case 1:
                this.y += this.halfSize;
                break;
            case 2:
                break;
            case 3:
                this.x += this.halfSize;
                break;
        }

        this.halfSize /= 2;
        this.size /= 2;
        this.growDepth--;
    }

    /** Merges child branches into parent branch */
    private mergeBranch(branch: QuadTreeChild<T>): void {
        const elements: QuadTreeHitbox<T>[] = [];
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
    /**
     * Elements on the child. If is a leaf, is the elements in the quadrant.
     * If is a branch, are the elements that don't fit into a leaf.
     */
    elements: QuadTreeHitbox<T>[];
    /**
     * Child quadtrees, if exists.
     */
    children: QuadTreeChild<T>[] | null;
    /**
     * The number of total elements in self and ancestors.
     */
    elementCount: number;
}

export interface QuadTreeHitbox<T> {
    rectangle: RectangleM;
    elm: T;
    _quadTreeRecord: RectangleM;
    _collidedWith: Hitbox<T>[];
}

export { QuadTree };
