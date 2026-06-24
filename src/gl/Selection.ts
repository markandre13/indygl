import { mat4, quat, vec3 } from 'gl-matrix'
import type { EditorModel } from 'src/editor/app/EditorModel'
import { bind } from 'src/editor/appkit/details/decorators/bind'
import type { IndyNode } from 'src/nodes/IndyNode'
import type { XForm } from 'src/nodes/XForm'
import { deg2rad } from './algorithms/deg2rad'
import { rad2deg } from './algorithms/rad2deg'
import { Signal } from 'toad.js/reactive/Signal'

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
    signal = new Signal()
    model: EditorModel
    active?: IndyNode
    selected = new Set<IndyNode>();
    private rotationQuat = quat.create()
    private lastEuler = { x: 0, y: 0, z: 0 }

    /**
     * avoid executing each of updateActiveFromEditorModel() and updateActiveFromEditorModel()
     * executing the other one as this can introduce jitter due to floating point inprecission.
     * 
     * it's also useless computation.
     * 
     * NOTE: it's the same issue as in toad.js' color dialog with RGB and HSV triggering each other
     */
    private lock = false

    constructor(model: EditorModel) {
        this.model = model
        model.transform.signal.add(this.updateActiveFromEditorModel)
    }

    isActive(node: IndyNode) { return this.active === node }
    isSelected(node: IndyNode) { return this.selected.has(node) }

    /**
     * clear selection
     */
    clear() {
        this.active = undefined
        this.selected.clear()
        this.signal.emit()
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

        // Initialize rotation state for the new active object so that
        // transformActive sees correct deltas if signals fire during update()
        const xform = node.parent as XForm | undefined
        if (xform?.transform) {
            mat4.getRotation(this.rotationQuat, xform.transform)
            const e = quat2euler(this.rotationQuat)
            this.lastEuler = {
                x: rad2deg(e.x),
                y: rad2deg(e.y),
                z: rad2deg(e.z)
            }
        } else {
            quat.identity(this.rotationQuat)
            this.lastEuler = { x: 0, y: 0, z: 0 }
        }
        this.updateEditorModelFromActive()

        this.signal.emit()
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
    updateActiveFromEditorModel() {
        if (this.lock) { return }
        if (!this.active) { return }
        this.lock = true

        const x = deg2rad(this.model.transform.rotation.x.value.toNumber())
        const y = deg2rad(this.model.transform.rotation.y.value.toNumber())
        const z = deg2rad(this.model.transform.rotation.z.value.toNumber())

        // Compute deltas from last known Euler values, normalizing to [-180, 180]
        // to handle wrapping (e.g. 359 → 2 should be +3°, not -357°)
        let dx = x - this.lastEuler.x
        let dy = y - this.lastEuler.y
        let dz = z - this.lastEuler.z

        this.lastEuler = { x, y, z }

        const pi = Math.PI
        const pi2 = 2 * Math.PI
        if (dx > pi) dx -= pi2; else if (dx < -pi) dx += pi2
        if (dy > pi) dy -= pi2; else if (dy < -pi) dy += pi2
        if (dz > pi) dz -= pi2; else if (dz < -pi) dz += pi2

        // Apply each delta as a local-axis rotation using axis-angle quaternions
        quat.rotateX(this.rotationQuat, this.rotationQuat, dx)
        quat.rotateY(this.rotationQuat, this.rotationQuat, dy)
        quat.rotateZ(this.rotationQuat, this.rotationQuat, dz)
        quat.normalize(this.rotationQuat, this.rotationQuat)
        const rotation = mat4.fromQuat(mat4.create(), this.rotationQuat)

        // Build the TRS matrix from the accumulated quaternion
        const m = mat4.create()
        mat4.translate(m, m, this.model.transform.translation.value)
        mat4.scale(m, m, this.model.transform.scale.value)
        mat4.mul(m, m, rotation)

        const parent = this.active.parent as XForm
        parent.transform = m
        parent.dirty = true

        this.lock = false
    }

    /**
     * update EditorModel.transform
     *
     * @returns
     */
    updateEditorModelFromActive() {
        if (!this.active) { return }
        if (this.lock) return
        this.lock = true
        const node = this.active
        const parent = node.parent as XForm
        if (!parent.transform) {
            parent.transform = mat4.create()
        }

        const pos = vec3.create()
        const scale = vec3.create()
        mat4.decompose(this.rotationQuat, pos, scale, parent.transform)
        const e = quat2euler(this.rotationQuat)
        this.lastEuler = e

        this.model.transform.translation.value = pos
        this.model.transform.rotation.x.value = rad2deg(e.x)
        this.model.transform.rotation.y.value = rad2deg(e.y)
        this.model.transform.rotation.z.value = rad2deg(e.z)
        this.model.transform.scale.x.value = scale[0]
        this.model.transform.scale.y.value = scale[1]
        this.model.transform.scale.z.value = scale[2]

        this.lock = false
    }
}
