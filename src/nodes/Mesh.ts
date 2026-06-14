import { IndexBuffer } from "../gl/buffers/IndexBuffer"
import { PositionBuffer } from "../gl/buffers/PositionBuffer"
import { triangulate } from "../gl/algorithms/triangulate"
import { decoupleXYZandUV, type MeshDataSingleIndex } from "../gl/algorithms/decoupleXYZandUV"
import { VertexBuffer } from "../gl/buffers/VertexBuffer"
import type { Material } from "./Material"
import { ModelUniform } from "../gl/buffers/ModelUniform"
import { smoothShading } from "src/gl/algorithms/smoothShading"
import type { MeshData } from "../gl/algorithms/MeshData"
import type { MeshSubset } from "src/gl/algorithms/MeshSubset"
import { edges } from "src/gl/algorithms/edges"
import { IndyNode } from "./IndyNode"
import type { XForm } from "./XForm"
import { vec3 } from "gl-matrix"

export class Mesh extends IndyNode implements MeshData {
    modelView: ModelUniform

    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normal?: ArrayLike<number>
    fnormal?: ArrayLike<number>
    groupSubset?: Map<string, MeshSubset>
    materialSubset?: Map<string, MeshSubset>
    // vertex groups
    // faces to material
    // sharp edges
    // ...

    constructor(parent: XForm, opt?: MeshData) {
        super(parent)

        this.modelView = new ModelUniform(this.context)

        this.xyz = opt?.xyz
        this.fxyz = opt?.fxyz
        this.uv = opt?.uv
        this.fuv = opt?.fuv
        this.vcount = opt?.vcount
        this.normal = opt?.normal
        this.fnormal = opt?.fnormal
        this.groupSubset = opt?.groupSubset
        this.materialSubset = opt?.materialSubset
    }

    protected _triangles?: MeshData
    protected _single_index?: MeshDataSingleIndex

    protected _indices?: IndexBuffer
    protected _edgeIndices?: IndexBuffer
    protected _points?: PositionBuffer
    protected _normals?: VertexBuffer
    protected _texcoords?: VertexBuffer

    material?: Material

    override get origin(): vec3 | undefined {
        const xyz = this.xyz!
        let i = 0
        let x = xyz[i++]
        let y = xyz[i++]
        let z = xyz[i++]
        let minx = x, maxx = x, miny = y, maxy = y, minz = z, maxz = z
        while (i < xyz.length) {
            x = xyz[i++]
            y = xyz[i++]
            z = xyz[i++]
            minx = Math.min(minx, x)
            maxx = Math.max(maxx, x)
            miny = Math.min(minx, y)
            maxy = Math.max(maxx, y)
            minz = Math.min(minx, z)
            maxz = Math.max(maxx, z)
        }

        const origin = vec3.fromValues((minx + maxx) / 2, (miny + maxy) / 2, (minz + maxz) / 2,)

        vec3.transformMat3(origin, origin, this.combined)

        // const origin = this.parent!.origin!
        // origin[0] += x
        // origin[1] += y
        // origin[2] += z

        return origin
    }

    /**
     * triangulate mesh and create unified index for rendering via WebGPU
     */
    protected prepare() {
        if (this.normal === undefined) {
            smoothShading(this)
        }
        if (this._triangles === undefined) {
            this._triangles = triangulate(this)
        }
        if (this._single_index === undefined) {
            this._single_index = decoupleXYZandUV(this._triangles)
        }
    }
    get indices() {
        this.prepare()
        if (this._indices === undefined) {
            this._indices = new IndexBuffer(this.context.device, this._single_index!.fxyz!)
        }
        return this._indices
    }
    get edgeIndices() {
        this.prepare()
        if (this._edgeIndices === undefined) {
            this._edgeIndices = new IndexBuffer(this.context.device, edges(this))
        }
        return this._edgeIndices
    }
    get points() {
        this.prepare()
        if (this._points === undefined) {
            this._points = new PositionBuffer(this.context.device, this._single_index!.xyz!)
        }
        return this._points
    }
    get normals() {
        this.prepare()
        if (this._normals === undefined) {
            this._normals = new VertexBuffer(this.context.device, this._single_index!.normal!)
        }
        return this._normals
    }
    get texcoords() {
        this.prepare()
        if (this._texcoords === undefined) {
            this._texcoords = new VertexBuffer(this.context.device, this._single_index!.uv!)
        }
        return this._texcoords
    }
    group(name: string) {
        this.prepare()
        return this._triangles?.groupSubset?.get(name)
    }
    mat(name: string) {
        this.prepare()
        return this._triangles?.materialSubset?.get(name)
    }
}

