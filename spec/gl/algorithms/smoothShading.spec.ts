import { smoothShading } from "src/gl/algorithms/smoothShading"
import { WavefrontObj } from "src/gl/file/WavefrontObj"
import { describe, expect, it } from "vitest"

describe("smoothShading(data: MeshData)", () => {
    it("sets normal and fnormal", async () => {
        const r = await fetch("obj/cube.obj")
        const cube = new WavefrontObj("cube.obj", await r.text())
        smoothShading(cube)
        // console.log(`fnormal = ${cube.fnormal.join(", ")}`)
        // console.log(`normal = ${cube.normal.join(", ")}`)
        expect(cube.fnormal).to.deep.equal(cube.fxyz)
        expect(cube.normal).to.deep.equal([
            0.3333333333333333, 0.3333333333333333, -0.3333333333333333,
            0.3333333333333333, -0.3333333333333333, -0.3333333333333333,
            0.3333333333333333, 0.3333333333333333, 0.3333333333333333,
            0.3333333333333333, -0.3333333333333333, 0.3333333333333333,
            -0.3333333333333333, 0.3333333333333333, -0.3333333333333333,
            -0.3333333333333333, -0.3333333333333333, -0.3333333333333333,
            -0.3333333333333333, 0.3333333333333333, 0.3333333333333333,
            -0.3333333333333333, -0.3333333333333333, 0.3333333333333333
        ])
    })
})