import { mat4, vec3 } from 'gl-matrix'
import type { PPY } from './camera2PosPitchYaw'

export function posPitchYay2Camera(ppy: PPY): mat4 {
    let pitch = ppy.pitch
    let yaw = ppy.yaw - Math.PI / 2
    const direction = vec3.fromValues(
        Math.cos(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.sin(yaw) * Math.cos(pitch)
    )
    const cameraFront = vec3.normalize(vec3.create(), direction)
    const cameraUp = vec3.fromValues(0, 1, 0)
    const m = mat4.lookAt(mat4.create(),
        ppy.pos, // eye
        vec3.add(vec3.create(), ppy.pos, cameraFront), // focal point
        cameraUp // up
    )
    return m
}
