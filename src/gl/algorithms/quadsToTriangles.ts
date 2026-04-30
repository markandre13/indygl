/**
 * Convert index buffer containing quads to index buffer containing triangles
 *
 * 0   1       0   1     0
 *         ->         &
 * 3   2           2     3   2
 * TODO: input would more regularily be of number[] ?
 * TODO: create GLBuffer ondemand, e.g. via glbuffer(gl: WebGLContext) ?
 * @param quads
 * @returns
 */
export function quadsToTriangles(quads: ArrayLike<number>): ArrayLike<number> {
    const data = new Uint32Array((quads.length / 4) * 6)
    let i = 0, o = 0
    const q = quads
    while (i < q.length) {
        data[o++] = q[i]
        data[o++] = q[i + 1]
        data[o++] = q[i + 2]

        data[o++] = q[i]
        data[o++] = q[i + 2]
        data[o++] = q[i + 3]

        i += 4
    }
    return data
}