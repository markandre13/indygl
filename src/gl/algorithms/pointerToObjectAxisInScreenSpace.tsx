import { mat4, vec3 } from "gl-matrix"
import { world2screen } from "../algorithms/coordinates"
import { nearestPointOnLine2D } from "../algorithms/nearestPointOnLine2D"
import type { Context } from "../Context"

/**
  * return a point in screen space which is close the object's axis given by _axis_
  *
  * @param pointer the pointer's position
  * @param transform the object's transform
  * @param axis the object's axis
  * @param context context to get perspective, camera and canvas
  * @returns
  */
export function pointerToObjectAxisInScreenSpace(ev: PointerEvent, transform: mat4, axis: vec3, context: Context) {
    const scene = context.sceneUniforms
    const m = mat4.mul(mat4.create(), scene.perspective, scene.camera)
    mat4.mul(m, m, transform)

    // axis as a line from p0 to p1
    const p0 = vec3.fromValues(0, 0, 0)
    const p1 = axis

    // map the line representing the axis into screen space
    const s0 = world2screen(p0, m, context.canvas)
    const s1 = world2screen(p1, m, context.canvas)

    // find the clostest point on screen
    return nearestPointOnLine2D(
        { x: ev.offsetX, y: ev.offsetY },
        s0,
        { x: s1.x - s0.x, y: s1.y - s0.y }
    ).p
}
