import type { MeshSubset } from "src/gl/file/MeshSubset"


export interface MeshData {
    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normal?: ArrayLike<number>
    fnormal?: ArrayLike<number>
    groupSubset?: Map<string, MeshSubset>
    materialSubset?: Map<string, MeshSubset>
}
