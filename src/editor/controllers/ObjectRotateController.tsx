import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import { Controller } from "./Controller"
import { mat4, vec3 } from "gl-matrix"
import type { XForm } from "src/nodes/XForm"
import type { Context } from "src/gl/Context"
import type { Point } from "src/gl/types/Point"

export class ObjectRotateController extends Controller {
    context: Context
    root: IndyNode
    rotating = false
    initialMousePosition?: Point
    initialParentTransform?: mat4
    pointerAngle?: number
    label?: HTMLElement
    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context
        this.root = root
    }
    override info() {
        return <>
            <span>ROTATE:</span>
            <IconMouseLeft /><span>Confirm</span>
            <IconMouseRight /><span>Cancel</span>
            <IconKey key='X' /><IconKey key='Y' /><IconKey key='Z' /><span>Axis</span>
            <IconShift /><IconKey key='X' /><IconKey key='Y' /><IconKey key='Z' /><span>Plane</span>
        </>
    }

    override keydown(ev: KeyboardEvent): void {
        const axis = this.context.axisRenderer
        if (ev.shiftKey) {
            switch (ev.code) {
                case "KeyX":
                    axis.set(false, true, true)
                    break
                case "KeyY":
                    axis.set(true, false, true)
                    break
                case "KeyZ":
                    axis.set(true, true, false)
                    break
            }
        } else {
            switch (ev.code) {
                case "KeyX":
                    axis.set(true, false, false)
                    break
                case "KeyY":
                    axis.set(false, true, false)
                    break
                case "KeyZ":
                    axis.set(false, false, true)
                    break
            }
        }
        this.context.invalidate()
    }

    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()

        const node = this.context.selection.active
        if (!(node instanceof Mesh)) {
            return
        }

        const parent = (node.parent as XForm)
        const canvas = this.context.canvas
        const cx = canvas.width / 2
        const cy = canvas.height / 2

        if (!this.rotating) {
            this.rotating = true
            this.initialParentTransform = parent.transform ? mat4.clone(parent.transform) : undefined
            this.initialMousePosition = { x: ev.offsetX, y: ev.offsetY }
            this.pointerAngle = Math.atan2(ev.offsetY - cy, ev.offsetX - cx)
        }

        const dx = ev.offsetX - this.initialMousePosition!.x
        const axis = this.context.axisRenderer
        const sensitivity = 0.005

        const initial = this.initialParentTransform
        if (!initial) {
            parent.transform = mat4.create()
            parent.dirty = true
            return
        }

        const pos = mat4.getTranslation(vec3.create(), initial)
        const t = mat4.fromTranslation(mat4.create(), pos)
        const tInv = mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), pos))
        const rot = mat4.create()

        if (!axis.x && !axis.y && !axis.z) {
            const currentAngle = Math.atan2(ev.offsetY - cy, ev.offsetX - cx)
            const deltaAngle = currentAngle - this.pointerAngle!
            const viewInv = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)
            if (!viewInv) return
            const camZ = vec3.fromValues(viewInv[8], viewInv[9], viewInv[10])
            vec3.normalize(camZ, camZ)
            mat4.rotate(rot, rot, -deltaAngle, camZ)
        } else {
            if (axis.x && !axis.y && !axis.z) {
                mat4.rotateX(rot, rot, dx * sensitivity)
            } else if (!axis.x && axis.y && !axis.z) {
                mat4.rotateY(rot, rot, dx * sensitivity)
            } else if (!axis.x && !axis.y && axis.z) {
                mat4.rotateZ(rot, rot, dx * sensitivity)
            } else if (!axis.x && axis.y && axis.z) {
                mat4.rotateY(rot, rot, dx * sensitivity)
                mat4.rotateZ(rot, rot, dx * sensitivity)
            } else if (axis.x && !axis.y && axis.z) {
                mat4.rotateX(rot, rot, dx * sensitivity)
                mat4.rotateZ(rot, rot, dx * sensitivity)
            } else if (axis.x && axis.y && !axis.z) {
                mat4.rotateX(rot, rot, dx * sensitivity)
                mat4.rotateY(rot, rot, dx * sensitivity)
            } else {
                console.log(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED`)
                return
            }
        }

        const result = mat4.create()
        mat4.multiply(result, t, rot)
        mat4.multiply(result, result, tInv)
        mat4.multiply(result, result, initial)
        parent.transform = result

        parent.dirty = true
        this.context.selection.update()

        this.context.invalidate()
    }

    override pointerdown(ev: PointerEvent): void {
        ev.preventDefault()
        switch (ev.button) {
            case 0:
                this.confirm()
                break
            case 2:
                this.cancel()
                break
        }
    }

    confirm() {
        this.rotating = false
        this.context.axisRenderer.set(false, false, false)
        this.context.popController()

        if (this.label) {
            this.label.remove()
            this.label = undefined
        }
    }

    cancel() {
        const node = this.context.selection.active!
        const parent = (node.parent as XForm)
        if (this.initialParentTransform) {
            parent.transform = mat4.clone(this.initialParentTransform)
        } else {
            parent.transform = undefined
        }
        parent.dirty = true
        this.context.invalidate()

        this.confirm()
    }
}
