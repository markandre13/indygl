import { IndexBuffer } from "../gl/buffers/IndexBuffer"
import { PositionBuffer } from "../gl/buffers/PositionBuffer"
import { triangulate } from "../gl/algorithms/triangulate"
import { decoupleXYZandUV, type MeshDataSingleIndex } from "../gl/algorithms/decoupleXYZandUV"
import { VertexBuffer } from "../gl/buffers/VertexBuffer"
import type { mat4 } from "gl-matrix"
import type { Material } from "./Material"
import { ModelUniform } from "../gl/buffers/ModelUniform"
import type { Context } from "../gl/Context"
import type { MeshSubset } from "src/gl/file/MeshSubset"

export interface MeshData {
    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normal?: ArrayLike<number>
    fnormal?: ArrayLike<number>
    materialSubset?: MeshSubset[]
}

export class IndyNode {
    constructor(parent: IndyNode) {
        if (parent) {
            this.parent = parent
            this.context = parent.context
            parent.children.push(this)
        }
    }
    context!: Context
    parent?: IndyNode
    children: IndyNode[] = []
}

export class Root extends IndyNode {
    constructor(context: Context) {
        super(undefined as any)
        this.context = context
    }
}

export class XForm extends IndyNode {
    transform?: mat4
    dirty = true
}

export class Mesh extends IndyNode implements MeshData {
    modelView: ModelUniform

    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normal?: ArrayLike<number>
    fnormal?: ArrayLike<number>
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
    }

    protected _triangles?: MeshData
    protected _single_index?: MeshDataSingleIndex

    protected _indices?: IndexBuffer
    protected _points?: PositionBuffer
    protected _normals?: VertexBuffer

    material?: Material

    /**
     * triangulate mesh and create unified index for rendering via WebGPU
     */
    protected prepare() {
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

}

