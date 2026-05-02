import { RotationUnit } from "src/editor/appkit/units/RotationModel"
import { deg2rad } from "src/gl/algorithms/deg2rad"
import { rad2deg } from "src/gl/algorithms/rad2deg"
import { describe, expect, it } from "vitest"

describe("units", () => {
    describe("rotation", () => {
        it("foo", () => {
            // console.log(rad2deg(Math.PI / 4))
            // console.log(deg2rad(45) * RotationUnit.symbol2scale.get("r")!.toNumber())
            console.log()

            // expect(RotationUnit.symbol2scale.get("d")?.toNumber()).to.equal(rad2deg(Math.PI / 180.0))
            // console.log(RotationUnit.symbol2scale.get("d"))
            // console.log(RotationUnit.symbol2scale.get("r"))
        })
    })
})