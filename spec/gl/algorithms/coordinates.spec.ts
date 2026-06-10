import { describe, expect, it } from "vitest"
import { mat4, vec3, vec4 } from "gl-matrix"
import { deg2rad } from "src/gl/algorithms/deg2rad"
import type { Size } from "src/gl/types/Size"
import { intersectLineAndPlane } from "src/gl/algorithms/intersectLineAndPlane"
import { screen2pointInPlane, screen2world, world2screen } from "src/gl/algorithms/coordinates"

describe("world/screen coordinate system conversions", () => {
    const canvas = { width: 640, height: 480 }
    const fieldOfView = deg2rad(45)
    const aspect = canvas.width / canvas.height
    const zNear = 0.1
    const zFar = 100.0
    const perspective = mat4.perspectiveZO(mat4.create(), fieldOfView, aspect, zNear, zFar)

    it("world to screen (center)", () => {
        const point = vec3.fromValues(0, 0, 10)
        const screen = world2screen(point, perspective, canvas)
        expect(screen).to.deep.equal({ x: 320, y: 240 })
    })
    it("screen to world (center)", () => {
        const screen = screen2world({ x: 320, y: 240 }, perspective, canvas)
        expect(screen).to.deep.equal(vec3.fromValues(0, 0, -1))
    })
    it("3d to 2d to 3d", () => {
        const point = vec3.fromValues(3, 7, 10)
        const screen = world2screen(point, perspective, canvas)
        const world = screen2world(screen, perspective, canvas)

        const out = intersectLineAndPlane(
            vec3.create(), // out
            vec3.create(), // line origin
            world, // line direction
            vec3.fromValues(0, 0, point[2]), // plane origin
            vec3.fromValues(0, 0, 1) // plane normal
        )
        // console.log(out ? vec3.str(out) : out)

        expect(point[0]).to.be.closeTo(out![0], 0.01)
        expect(point[1]).to.be.closeTo(out![1], 0.01)
        expect(point[2]).to.be.closeTo(out![2], 0.01)
    })

    it("3d to 2d to 3d (camera translate)", () => {
        const point = vec3.fromValues(3, 7, 10)

        const camera = mat4.create()
        mat4.translate(camera, camera, vec3.fromValues(1, 2, -5))

        const out = doIt(point, perspective, camera, canvas)

        expect(point[0]).to.be.closeTo(out![0], 0.1)
        expect(point[1]).to.be.closeTo(out![1], 0.1)
        expect(point[2]).to.be.closeTo(out![2], 0.1)
    })

    it("3d to 2d to 3d (camera rotate)", () => {
        const point = vec3.fromValues(3, 7, 10)

        const camera = mat4.create()
        mat4.rotateX(camera, camera, deg2rad(10))
        mat4.rotateY(camera, camera, deg2rad(20))
        mat4.rotateZ(camera, camera, deg2rad(30))

        const out = doIt(point, perspective, camera, canvas)
        // console.log(out ? vec3.str(out) : out)

        expect(point[0]).to.be.closeTo(out![0], 0.1)
        expect(point[1]).to.be.closeTo(out![1], 0.1)
        expect(point[2]).to.be.closeTo(out![2], 0.1)
    })

    it("3d to 2d to 3d (camera translate and rotate)", () => {
        const point = vec3.fromValues(3, 7, 10)

        const camera = mat4.create()
        mat4.rotateX(camera, camera, deg2rad(10))
        mat4.rotateY(camera, camera, deg2rad(20))
        mat4.rotateZ(camera, camera, deg2rad(30))
        mat4.translate(camera, camera, vec3.fromValues(1, 2, -5))

        const out = doIt(point, perspective, camera, canvas)
        // console.log(vec3.str(out))

        expect(point[0]).to.be.closeTo(out![0], 0.1)
        expect(point[1]).to.be.closeTo(out![1], 0.1)
        expect(point[2]).to.be.closeTo(out![2], 0.1)
    })
})

function doIt(point: vec3, perspective: mat4, camera: mat4, canvas: Size) {
    const perspectiveCamera = mat4.multiply(mat4.create(), perspective, camera)
    const screen = world2screen(point, perspectiveCamera, canvas)
    return screen2pointInPlane(screen, point, perspective, camera, canvas)
}