import { decoupleXYZandUV, type MeshDataSingleIndex } from "src/gl/algorithms/decoupleXYZandUV"
import { describe, expect, it } from "vitest"
import { fit } from "../../spec"
import type { MeshData } from "src/Mesh"
import { WavefrontObj } from "src/gl/file/WavefrontObj"
import { triangulate } from "src/gl/algorithms/triangulate"

describe("decoupleXYZandUV()", function () {
    it("without UV", function () {
        const xyz = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ])
        const fxyz = new Uint16Array([
            0, 1, 2,
            2, 3, 0
        ])
        const result = decoupleXYZandUV({ xyz, fxyz })
        // console.log(result)
        expect(result.fxyz).to.deep.equal([
            0, 1, 2,
            2, 3, 0
        ])
        expect(result.xyz).to.deep.equal(xyz)
    })
    it("with UV but no collision", function () {
        const xyz = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ])
        const fxyz = new Uint16Array([
            0, 1, 2,
            2, 3, 0
        ])
        const uv = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])
        const fuv = new Uint16Array([
            0, 1, 2,
            2, 3, 0
        ])
        const result = decoupleXYZandUV({ xyz, fxyz, uv, fuv })
        // console.log(result)
        expect(result.fxyz).to.deep.equal([
            0, 1, 2,
            2, 3, 0
        ])
        expect(result.xyz).to.deep.equal(xyz)
        expect(result.uv).to.deep.equal(uv)
    })
    it("with UV and collision", function () {
        const input = {
            xyz: [
                1, 2, 3,
                4, 5, 6,
                7, 8, 9,
                10, 11, 12
            ],
            fxyz: [
                0, 1, 2,
                2, 3, 0
            ],
            uv: [
                50, 51,
                52, 53,
                54, 55,
                56, 57,
                58, 59
            ],
            fuv: [
                0, 1, 2,
                4, 3, 0, // the 4 differs here
            ]
        }
        const output = decoupleXYZandUV(input)

        validateOutput(input, output)

        // implement a generic check for the result based on the input?

        // console.log(output)
        // expect(result.fxyz).to.deep.equal([
        //     0, 1, 2,
        //     2, 3, 0
        // ])
        // expect(result.xyz).to.deep.equal(xyz)
        // expect(result.uv).to.deep.equal(uv)
    })
    fit("regression", async () => {
        const filename = "obj/dodecahedron.obj"
        const r = await fetch(filename)
        if (!r.ok) {
            throw Error(`failed to load '${filename}': ${r.status} ${r.statusText}: ${await r.text()}`)
        }
        const obj = new WavefrontObj(filename, await r.text());
        (obj as any).uv = undefined;
        (obj as any).fuv = undefined; 
        const triangles = triangulate(obj)
        const a = decoupleXYZandUV(triangles)
        validateOutput(triangles, a)
    })
    // it("decouples vertex and uv", function () {
    //     //  0   2   4
    //     //
    //     //  1   3   5

    //     const vertex = new Float32Array([
    //         0, 0, 0,
    //         0, 1, 0,
    //         1, 0, 0,
    //         1, 1, 0,
    //         2, 0, 0,
    //         2, 1, 0,
    //     ])
    //     const fvertex = new Uint16Array([
    //         0, 2, 3, 1,
    //         2, 4, 5, 3,
    //     ])
    //     const uv = new Float32Array([
    //         0, 0,
    //         1, 0,
    //         1, 1,
    //         0, 1
    //     ])
    //     const fuv = new Uint16Array([
    //         0, 1, 2, 3,
    //         0, 1, 2, 3,
    //     ])
    //     const result = decoupleXYZandUV(vertex, fvertex, uv, fuv)

    //     const unpack: number[][] = []

    //     for (let i of result.indices) {
    //         // console.log(`${i}: ${result.vertex[i * 3]}, ${result.vertex[i * 3 + 1]}, ${result.vertex[i * 3 + 2]}; ${result.texcoord[i * 2]}, ${result.texcoord[i * 2 + 1]}`)
    //         unpack.push([
    //             result.xyz[i * 3], result.xyz[i * 3 + 1], result.xyz[i * 3 + 2],
    //             result.uv![i * 2], result.uv![i * 2 + 1]
    //         ])
    //     }

    //     expect(unpack).to.deep.equal([
    //         [0, 0, 0, 0, 0],
    //         [1, 0, 0, 1, 0],
    //         [1, 1, 0, 1, 1],

    //         [0, 1, 0, 0, 1],
    //         [0, 0, 0, 0, 0],
    //         [1, 1, 0, 1, 1],

    //         [1, 0, 0, 0, 0],
    //         [2, 0, 0, 1, 0],
    //         [2, 1, 0, 1, 1],

    //         [1, 1, 0, 0, 1],
    //         [1, 0, 0, 0, 0],
    //         [2, 1, 0, 1, 1],
    //     ])
    // })
})

function arr(a: ArrayLike<number> | undefined) {
    if (a === undefined) {
        return 'undefined'
    }
    return "[ " + Array.from(a).join(", ") + " ]"
}

function dumpMeshData(output: MeshDataSingleIndex) {
    console.log(`{
  fxyz       : ${arr(output.fxyz)},
  xyz        : ${arr(output.xyz)},
  uv         : ${arr(output.uv)},
  normal     : ${arr(output.normal)},
  xyzExtra   : ${arr(output.xyzExtra)},
  uvExtra    : ${arr(output.uvExtra)},
  normalExtra: ${arr(output.normalExtra)},
}`)
}

function validateOutput(input: MeshData, output: MeshDataSingleIndex) {
    dumpMeshData(input)
    dumpMeshData(output)

    for (let i = 0; i < output.fxyz!.length; ++i) {
        const fxyz = input.fxyz![i]
        const outIndex = output.fxyz![i]

        const inXYZ = [
            input.xyz![fxyz * 3],
            input.xyz![fxyz * 3 + 1],
            input.xyz![fxyz * 3 + 2]
        ]
        const outXYZ = [
            output.xyz![outIndex * 3],
            output.xyz![outIndex * 3 + 1],
            output.xyz![outIndex * 3 + 2],
        ]
        expect(outXYZ).to.deep.equal(inXYZ)

        if (input.fuv) {
            const fuv = input.fuv[i]
            const inUV = [
                input.uv![fuv * 2],
                input.uv![fuv * 2 + 1],
            ]
            const outUV = [
                output.uv![outIndex * 2],
                output.uv![outIndex * 2 + 1],
            ]
            expect(outUV).to.deep.equal(inUV)
        }
    }
}
