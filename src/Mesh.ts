import earcut from "earcut"
import { IndexBuffer } from "./gl/buffers/IndexBuffer"
import { PositionBuffer } from "./gl/buffers/PositionBuffer"
import type { Texture } from "./gl/buffers/Texture"
import type { Device } from "./gl/Device"
import { mat4, vec3 } from "gl-matrix"
import { isZero } from "./gl/algorithms/isZero"

export interface MeshData {
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    vcount?: ArrayLike<number>
    normals?: ArrayLike<number>
}

export class Mesh {
    device: Device
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    vcount?: ArrayLike<number>
    normals?: ArrayLike<number>
    // vertex groups
    // faces to material
    // sharp edges
    // ...

    _points?: PositionBuffer
    _indices?: IndexBuffer

    constructor(device: Device, opt?: MeshData) {
        this.device = device
        this.xyz = opt?.xyz
        this.fxyz = opt?.fxyz
        this.uv = opt?.uv
        this.fuv = opt?.fuv
        this.vcount = opt?.vcount
        this.normals = opt?.normals
    }

    get points() {
        if (this._points === undefined) {
            this._points = new PositionBuffer(this.device, this.xyz!)
        }
        return this._points
    }
    get indices() {
        if (this._indices === undefined) {
            this._indices = new IndexBuffer(this.device, this.triangulate())
        }
        return this._indices
    }

    triangulate() {
        let indices: number[] = []

        if (!this.xyz || !this.fxyz || !this.vcount) {
            throw Error()
        }
        const v = vec3.create()

        let fp = 0
        for (let i = 0; i < this.vcount.length; ++i) {
            const n = this.vcount[i]
            if (n < 3) {
                continue
            }
            if (n === 3) {
                indices.push(this.fxyz[fp++])
                indices.push(this.fxyz[fp++])
                indices.push(this.fxyz[fp++])
                continue
            }
            if (n === 4) {
                indices.push(this.fxyz[fp])
                indices.push(this.fxyz[fp + 1])
                indices.push(this.fxyz[fp + 2])

                indices.push(this.fxyz[fp + 2])
                indices.push(this.fxyz[fp + 3])
                indices.push(this.fxyz[fp])
                fp += 4
                continue
            }

            // the triangulation algorithms works on 2d polygons
            const xy = new Array<number>(n * 2)
            // to map the indices of the 2d polygon back to the mesh indices
            const back = new Array<number>(n) // TODO: the back array isn't covered by tests yet

            // get the first three points of the polygon
            let idx: number
            idx = this.fxyz[fp] * 3
            const v0 = vec3.fromValues(this.xyz[idx], this.xyz[++idx], this.xyz[++idx])
            idx = this.fxyz[fp + 1] * 3
            const v1 = vec3.fromValues(this.xyz[idx], this.xyz[++idx], this.xyz[++idx])
            idx = this.fxyz[fp + 2] * 3
            const v2 = vec3.fromValues(this.xyz[idx], this.xyz[++idx], this.xyz[++idx])

            vec3.sub(v1, v1, v0)
            vec3.sub(v2, v2, v0)

            vec3.normalize(v1, v1)
            vec3.normalize(v2, v2)

            vec3.cross(v0, v2, v1)
            vec3.normalize(v0, v0)

            const given_normal = v0
            const desired_normal = vec3.fromValues(0, 0, 1)

            const axis = vec3.cross(vec3.create(), given_normal, desired_normal)

            if (isZero(vec3.squaredLength(axis))) {
                // console.log("no rotate")
                for (let j = 0, co = 0; j < n; ++j) {
                    let k = this.fxyz[fp++]
                    back[j] = k
                    k *= 3
                    xy[co++] = this.xyz[k]
                    xy[co++] = this.xyz[++k]
                }
            } else {
                // console.log("rotate")
                const angle = Math.acos(vec3.dot(given_normal, desired_normal))

                const r = mat4.fromRotation(mat4.create(), angle, axis)

                for (let j = 0, co = 0; j < n; ++j) {
                    let k = this.fxyz[fp++]
                    back[j] = k
                    k *= 3
                    vec3.set(v, this.xyz[k], this.xyz[++k], this.xyz[++k])
                    vec3.transformMat4(v, v, r)
                    xy[co++] = v[0]
                    xy[co++] = v[1]
                }
            }

            let triangles = earcut(xy, undefined, 2)

            function windingIsClockWise(i0: number, i1: number, i2: number) {
                return (i0 < i1 ? 1 : 0) + (i1 < i2 ? 1 : 0) + (i2 < i0 ? 1 : 0) == 2
            }

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

            // triangles = triangles.map(it => back[it])
            if (windingIsClockWise(triangles[0], triangles[1], triangles[2])) {
                indices.push(...triangles.map(it => back[it]))
            } else {
                indices.push(...triangles.reverse().map(it => back[it]))
            }
            console.log(`polygon with ${n} edges triangulated to ${triangles.length/3} triangles`)
            // indices.push(...triangles.map(it => back[it]))
        }
        // console.log(`triangulated size = ${indices.length}`)
        return indices
    }
}

export class Material {
    rgba?: ArrayLike<number>
    texture?: Texture
}
