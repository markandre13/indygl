import type { MeshData } from "./MeshData"

export interface MeshDataSingleIndex extends MeshData {
    xyzExtra?: number[]
    uvExtra?: number[]
    normalExtra?: number[]
}

const buffer = new Uint32Array(3)
const view = new Uint8Array(buffer.buffer)
function hashIndices(a: number | undefined, b: number | undefined, c: number | undefined) {
    buffer[0] = a ? a + 1 : 0
    buffer[1] = b ? b + 1 : 0
    buffer[2] = c ? c + 1 : 0
    return view.toBase64()
}

const debug = true

/**
 * WebGPU has only one list of indices, while Mesh has one for xyz, uv and normals each
 * 
 * NOTE: this thing also converts quads to triangles... we do not want that...
 *       that should be a step before running this function
 *       which also means that the triangulation would need to extend the fuv and fnormal arrays...
 *       this thing would also need to handle the sharp edges in the future...
 *       u-hu.... this is becoming rather complicated... need to collect all requirements...
 * @param xyz 
 * @param fxyz a list of quads
 * @param uv 
 * @param fuv 
 * @returns 
 */
export function decoupleXYZandUV(data: MeshData): MeshDataSingleIndex {
    if (!data.xyz || !data.fxyz) {
        throw Error('xyz and fxys must be defined')
    }
    if ((data.fuv !== undefined && data.uv === undefined) || (data.fuv === undefined && data.uv !== undefined)) {
        throw Error(`uv & fuv must both either be defined or undefined`)
    }
    if (data.fuv !== undefined && data.fxyz.length !== data.fuv.length) {
        throw Error(`fxyz and fuv must have the same length, instead it is ${data.fxyz.length} and ${data.fuv.length}`)
    }
    if ((data.fnormal !== undefined && data.normal === undefined) || (data.fnormal === undefined && data.normal !== undefined)) {
        throw Error(`normal & fnormal must both either be defined or undefined`)
    }
    if (data.fnormal !== undefined && data.fxyz.length !== data.fnormal.length) {
        throw Error(`fxyz and fnormal must have the same length, instead it is ${data.fxyz.length} and ${data.fnormal.length}`)
    }

    const uv2 = new Array<number>(data.xyz.length / 3 * 2)
    const normal2 = new Array<number>(data.xyz.length)

    const xyzOutExtra: number[] = []
    const uvOutExtra: number[] = []
    const normalOutExtra: number[] = []

    const used = new Array<number>(data.fxyz.length)
    // TODO: this tree might be too expensive... maybe use a map with a binary representation of the indices???
    const usedCombination = new Map<string, number>()
    let extraIndex = data.xyz!.length / 3
    
    function getIndex(idx: number) {

        let idxXYZ = data.fxyz![idx]
        const idxUV = data.fuv ? data.fuv[idx] : undefined
        const idxNormal = data.fnormal ? data.fnormal[idx] : undefined
        // console.log(`get index ${idxFace} -> ${idxXYZ}, ${idxUV}, ${idxNormal}`)

        const idx2 = used[idxXYZ]

        if (idx2 === undefined) {
            // debug && console.log(`first time, use ${idxXYZ}`)
            used[idxXYZ] = idx
            if (data.uv) {
                uv2[idxXYZ * 2] = data.uv[idxUV! * 2]
                uv2[idxXYZ * 2 + 1] = data.uv[idxUV! * 2 + 1]
            }
            if (data.normal) {
                normal2[idxXYZ * 3] = data.normal[idxNormal! * 3]
                normal2[idxXYZ * 3 + 1] = data.normal[idxNormal! * 3 + 1]
                normal2[idxXYZ * 3 + 2] = data.normal[idxNormal! * 3 + 2]
            }
            // console.log(`1st set ${idxXYZ}, ${idxUV}, ${idxNormal} -> ${idxXYZ}`)
            return idxXYZ
        }

        let idxXYZ2 = data.fxyz![idx2]
        const idxUV2 = data.fuv ? data.fuv[idx2] : undefined
        const idxNormal2 = data.fnormal ? data.fnormal[idx2] : undefined

        if (idxXYZ === idxXYZ2 && idxUV === idxUV2 && idxNormal === idxNormal2) {
            return idxXYZ
        }

        const hash = hashIndices(idxXYZ, idxUV, idxNormal)
        let usedIndex = usedCombination.get(hash)
        if (usedIndex !== undefined) {
            // console.log(`reuse ${idxXYZ}, ${idxUV}, ${idxNormal} -> ${usedIndex}`)
            return usedIndex
        }

        // debug && console.log(`collision, create copy at ${idxXYZ}`)
        xyzOutExtra.push(
            data.xyz![idxXYZ * 3],
            data.xyz![idxXYZ * 3 + 1],
            data.xyz![idxXYZ * 3 + 2],
        )
        if (data.uv) {
            uvOutExtra.push(
                data.uv[idxUV! * 2],
                data.uv[idxUV! * 2 + 1],
            )
        }
        if (data.normal) {
            normalOutExtra.push(
                data.normal[idxNormal! * 3],
                data.normal[idxNormal! * 3 + 1],
                data.normal[idxNormal! * 3 + 2],
            )
        }
        // console.log(`copy set ${idxXYZ}, ${idxUV}, ${idxNormal} -> ${extraIndex}`)
        idxXYZ = extraIndex
        extraIndex = extraIndex + 1

        usedCombination.set(hash, idxXYZ)
        return idxXYZ
    }

    let fxyz: number[] = []

    for (let i = 0; i < data.fxyz.length; ++i) {
        const newIndex = getIndex(i)
        // console.log(`add index ${i} -> ${newIndex}`)
        fxyz.push(newIndex)
    }

    const xyz = new Float32Array(data.xyz.length + xyzOutExtra.length)
    xyz.set(data.xyz)
    xyz.set(xyzOutExtra, data.xyz.length)

    let uv: Float32Array | undefined
    if (data.uv) {
        uv = new Float32Array(uv2.length + uvOutExtra.length)
        uv.set(uv2)
        uv.set(uvOutExtra, uv2.length)
    }

    let normal: Float32Array | undefined
    if (data.normal) {
        normal = new Float32Array(normal2.length + normalOutExtra.length)
        normal.set(normal2)
        normal.set(normalOutExtra, normal2.length)
    }

    return { fxyz, xyz, uv, normal }
}
