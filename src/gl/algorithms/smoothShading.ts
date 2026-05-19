import { vec3 } from "gl-matrix"
import type { MeshData } from "./MeshData"


export function smoothShading(data: MeshData) {
    if (data.vcount === undefined) { throw Error('vcount == undefined') }
    if (data.xyz === undefined) { throw Error('xyz == undefined') }
    if (data.fxyz === undefined) { throw Error('fxyz == undefined') }

    const normal: number[] = new Array(data.xyz.length)
    normal.fill(0)

    const fcount: number[] = new Array(data.xyz.length / 3)
    fcount.fill(0)

    const fnormal: number[] = new Array(data.fxyz.length)
    for (let i = 0; i < fnormal.length; ++i) {
        fnormal[i] = data.fxyz[i]
    }

    const p0 = vec3.create(), p1 = vec3.create(), p2 = vec3.create(), u = vec3.create(), v = vec3.create(), n = vec3.create()

    for (let f = 0, i = 0, fn = 0; f < data.vcount.length; ++f, ++fn) {
        const c = data.vcount[f]
        if (c < 3) {
            throw Error('face must have at least 3 edges')
        }
        let i0 = data.fxyz[i] * 3
        let i1 = data.fxyz[i + 1] * 3
        let i2 = data.fxyz[i + 2] * 3

        vec3.set(p0, data.xyz[i0++], data.xyz[i0++], data.xyz[i0])
        vec3.set(p1, data.xyz[i1++], data.xyz[i1++], data.xyz[i1])
        vec3.set(p2, data.xyz[i2++], data.xyz[i2++], data.xyz[i2])

        vec3.subtract(u, p1, p0)
        vec3.subtract(v, p2, p0)
        vec3.cross(n, u, v)
        vec3.normalize(n, n)

        for (let j = 0; j < c; ++j, ++i) {
            let idx = data.fxyz[i]
            ++fcount[idx]
            idx *= 3
            normal[idx++] += n[0]
            normal[idx++] += n[1]
            normal[idx] += n[2]
        }
    }

    for (let i = 0, j = 0; i < fcount.length; ++i) {
        normal[j++] /= fcount[i]
        normal[j++] /= fcount[i]
        normal[j++] /= fcount[i]
    }

    data.normal = normal
    data.fnormal = fnormal
}
