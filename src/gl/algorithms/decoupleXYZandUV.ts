interface GLXYZUV {
    idxExtra: number[]
    indices: number[]
    vertex: Float32Array
    texcoord?: Float32Array
}

/**
 * 
 * 
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
    fuv?: ArrayLike<number>
): GLXYZUV {
    if (fuv !== undefined && fxyz.length !== fuv.length) {
        throw Error(`fvertex and fuv must have the same length, instead it is ${fxyz.length} and ${fuv.length}`)
    }
    if (fuv !== undefined && uv === undefined) {
        throw Error(`uv & fuv must both be defined`)
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
        // const idxXYZ = fxyz[i]

        const idxXYZ = fxyz[idxFace]
        const idxUV = fuv![idxFace]

        const u = uv![idxUV * 2]
        const v = uv![idxUV * 2 + 1]

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

    // convert quad to triangle
    for (let i = 0; i < fxyz.length; i += 4) {
        const i0 = f(i)
        const i1 = f(i + 1)
        const i2 = f(i + 2)
        const i3 = f(i + 3)

        indices.push(i0)
        indices.push(i1)
        indices.push(i2)
        indices.push(i3)
        indices.push(i0)
        indices.push(i2)
    }

    if (fuv === undefined) {
        return {
            idxExtra: [],
            indices,
            vertex: new Float32Array(xyz),
            texcoord: undefined,
        }
    }

    const vertex = new Float32Array(xyz.length + xyzOutExtra.length)
    const texcoord = new Float32Array(uvOut.length + uvOutExtra.length)

    vertex.set(xyz)
    vertex.set(xyzOutExtra, xyz.length)
    texcoord.set(uvOut)
    texcoord.set(uvOutExtra, uvOut.length)

    return { indices, vertex, texcoord, idxExtra }
}
