import { IndexBuffer } from "./gl/buffers/IndexBuffer"
import { PositionBuffer } from "./gl/buffers/PositionBuffer"
import type { Device } from "./gl/Device"
import { triangulate } from "./gl/algorithms/triangulate"
import { decoupleXYZandUV, type MeshDataSingleIndex } from "./gl/algorithms/decoupleXYZandUV"
import { VertexBuffer } from "./gl/buffers/VertexBuffer"
import type { mat4 } from "gl-matrix"
import type { Material } from "./Material"

export interface MeshData {
    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normal?: ArrayLike<number>
    fnormal?: ArrayLike<number>
}

export class IndyNode {
    constructor(parent: IndyNode) {
        if (parent) {
            this.parent = parent
            this.device = parent.device
            parent.children.push(this)
        }
    }
    device!: Device
    parent?: IndyNode
    children: IndyNode[] = []
}

export class Root extends IndyNode {
    constructor(device: Device) {
        super(undefined as any)
        this.device = device
    }
}

export class XForm extends IndyNode {
    transform?: mat4
}

export class Mesh extends IndyNode implements MeshData {
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
        this.xyz = opt?.xyz
        this.fxyz = opt?.fxyz
        this.uv = opt?.uv
        this.fuv = opt?.fuv
        this.vcount = opt?.vcount
        this.normal = opt?.normal
        this.fnormal = opt?.fnormal

        // to handle uv, normals or flat shading, we will need additional vertices
        // per default we assume flat shading, which requires the most memory, smooth shading will require the least memory
        // operations on the mesh should always be performed on the ... data

        // decouple is not the correct term

        // extend decoupleXYZandUV to handle normals

        // put decoupleXYZandUV and the data it generates into it's own class
    }

    protected _triangles?: MeshData
    protected _single_index?: MeshDataSingleIndex

    protected _indices?: IndexBuffer
    protected _points?: PositionBuffer
    protected _normals?: VertexBuffer

    material?: Material
    // get rgba(): number[] {
    //     return this.material ? this.material.rgba : [0.8, 0.8, 0.8, 1]
    // }

    get indices() {
        if (this._triangles === undefined) {
            this._triangles = triangulate(this)
        }
        if (this._single_index === undefined) {
            this._single_index = decoupleXYZandUV(this._triangles)
        }
        if (this._indices === undefined) {
            this._indices = new IndexBuffer(this.device, this._single_index.fxyz!)
        }
        return this._indices
    }
    get points() {
        if (this._triangles === undefined) {
            this._triangles = triangulate(this)
        }
        if (this._single_index === undefined) {
            this._single_index = decoupleXYZandUV(this._triangles)
        }
        if (this._points === undefined) {
            this._points = new PositionBuffer(this.device, this._single_index.xyz!)
        }
        return this._points
    }
    get normals() {
        if (this._triangles === undefined) {
            this._triangles = triangulate(this)
        }
        if (this._single_index === undefined) {
            this._single_index = decoupleXYZandUV(this._triangles)
        }
        if (this._normals === undefined) {
            this._normals = new VertexBuffer(this.device, this._single_index.normal!)
        }
        return this._normals
    }

}

