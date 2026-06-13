import { describe, expect, it } from "vitest"
import { vec3 } from "gl-matrix"
import { intersectLineAndPlane } from "src/gl/algorithms/intersectLineAndPlane"

describe("intersectLineAndPlane", () => {
    it("line through plane at right angle", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(0, 0, -5), // l0
            vec3.fromValues(0, 0, 1),  // l (direction along Z)
            vec3.fromValues(0, 0, 0),  // p0 (plane at origin)
            vec3.fromValues(0, 0, 1),  // n (normal along Z)
        )!
        expect(out).not.to.be.null
        expect(out).not.to.be.undefined
        expect(out[0]).to.equal(0)
        expect(out[1]).to.equal(0)
        expect(out[2]).to.equal(0)
    })

    it("line through plane at an angle", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(1, 2, -5), // l0
            vec3.fromValues(1, 0, 2),  // l (direction)
            vec3.fromValues(0, 0, 0),  // p0 (plane at origin)
            vec3.fromValues(0, 0, 1),  // n (normal along Z)
        )!
        expect(out).not.to.be.null
        expect(out).not.to.be.undefined
        expect(out[0]).to.be.closeTo(3.5, 0.001)
        expect(out[1]).to.be.closeTo(2, 0.001)
        expect(out[2]).to.equal(0)
    })

    it("line parallel to plane (no intersection)", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(0, 0, -5),
            vec3.fromValues(1, 0, 0),  // parallel to XY plane
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 0, 1),  // normal = Z
        )
        expect(out).to.be.null
    })

    it("line lying on the plane", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(1, 2, 0),  // on plane Z=0
            vec3.fromValues(1, 1, 0),  // parallel to plane
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 0, 1),
        )
        expect(out).to.be.undefined
    })

    it("line starting on the plane", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(3, 5, 0),  // l0 is on the plane
            vec3.fromValues(1, 0, 1),  // direction off the plane
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 0, 1),
        )!
        expect(out).not.to.be.null
        expect(out).not.to.be.undefined
        expect(out[0]).to.equal(3)
        expect(out[1]).to.equal(5)
        expect(out[2]).to.equal(0)
    })

    it("plane not at origin", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(0, 0, 0),  // l0 at origin
            vec3.fromValues(0, 0, 1),  // along Z
            vec3.fromValues(0, 0, 10), // p0 at Z=10
            vec3.fromValues(0, 0, 1),  // normal along Z
        )!
        expect(out).not.to.be.null
        expect(out).not.to.be.undefined
        expect(out[0]).to.equal(0)
        expect(out[1]).to.equal(0)
        expect(out[2]).to.equal(10)
    })

    it("negative direction towards plane", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(0, 0, 5),   // l0 at Z=5
            vec3.fromValues(0, 0, -1),  // direction -Z
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 0, 1),
        )!
        expect(out).not.to.be.null
        expect(out).not.to.be.undefined
        expect(out[0]).to.equal(0)
        expect(out[1]).to.equal(0)
        expect(out[2]).to.equal(0)
    })

    it("non-orthogonal normal", () => {
        const out = intersectLineAndPlane(
            vec3.create(),
            vec3.fromValues(0, 0, -10),
            vec3.fromValues(0, 0, 1),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 1),  // normal at 45deg to Z
        )!
        expect(out).not.to.be.null
        expect(out).not.to.be.undefined
        // plane: y + z = 0, line: (0,0,-10) + t*(0,0,1) -> (0,0,-10+t)
        // 0 + (-10+t) = 0 => t = 10 => z = 0
        expect(out[0]).to.equal(0)
        expect(out[1]).to.equal(0)
        expect(out[2]).to.equal(0)
    })

    it("writes result into out parameter", () => {
        const out = vec3.fromValues(999, 999, 999)
        const result = intersectLineAndPlane(
            out,
            vec3.fromValues(0, 0, -5),
            vec3.fromValues(0, 0, 1),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 0, 1),
        )
        expect(result).to.equal(out)  // same reference
        expect(out[0]).to.equal(0)
        expect(out[1]).to.equal(0)
        expect(out[2]).to.equal(0)
    })
})
