// TODO: move into gl/algorithms/

import { mat4, vec3 } from "gl-matrix"
import type { MeshData } from "./MeshData"
import { isZero } from "./isZero"
import earcut from "earcut"
import type { MeshSubset } from "../file/MeshSubset"

function windingIsClockWise(i0: number, i1: number, i2: number) {
    return (i0 < i1 ? 1 : 0) + (i1 < i2 ? 1 : 0) + (i2 < i0 ? 1 : 0) == 2
}

/**
 * triangulate the polygons of the mesh by creating extended versions of fxyz, fuv and fnormal
 * 
 * todo: mapping between old and new indicies in case subsets are to be rendered, editing, etc.
 */
export function triangulate(data: MeshData): MeshData {
    if (!data.xyz || !data.fxyz || !data.vcount) {
        throw Error()
    }

    let fxyz: number[] = []
    let fuv: number[] | undefined
    if (data.fuv) { fuv = [] }
    let fnormal: number[] | undefined
    if (data.fnormal) { fnormal = [] }

    const map = new Map<number, number>()

    const v = vec3.create()

    let fp = 0
    for (let i = 0; i < data.vcount.length; ++i) {
        const n = data.vcount[i]
        if (n < 3) {
            continue
        }
        map.set(fp, fxyz.length)
        if (n === 3) {
            for (let j = 0; j < n; ++j) {
                fxyz.push(data.fxyz[fp])
                if (data.fuv) { fuv!.push(data.fuv[fp]) }
                if (data.fnormal) { fnormal!.push(data.fnormal[fp]) }
                ++fp
            }
            continue
        }
        // get the first three points of the polygon
        let idx: number
        idx = data.fxyz[fp] * 3
        const v0 = vec3.fromValues(data.xyz[idx], data.xyz[++idx], data.xyz[++idx])
        idx = data.fxyz[fp + 1] * 3
        const v1 = vec3.fromValues(data.xyz[idx], data.xyz[++idx], data.xyz[++idx])
        idx = data.fxyz[fp + 2] * 3
        const v2 = vec3.fromValues(data.xyz[idx], data.xyz[++idx], data.xyz[++idx])

        // v0 := polygon's normal
        vec3.sub(v1, v1, v0)
        vec3.sub(v2, v2, v0)

        vec3.normalize(v1, v1)
        vec3.normalize(v2, v2)

        vec3.cross(v0, v2, v1)
        vec3.normalize(v0, v0)

        // rotate polygon so that it's normal is (0, 0, 1)
        const given_normal = v0
        const desired_normal = vec3.fromValues(0, 0, 1)

        const axis = vec3.cross(vec3.create(), given_normal, desired_normal)

        // the triangulation algorithms works on 2d polygons
        const xy = new Array<number>(n * 2)
        // to map the indices of the 2d polygon back to the mesh indices
        const fxyzBack = new Array<number>(n)
        const fuvBack = new Array<number>(n)
        const fnormalBack = new Array<number>(n)

        if (isZero(vec3.squaredLength(axis))) {
            // console.log("no rotate")
            for (let j = 0, co = 0; j < n; ++j, ++fp) {
                if (data.fuv) { fuvBack[j] = data.fuv[fp] }
                if (data.fnormal) { fnormalBack[j] = data.fnormal[fp] }
                let k = data.fxyz[fp]
                fxyzBack[j] = k
                k *= 3
                xy[co++] = data.xyz[k]
                xy[co++] = data.xyz[++k]
            }
        } else {
            // console.log("rotate")
            const angle = Math.acos(vec3.dot(given_normal, desired_normal))
            const r = mat4.fromRotation(mat4.create(), angle, axis)
            for (let j = 0, co = 0; j < n; ++j, ++fp) {
                if (data.fuv) { fuvBack[j] = data.fuv[fp] }
                if (data.fnormal) { fnormalBack[j] = data.fnormal[fp] }
                let k = data.fxyz[fp]
                fxyzBack[j] = k
                k *= 3
                vec3.set(v, data.xyz[k], data.xyz[++k], data.xyz[++k])
                vec3.transformMat4(v, v, r)
                xy[co++] = v[0]
                xy[co++] = v[1]
            }
        }

        let triangles = earcut(xy, undefined, 2)

        // console.log(JSON.stringify(triangles))
        // for (let i = 0; i < triangles.length;) {
        //     const i0 = triangles[i++]
        //     const i1 = triangles[i++]
        //     const i2 = triangles[i++]
        //     if (windingIsClockWise(i0, i1, i2)) {
        //         indices.push(back[i0], back[i1], back[i2])
        //     } else {
        //         indices.push(back[i2], back[i1], back[i0])
        //     }
        // }

        const winding = windingIsClockWise(triangles[0], triangles[1], triangles[2])
        if (!winding) {
            triangles = triangles.reverse()
        }
        // console.log(triangles)
        fxyz.push(...triangles.map(it => fxyzBack[it]))
        if (data.fuv) { fuv!.push(...triangles.map(it => fuvBack[it])) }
        if (data.fnormal) { fnormal!.push(...triangles.map(it => fnormalBack[it])) }

        // console.log(`polygon with ${n} edges triangulated to ${triangles.length / 3} triangles`)
        // indices.push(...triangles.map(it => back[it]))
    }
    map.set(fp, fxyz.length)

    let groupSubset: Map<string, MeshSubset> | undefined
    if (data.groupSubset) {
        groupSubset = new Map()
        for(const [name, r] of data.groupSubset) {
            const start = map.get(r.start)!
            const end = map.get(r.start + r.length)
            if (start === undefined || end === undefined) {
                throw Error(`yikes: groupSubset '${name}' start, length don't match face positions`)
            }
            groupSubset.set(name, {start, length: end - start})
        }
    }

    let materialSubset: Map<string, MeshSubset> | undefined
    if (data.materialSubset) {
        materialSubset = new Map()
        for(const [name, r] of data.materialSubset) {
            const start = map.get(r.start)!
            const end = map.get(r.start + r.length)
            if (start === undefined || end === undefined) {
                throw Error(`yikes: materialSubset '${name}' start, length don't match face positions`)
            }
            materialSubset.set(name, {start, length: end - start})
        }
    }


    // console.log(`triangulated size = ${indices.length}`)
    return {
        xyz: data.xyz,
        fxyz,
        uv: data.uv,
        fuv,
        normal: data.normal,
        fnormal,
        groupSubset,
        materialSubset
    }
}
