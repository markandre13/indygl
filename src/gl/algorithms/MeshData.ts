import type { MeshSubset } from "src/gl/algorithms/MeshSubset"

export interface MeshData {
    /** 3d vertex coordinates */
    xyz?: ArrayLike<number>
    /** 2d texture coordinates */
    uv?: ArrayLike<number>
    /** 3d normals */
    normal?: ArrayLike<number>

    /** vertices per polygon */
    vcount?: ArrayLike<number>
    /** index into xyz */
    fxyz?: ArrayLike<number>
    /** index into uv */
    fuv?: ArrayLike<number>
    /** index into normal */
    fnormal?: ArrayLike<number>
 
    /** subsets as loaded from Wavefront Object files */
    groupSubset?: Map<string, MeshSubset>
    materialSubset?: Map<string, MeshSubset>
}
