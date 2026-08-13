import type { quat } from 'gl-matrix'

/**
 * Convert a quaternion to Euler angles in XYZ order (matching "sxyz").
 * This is used only for UI display; the quaternion is the source of truth.
 */
export function quat2euler(q: quat): { x: number; y: number; z: number}  {
    const x = q[0], y = q[1], z = q[2], w = q[3]
    const sinr_cosp = 2 * (w * x + y * z)
    const cosr_cosp = 1 - 2 * (x * x + y * y)
    const angX = Math.atan2(sinr_cosp, cosr_cosp)

    const sinp = 2 * (w * y - z * x)
    const angY = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp)

    const siny_cosp = 2 * (w * z + x * y)
    const cosy_cosp = 1 - 2 * (y * y + z * z)
    const angZ = Math.atan2(siny_cosp, cosy_cosp)

    return { x: angX, y: angY, z: angZ }
}
