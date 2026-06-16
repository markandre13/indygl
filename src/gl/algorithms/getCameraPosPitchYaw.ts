import { mat4, vec3 } from 'gl-matrix'
import { matrix2euler } from '../algorithms/euler'

export interface PPY {
    pos: vec3
    pitch: number
    yaw: number
}

/**
 * extract real word camera postion, pitch (up/down) and yaw (left/right) from
 * OpenGL/WebGPU camera
 *
 * @param glCamera
 * @returns
 */
export function getCameraPosPitchYaw(glCamera: mat4): PPY {
    const camera = mat4.invert(mat4.create(), glCamera)! // OpenGL/WebGPU cam to world cam

    const cameraPos = vec3.create() // extract the position
    vec3.transformMat4(cameraPos, cameraPos, camera)

    const e = matrix2euler(camera)
    // console.log(`${rad2deg(e.x)}, ${rad2deg(e.y)}, ${rad2deg(e.z)}`)
    let pitch = e.x
    let yaw = -e.y

    if (pitch >= Math.PI / 2) {
        pitch -= Math.PI
        yaw = Math.PI - yaw
    }

    if (pitch <= -Math.PI / 2) {
        pitch += Math.PI
        yaw = Math.PI - yaw
    }

    return { pos: cameraPos, pitch, yaw }
}
