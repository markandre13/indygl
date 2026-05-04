/**
 * create a subset in the range of [start, end[
 *
 * @param xyz
 * @param fxyz
 * @param uv
 * @param fuv
 * @param start
 * @param end
 * @returns
 */

export function subset_P3_T2_IDX(
    xyz: ArrayLike<number>, fxyz: ArrayLike<number>,
    uv: ArrayLike<number>, fuv: ArrayLike<number>,
    start: number, end: number) {
    const xyzOut: number[] = []
    const uvOut: number[] = []
    const fxyzOut: number[] = []
    const fuvOut: number[] = []
    const ptIdxOld2New = new Map<number, number>()
    const txIdxOld2New = new Map<number, number>()

    for (let i = start; i < end; ++i) {
        let ptIdxOld = fxyz[i]
        let ptIdxNew = ptIdxOld2New.get(ptIdxOld)
        if (ptIdxNew === undefined) {
            ptIdxNew = xyzOut.length / 3
            ptIdxOld2New.set(ptIdxOld, ptIdxNew)
            let p = ptIdxOld * 3
            xyzOut.push(xyz[p], xyz[++p], xyz[++p])
        }
        fxyzOut.push(ptIdxNew)

        let txIdxOld = fuv[i]
        let txIdxNew = txIdxOld2New.get(txIdxOld)
        if (txIdxNew === undefined) {
            txIdxNew = uvOut.length / 2
            txIdxOld2New.set(txIdxOld, txIdxNew)
            let p = txIdxOld * 2
            uvOut.push(uv[p], uv[++p])
        }
        fuvOut.push(txIdxNew)
    }
    return {
        xyz: xyzOut,
        fxyz: fxyzOut,
        uv: uvOut,
        fuv: fuvOut,
        old2new: ptIdxOld2New
    }
}
