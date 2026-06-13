import { describe, expect, it } from "vitest"
import { mat4, vec3 } from "gl-matrix"
import { deg2rad } from "src/gl/algorithms/deg2rad"
import type { Size } from "src/gl/types/Size"
import { screen2pointInPlane, screen2world, setMat4Translation, world2screen } from "src/gl/algorithms/coordinates"

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
        const out = fromWorldToScreenAndBack(point, perspective, mat4.create(), canvas)
        // console.log(out ? vec3.str(out) : out)

        expect(point[0]).to.be.closeTo(out![0], 0.01)
        expect(point[1]).to.be.closeTo(out![1], 0.01)
        expect(point[2]).to.be.closeTo(out![2], 0.01)
    })

    it("3d to 2d to 3d (camera translate)", () => {
        const point = vec3.fromValues(3, 7, 10)

        const camera = mat4.create()
        mat4.translate(camera, camera, vec3.fromValues(1, 2, -5))

        const out = fromWorldToScreenAndBack(point, perspective, camera, canvas)

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

        const out = fromWorldToScreenAndBack(point, perspective, camera, canvas)
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

        const out = fromWorldToScreenAndBack(point, perspective, camera, canvas)
        // console.log(vec3.str(out))

        expect(point[0]).to.be.closeTo(out![0], 0.1)
        expect(point[1]).to.be.closeTo(out![1], 0.1)
        expect(point[2]).to.be.closeTo(out![2], 0.1)
    })

    it("set matrix to world coordinates", () => {
        const m = mat4.create()
        mat4.translate(m, m, vec3.fromValues(3, 5, 7))
        mat4.rotateX(m, m, deg2rad(10))
        mat4.rotateY(m, m, deg2rad(20))
        mat4.rotateZ(m, m, deg2rad(30))
        mat4.translate(m, m, vec3.fromValues(11, 13, 17))

        const point = vec3.fromValues(19, 23, 29)
        setMat4Translation(m, point)

        const out = vec3.create()
        vec3.transformMat4(out, out, m)
        expect(out[0]).to.be.closeTo(out![0], 19)
        expect(out[1]).to.be.closeTo(out![1], 23)
        expect(out[2]).to.be.closeTo(out![2], 29)
    })
})

function fromWorldToScreenAndBack(point: vec3, perspective: mat4, camera: mat4, canvas: Size) {
    const perspectiveCamera = mat4.multiply(mat4.create(), perspective, camera)
    const screen = world2screen(point, perspectiveCamera, canvas)
    return screen2pointInPlane(screen, point, perspective, camera, canvas)
}