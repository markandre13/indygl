import { flatShading } from "src/gl/algorithms/flatShading"
import { WavefrontObj } from "src/gl/file/WavefrontObj"
import { describe, expect, it } from "vitest"

describe("flatShading(data: MeshData)", () => {
    it("sets normal and fnormal", async () => {
        const r = await fetch("obj/mh/cube.obj")
        const cube = new WavefrontObj("cube.obj", await r.text())
        flatShading(cube)
        // console.log(`fnormal = ${cube.fnormal.join(", ")}`)
        // console.log(`normal = ${cube.normal.join(", ")}`)
        expect(cube.fnormal).to.deep.equal([
            0, 0, 0, 0,
            1, 1, 1, 1,
            2, 2, 2, 2,
            3, 3, 3, 3,
            4, 4, 4, 4,
            5, 5, 5, 5
        ])
        expect(cube.normal).to.deep.equal([
            0, 0, 1, 
            0, 0, -1, 
            0, 1, 0, 
            0, -1, 0, 
            1, 0, 0, 
            -1, 0, 0
        ])
    })
})