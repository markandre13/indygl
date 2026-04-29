/**
 * create a subset in the range of [start, end[
 *
 * @param xyz point3[]
 * @param fxyz indices[]
 * @param start
 * @param end
 * @returns
 */
export function subset_P3_IDX(xyz: ArrayLike<number>, fxyz: ArrayLike<number>, start: number, end: number) {
    const xyzOut: number[] = []
    const fxyzOut: number[] = []
    const map = new Map<number, number>()
    for (let i = start; i < end; ++i) {
        let oldIdx = fxyz[i]
        let newIdx = map.get(oldIdx)
        if (newIdx === undefined) {
            newIdx = xyzOut.length / 3
            map.set(oldIdx, newIdx)
            oldIdx *= 3
            xyzOut.push(xyz[oldIdx], xyz[++oldIdx], xyz[++oldIdx])
        }
        fxyzOut.push(newIdx)
    }
    return {
        xyz: xyzOut,
        fxyz: fxyzOut,
        old2new: map
    }
}
