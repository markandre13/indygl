import { IndexBuffer } from "./gl/buffers/IndexBuffer"
import { PositionBuffer } from "./gl/buffers/PositionBuffer"
import type { Texture } from "./gl/buffers/Texture"
import type { Device } from "./gl/Device"
import { triangulate } from "./gl/algorithms/triangulate"

export interface MeshData {
    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normals?: ArrayLike<number>
    fnormal?: ArrayLike<number>
}

export class Mesh implements MeshData {
    device: Device
    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normals?: ArrayLike<number>
    fnormal?: ArrayLike<number>
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
        this.fnormal = opt?.fnormal

        // to handle uv, normals or flat shading, we will need additional vertices
        // per default we assume flat shading, which requires the most memory, smooth shading will require the least memory
        // operations on the mesh should always be performed on the ... data

        // decouple is not the correct term

        // extend decoupleXYZandUV to handle normals

        // put decoupleXYZandUV and the data it generates into it's own class
    }

    get points() {
        if (this._points === undefined) {
            this._points = new PositionBuffer(this.device, this.xyz!)
        }
        return this._points
    }
    get indices() {
        if (this._indices === undefined) {
            this._indices = new IndexBuffer(this.device, triangulate(this).fxyz)
        }
        return this._indices
    }

}

export class Material {
    rgba?: ArrayLike<number>
    texture?: Texture
}
