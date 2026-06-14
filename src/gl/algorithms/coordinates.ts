import { mat4, vec3, vec4, type ReadonlyVec3 } from "gl-matrix"
import type { Size } from "../types/Size"
import type { Point } from "../types/Point"
import { intersectLineAndPlane } from "./intersectLineAndPlane"

/**
 * transform a point from 3d world space to 2d screen coordinates as WebGPU does
 * 
 * can be used to place additional html elements in the overlay HTML element,
 * which overlays the WebGPU canvas.
 * 
 * @param world point in world coordinates
 * @param m projection [ * camera [ * modelview ] ]
 * @param canvas screen size
 */
export function world2screen(world: vec3, m: mat4, canvas: Size): Point {
    const point = vec4.fromValues(world[0], world[1], world[2], 1)

    // 3d world to 3d clipspace
    const clipspace = vec4.transformMat4(vec4.create(), point, m)

    // 3d clip space to 2d clip space
    clipspace[0] /= clipspace[3]
    clipspace[1] /= clipspace[3]

    // 2d clipspace to screen
    const x = (clipspace[0] * 0.5 + 0.5) * canvas.width
    const y = (clipspace[1] * -0.5 + 0.5) * canvas.height
    return { x, y }
}

/**
 * 
 * @param screen 
 * @param m 
 * @param canvas 
 * @returns a vector pointing from (0,0,0)
 */
export function screen2world(screen: Point, m: mat4, canvas: Size) {
    // screen to 2d clipspace
    let clipspaceX = screen.x / canvas.width * 2 - 1
    let clipspaceY = screen.y / canvas.height * -2 + 1

    // 2d clipspace to 3d clipspace (since we do not know the depth, use z = 0 and z = 1)
    const point0 = vec4.fromValues(0, 0, 0, 1)
    const point1 = vec4.fromValues(clipspaceX, clipspaceY, 1, 1)

    // 3d clipspace to 3d world
    const iprov = mat4.invert(mat4.create(), m)
    if (iprov === null) { throw Error(`can't invert`) }
    vec4.transformMat4(point0, point0, iprov)
    vec4.transformMat4(point1, point1, iprov)

    point0[0] /= point0[3]
    point0[1] /= point0[3]
    point0[2] /= point0[3]

    point1[0] /= point1[3]
    point1[1] /= point1[3]
    point1[2] /= point1[3]

    // console.log(`line through
    // ${vec4.str(point0)}
    // ${vec4.str(point1)}`)

    vec4.sub(point1, point1, point0)

    const result = vec3.fromValues(point1[0], point1[1], point1[2])
    vec3.normalize(result, result)
    return result
}

export function screen2pointInPlane(screen: Point, point: vec3, perspective: mat4, camera: mat4, pn: vec3, canvas: Size) {
    const perspectiveCamera = mat4.multiply(mat4.create(), perspective, camera)
    const camMat = mat4.invert(mat4.create(), camera)!

    const world = screen2world(screen, perspectiveCamera, canvas)

    // in WebGPU/OpenGL, the camera is always at (0, 0, 0) and the camera
    // matrix is moving the world around the camera. to have a matrix that
    // moves us to the actual camera position in 3d space, we have to invert
    // the camera matrix
    const camPos = mat4.getTranslation(vec3.create(), camMat)
    const out = intersectLineAndPlane(
        vec3.create(), // out
        camPos,        // line origin = camera position in world space
        world,         // line direction
        point,         // plane origin = world-space point
        pn             // plane normal = view direction in world space
    )!

    return out
}

export function setMat4Translation(m: mat4, pos: ReadonlyVec3) {
    m[12] = pos[0]
    m[13] = pos[1]
    m[14] = pos[2]
}