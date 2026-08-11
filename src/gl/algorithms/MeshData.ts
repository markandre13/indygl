import type { MeshSubset } from "src/gl/algorithms/MeshSubset"


export interface MeshData {
    vcount?: ArrayLike<number>
    xyz?: ArrayLike<number>
    fxyz?: ArrayLike<number>
    uv?: ArrayLike<number>
    fuv?: ArrayLike<number>
    normal?: ArrayLike<number>
    fnormal?: ArrayLike<number>
    rgb?: ArrayLike<number>
    groupSubset?: Map<string, MeshSubset>
    materialSubset?: Map<string, MeshSubset>
}
