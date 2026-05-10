import { decoupleXYZandUV } from "src/gl/algorithms/decoupleXYZandUV"
import { describe, expect, it } from "vitest"
import { fit } from "../../spec"

describe("decoupleXYZandUV()", function () {
    fit("without UV", function () {
        const vertex = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ])
        const fvertex = new Uint16Array([
            0, 1, 2,
            2, 3, 0
        ])
        const result = decoupleXYZandUV(vertex, fvertex)
        // console.log(result)
        expect(result.indices).to.deep.equal([
            0, 1, 2,
            2, 3, 0
        ])
        expect(result.xyz).to.deep.equal(vertex)
    })
    it("with UV", function () {
        const vertex = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ])
        const fvertex = new Uint16Array([
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
        const result = decoupleXYZandUV(vertex, fvertex, uv, fuv)
        // console.log(result)
        expect(result.indices).to.deep.equal([
            0, 1, 2,
            2, 3, 0
        ])
        expect(result.xyz).to.deep.equal(vertex)
        expect(result.uv).to.deep.equal(uv)
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
