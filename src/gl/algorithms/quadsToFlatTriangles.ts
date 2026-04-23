import { vec3 } from "gl-matrix"

/**
 * convert the provided quads into flat shaded triangles
 * 
 * the resulting positions begin with the content of xyz
 * 
 * @param xyz 
 * @param fxyz 
 * @returns \{ positions: number[], normals: number[], indices: number[] \}
 */
export function quadsToFlatTriangles(xyz: ArrayLike<number>, fxyz: ArrayLike<number>) {
    const offset = 0
    const length = fxyz.length
    const l = xyz.length
    const v2 = new Array<number>(l)
    const n2 = new Array<number>(l)
    const f2: number[] = []

    const p0 = vec3.create()
    const p1 = vec3.create()
    const p2 = vec3.create()
    const p3 = vec3.create()
    const u = vec3.create()
    const v = vec3.create()
    const n = vec3.create()

    // the head of the resultion positions is the same as in xyz
    const used = new Set<number>
    for (let i = 0; i < l; ++i) {
        v2[i] = xyz[i]
    }

    for (let i = offset; i < length + offset;) {
        let i0 = fxyz[i++]! * 3
        let i1 = fxyz[i++]! * 3
        let i2 = fxyz[i++]! * 3
        let i3 = fxyz[i++]! * 3

        vec3.set(p0, xyz[i0]!, xyz[i0 + 1]!, xyz[i0 + 2]!)
        vec3.set(p1, xyz[i1]!, xyz[i1 + 1]!, xyz[i1 + 2]!)
        vec3.set(p2, xyz[i2]!, xyz[i2 + 1]!, xyz[i2 + 2]!)
        vec3.set(p3, xyz[i3]!, xyz[i3 + 1]!, xyz[i3 + 2]!)

        // normal
        vec3.subtract(u, p2, p1)
        vec3.subtract(v, p3, p1)
        vec3.cross(n, u, v)
        vec3.normalize(n, n)

        let fo0, fo1, fo2, fo3
        if (i0 < l && !used.has(i0)) {
            fo0 = i0
            used.add(i0)
            n2[i0] = n[0]
            n2[i0 + 1] = n[1]
            n2[i0 + 2] = n[2]
        } else {
            fo0 = v2.length
            v2.push(...p0)
            n2.push(...n)
        }

        if (i1 < l && !used.has(i1)) {
            fo1 = i1
            used.add(i1)
            n2[i1] = n[0]
            n2[i1 + 1] = n[1]
            n2[i1 + 2] = n[2]
        } else {
            fo1 = v2.length
            v2.push(...p1)
            n2.push(...n)
        }

        if (i2 < l && !used.has(i2)) {
            fo2 = i2
            used.add(i2)
            n2[i2] = n[0]
            n2[i2 + 1] = n[1]
            n2[i2 + 2] = n[2]
        } else {
            fo2 = v2.length
            v2.push(...p2)
            n2.push(...n)
        }

        if (i3 < l && !used.has(i3)) {
            fo3 = i3
            used.add(i3)
            n2[i3] = n[0]
            n2[i3 + 1] = n[1]
            n2[i3 + 2] = n[2]
        } else {
            fo3 = v2.length
            v2.push(...p3)
            n2.push(...n)
        }

        fo0 /= 3
        fo1 /= 3
        fo2 /= 3
        fo3 /= 3

        // two triangles for quad
        f2.push(fo0)
        f2.push(fo1)
        f2.push(fo2)

        f2.push(fo0)
        f2.push(fo2)
        f2.push(fo3)
    }

    return {
        positions: v2,
        normals: n2,
        indices: f2,
    }
}
