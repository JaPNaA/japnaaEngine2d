export function removeElmFromArray<T>(elm: T, array: T[]) {
    const index = array.indexOf(elm);
    if (index < 0) { throw new Error("Tried to remove element not in array"); }
    array.splice(index, 1);
}
