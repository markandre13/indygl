interface GLXYZUV {
    /**
     * from where additional UV entries take their data
     */
    idxExtra: number[]

    /**
     * from where additional indices take their data
     */
    idxExtraNormals?: number[]

    indices: number[]
    xyz: Float32Array
    uv?: Float32Array
    normal?: Float32Array
}

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
export function decoupleXYZandUV(
    xyz: ArrayLike<number>,
    fxyz: ArrayLike<number>,
    uv?: ArrayLike<number>,
    fuv?: ArrayLike<number>,
    normal?: ArrayLike<number>,
    fnormal?: ArrayLike<number>
): GLXYZUV {
    if ((fuv !== undefined && uv === undefined) || (fuv === undefined && uv !== undefined)) {
        throw Error(`uv & fuv must both either be defined or undefined`)
    }
    if (fuv !== undefined && fxyz.length !== fuv.length) {
        throw Error(`fxyz and fuv must have the same length, instead it is ${fxyz.length} and ${fuv.length}`)
    }
    if ((fnormal !== undefined && normal === undefined) || (fnormal === undefined && normal !== undefined)) {
        throw Error(`normal & fnormal must both either be defined or undefined`)
    }
    if (fnormal !== undefined && fxyz.length !== fnormal.length) {
        throw Error(`fxyz and fnormal must have the same length, instead it is ${fxyz.length} and ${fnormal.length}`)
    }

    const indices: number[] = []
    const uvOut = new Array((xyz.length / 3) * 2) // for each vertex we have a texture coordinate

    const idxExtra: number[] = []
    const xyzOutExtra: number[] = []
    const uvOutExtra: number[] = []

    function getIndex(i: number) {
        return fxyz[i]
    }

    function decoupleXYZandUV(idxFace: number) {
        const idxXYZ = fxyz[idxFace]

        const idxUV = fuv![idxFace] * 2
        const u = uv![idxUV]
        const v = uv![idxUV + 1]

        // is this the 1st time the point is fetched?
        if (uvOut[idxXYZ * 2] === undefined) {
            // yes, enrich point xyz with uv end return index of point
            uvOut[idxXYZ * 2] = u
            uvOut[idxXYZ * 2 + 1] = v
            return idxXYZ
        }
        // has the point been fetched before and the u,v coordinates are the same? return it
        if (uvOut[idxXYZ * 2] === u && uvOut[idxXYZ * 2 + 1] === v) {
            return idxXYZ
        }

        // make a copy of point xyz with new uv coordinates
        const newIdxXYZ = (xyz.length + xyzOutExtra.length) / 3

        const idxXYZIn = idxXYZ * 3
        const x = xyz[idxXYZIn]
        const y = xyz[idxXYZIn + 1]
        const z = xyz[idxXYZIn + 2]

        idxExtra.push(idxXYZ)
        xyzOutExtra.push(x, y, z)
        uvOutExtra.push(u, v)

        return newIdxXYZ
    }

    let f
    if (fuv === undefined) {
        f = getIndex
    } else {
        f = decoupleXYZandUV
    }

    for (let i = 0; i < fxyz.length; ++i) {
        indices.push(f(i))
    }

    if (fuv === undefined) {
        return {
            idxExtra: [],
            indices,
            xyz: xyz instanceof Float32Array ? xyz : new Float32Array(xyz), 
            uv: undefined,
        }
    }

    const vertex = new Float32Array(xyz.length + xyzOutExtra.length)
    const texcoord = new Float32Array(uvOut.length + uvOutExtra.length)

    vertex.set(xyz)
    vertex.set(xyzOutExtra, xyz.length)
    texcoord.set(uvOut)
    texcoord.set(uvOutExtra, uvOut.length)

    return { indices, xyz: vertex, uv: texcoord, idxExtra }
}
