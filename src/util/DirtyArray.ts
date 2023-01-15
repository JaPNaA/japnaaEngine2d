/**
 * A DirtyArray allows safe deleting of items while looping over its contents.
 * DirtyArray uses a clean/dirty system.
 */
export class DirtyArray<T> {
    private items: (T | undefined)[] = [];
    private isClean = true;

    public push(item: T) {
        this.items.push(item);
    }

    public remove(item: T) {
        const index = this.items.indexOf(item);
        if (index < 0) { throw new Error("Tried to remove element not in array"); }
        this.items[index] = undefined;
        this.isClean = false;
    }

    public *[Symbol.iterator](): Generator<T> {
        for (const item of this.items) {
            if (item !== undefined) {
                yield item;
            }
        }
        this.clean();
    }

    public clean() {
        if (this.isClean) { return; }
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i] === undefined) {
                this.items.splice(i, 1);
            }
        }
        this.isClean = true;
    }
}