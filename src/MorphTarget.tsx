import { isZero } from './gl/algorithms/isZero'

/**
 * morph target
 */

export class MorphTarget {
    /**
     * indices modified by the morph target
     */
    indices!: Uint16Array
    /**
     * delta translation for indices stored in 'indices'
     */
    dxyz!: Float32Array

    constructor()
    constructor(indices: number[] | Uint16Array, dxyz: number[] | Float32Array)
    constructor(indices?: number[] | Uint16Array, dxyz?: number[] | Float32Array) {
        if (indices !== undefined) {
            if (!(indices instanceof Uint16Array)) {
                indices = new Uint16Array(indices)
            }
            this.indices = indices
        }

        if (dxyz !== undefined) {
            if (!(dxyz instanceof Float32Array)) {
                dxyz = new Float32Array(dxyz)
            }
            this.dxyz = dxyz
        }
    }

    /**
     * calculate morph target from two lists of vertices
     *
     * @param src
     * @param dst
     * @param size an optional size
     */
    diff(src: ArrayLike<number>, dst: ArrayLike<number>, size?: number) {
        if (src.length !== dst.length) {
            throw Error(
                `MorphTarget.diff(src, dst): src and dst must have the same length but they are ${src.length} and ${dst.length}`
            )
        }
        let length: number
        if (size === undefined) {
            length = src.length
        } else {
            length = size * 3
        }
        const indices: number[] = []
        const dxyz: number[] = []
        for (let v = 0, i = 0; v < length; ++i) {
            const sx = src[v]
            const dx = dst[v++]
            const sy = src[v]
            const dy = dst[v++]
            const sz = src[v]
            const dz = dst[v++]
            const x = dx - sx, y = dy - sy, z = dz - sz
            if (!isZero(x) || !isZero(y) || !isZero(z)) {
                indices.push(i)
                dxyz.push(x, y, z)
            }
        }
        this.indices = new Uint16Array(indices)
        this.dxyz = new Float32Array(dxyz)
    }

    /**
     * apply morph target to vertices
     *
     * @param verts destination
     * @param scale scale morp target by (value between 0 and 1)
     */
    apply(verts: Float32Array, scale: number) {
        // console.log(`morphing ${this.data.length} vertices by ${scale}`)
        let dataIndex = 0, vertexIndex = 0
        while (dataIndex < this.indices.length) {
            let index = this.indices[dataIndex++] * 3
            verts[index++] += this.dxyz[vertexIndex++] * scale
            verts[index++] += this.dxyz[vertexIndex++] * scale
            verts[index++] += this.dxyz[vertexIndex++] * scale
        }
    }
}
