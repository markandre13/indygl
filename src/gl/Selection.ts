import { mat4, quat, vec3 } from 'gl-matrix'
import type { EditorModel } from 'src/editor/app/EditorModel'
import { bind } from 'src/editor/appkit/details/decorators/bind'
import type { IndyNode } from 'src/nodes/IndyNode'
import type { XForm } from 'src/nodes/XForm'
import { deg2rad } from './algorithms/deg2rad'
import { rad2deg } from './algorithms/rad2deg'

/**
 * Convert a quaternion to Euler angles in XYZ order (matching "sxyz").
 * This is used only for UI display; the quaternion is the source of truth.
 */
function quat2euler(q: quat): { x: number, y: number, z: number } {
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

export class Selection {
    model: EditorModel
    active?: IndyNode
    selected = new Set<IndyNode>();
    private rotationQuat = quat.create()
    private lastEuler = { x: 0, y: 0, z: 0 }

    constructor(model: EditorModel) {
        this.model = model
        model.transform.signal.add(this.transformActive)
    }

    /**
     * clear selection
     */
    clear() {
        this.active = undefined
        this.selected.clear()
    }

    /**
     * add node to selection and make it the active node
     *
     * @param node
     */
    add(node: IndyNode) {
        // TODO: edit the active node via the panel
        // HOW : make 'active' private, then everybody has to operate through the selection
        //       which keeps everything updated. the way the IndyNode does not have to become
        //       a 
        this.active = node
        this.selected.add(node)
        this.update()
    }

    /**
     * update the active
     *
     * Each Euler change in the UI is applied as a delta rotation around the
     * object's current LOCAL axis using a quaternion. This eliminates gimbal
     * lock: rotating X always rotates around the local X axis, rotating Z
     * always around the local Z axis, regardless of the current orientation.
     */
    @bind
    transformActive() {
        if (!this.active) {
            return
        }

        const x = this.model.transform.rotation.x.value.toNumber()
        const y = this.model.transform.rotation.y.value.toNumber()
        const z = this.model.transform.rotation.z.value.toNumber()

        // Compute deltas from last known Euler values
        const dx = x - this.lastEuler.x
        const dy = y - this.lastEuler.y
        const dz = z - this.lastEuler.z

        // Apply each delta as a local-axis rotation using axis-angle quaternions
        const qx = quat.setAxisAngle(quat.create(), [1, 0, 0], deg2rad(dx))
        const qy = quat.setAxisAngle(quat.create(), [0, 1, 0], deg2rad(dy))
        const qz = quat.setAxisAngle(quat.create(), [0, 0, 1], deg2rad(dz))

        quat.multiply(this.rotationQuat, this.rotationQuat, qx)
        quat.multiply(this.rotationQuat, this.rotationQuat, qy)
        quat.multiply(this.rotationQuat, this.rotationQuat, qz)
        quat.normalize(this.rotationQuat, this.rotationQuat)

        this.lastEuler = { x, y, z }

        // Build the TRS matrix from the accumulated quaternion
        const m = mat4.create()
        mat4.translate(m, m, this.model.transform.translation.value)
        const rotMat = mat4.fromQuat(mat4.create(), this.rotationQuat)
        mat4.mul(m, m, rotMat)

        const parent = this.active.parent as XForm
        parent.transform = m
        parent.dirty = true
    }

    /**
     * update EditorModel.transform
     *
     * @returns
     */
    update() {
        if (!this.active) {
            return
        }
        const node = this.active
        const parent = node.parent as XForm
        if (!parent.transform) {
            parent.transform = mat4.create()
        }
        const m = mat4.clone(parent.transform)!
        const pos = vec3.create() // extract the position
        vec3.transformMat4(pos, pos, m)
        this.model.transform.translation.value = pos

        // Extract the quaternion from the matrix (the source of truth)
        mat4.getRotation(this.rotationQuat, m)
        const e = quat2euler(this.rotationQuat)
        this.model.transform.rotation.x.value = rad2deg(e.x)
        this.model.transform.rotation.y.value = rad2deg(e.y)
        this.model.transform.rotation.z.value = rad2deg(e.z)

        // Read back (possibly clipped) values to keep lastEuler in sync
        this.lastEuler = {
            x: this.model.transform.rotation.x.value.toNumber(),
            y: this.model.transform.rotation.y.value.toNumber(),
            z: this.model.transform.rotation.z.value.toNumber()
        }
    }
}
