import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import { Controller } from "./Controller"
import { mat4, vec3 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import { Circle } from "../viewkit/svg/Circle"
import { world2screen } from "src/gl/algorithms/coordinates"
import { LineWithArrows } from "../viewkit/svg/LineWithArrows"
import type { XForm } from "src/nodes/XForm"

export class ObjectRotateController extends Controller {
    context: Context

    originMarker!: Circle
    lineToPointer!: LineWithArrows

    initialAngle!: number
    initialTransform!: mat4
    label?: HTMLElement

    constructor(context: Context) {
        super()
        this.context = context

        const node = this.context.selection.active as Mesh
        const parent = node.parent as XForm
        const objectCenter = mat4.getTranslation(vec3.create(), node.combined)
        const canvas = context.canvas
        const screenCenter = world2screen(objectCenter, context.sceneUniforms.projectionMatrix, canvas)
        canvas.style.cursor = "none"

        const overlay = document.getElementById('svg-overlay')!
        this.originMarker = new Circle(overlay, screenCenter, "#f80")
        this.lineToPointer = new LineWithArrows(overlay, screenCenter, this.context.lastPointerOffset, "#fff")
        this.initialAngle = this.lineToPointer.angle
        this.initialTransform = parent.transform ? mat4.clone(parent.transform) : mat4.create()
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

        this.lineToPointer.setP1({ x: ev.offsetX, y: ev.offsetY })
        const node = this.context.selection.active
        if (!(node instanceof Mesh)) { return }
        const parent = (node.parent as XForm)

        let angle = this.initialAngle - this.lineToPointer.angle

        // ROTATION AROUND THE OBJECT'S LOCAL Z-AXIS
        // * depending whether the axis points to or from the viewer, we need to use either angle or -angle
        //   so that the direction matches that of the pointer around the object's origin
        // parent.transform = mat4.rotate(mat4.create(), this.initialTransform, angle, vec3.fromValues(0,0,1))

        const axis = this.context.axisRenderer
        let i = -1
        let m: mat4
        let p1: vec3, p0: vec3
        if (!axis.x && !axis.y && !axis.z) {
            p1 = vec3.fromValues(0, 0, 1)
        } else if ((!axis.x && axis.y && axis.z) || (axis.x && !axis.y && !axis.z)) {
            i = 0
            p1 = vec3.fromValues(1, 0, 0)
        } else if ((axis.x && !axis.y && axis.z) || (!axis.x && axis.y && !axis.z)) {
            i = 1
            p1 = vec3.fromValues(0, 1, 0)
        } else if ((axis.x && axis.y && !axis.z) || (!axis.x && !axis.y && axis.z)) {
            i = 2
            p1 = vec3.fromValues(0, 0, 1)
        } else {
            throw Error(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED YET`)
        }

        if (i == -1) {
            // move from local to camera coordinates
            m = mat4.mul(mat4.create(), this.context.sceneUniforms.camera, this.initialTransform)
        } else {
            // move from local to world coordinates
            m = mat4.clone(this.initialTransform)
        }

        mat4.invert(m, m)
        p0 = vec3.fromValues(0, 0, 0)
        vec3.transformMat4(p0, p0, m)
        vec3.transformMat4(p1, p1, m)
        vec3.sub(p0, p1, p0)
        vec3.normalize(p0, p0)

        if (i !== -1) {
            // match object rotation to pointer rotation
            const camInv = mat4.clone(this.context.sceneUniforms.camera)
            mat4.invert(camInv, camInv)
            vec3.transformMat4(p1, p1, camInv)
            if (p1[i] < 0) {
                angle = -angle
            }
        }


        parent.transform = mat4.rotate(mat4.create(), this.initialTransform, angle, p0)

        parent.dirty = true
        this.context.selection.updateEditorModelFromActive()
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

    override destructor(): void {
        this.context.canvas.style.cursor = ""
        this.originMarker.remove()
        this.lineToPointer.remove()
        this.label?.remove()
        this.context.axisRenderer.set(false, false, false)
    }

    confirm() {
        this.context.popController()
    }

    cancel() {
        const node = this.context.selection.active!
        const parent = node.parent as XForm
        parent.transform = this.initialTransform
        parent.dirty = true
        this.context.selection.updateEditorModelFromActive()
        this.context.invalidate()

        this.context.popController()
    }
}
