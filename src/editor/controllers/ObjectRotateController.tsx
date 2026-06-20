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

        if (!this.rotating) {
            this.rotating = true
            this.initialParentTransform = parent.transform ? mat4.clone(parent.transform) : undefined
            this.initialMousePosition = { x: ev.offsetX, y: ev.offsetY }
        }

        const dx = ev.offsetX - this.initialMousePosition!.x
        const dy = ev.offsetY - this.initialMousePosition!.y
        const axis = this.context.axisRenderer
        const sensitivity = 0.005

        if (this.initialParentTransform) {
            parent.transform = mat4.clone(this.initialParentTransform)
        } else {
            parent.transform = mat4.create()
        }
        const m = parent.transform!

        if (!axis.x && !axis.y && !axis.z) {
            mat4.rotateY(m, m, dx * sensitivity)
            mat4.rotateX(m, m, dy * sensitivity)
        } else if (axis.x && !axis.y && !axis.z) {
            mat4.rotateX(m, m, dx * sensitivity)
        } else if (!axis.x && axis.y && !axis.z) {
            mat4.rotateY(m, m, dx * sensitivity)
        } else if (!axis.x && !axis.y && axis.z) {
            mat4.rotateZ(m, m, dx * sensitivity)
        } else if (!axis.x && axis.y && axis.z) {
            mat4.rotateY(m, m, dx * sensitivity)
            mat4.rotateZ(m, m, dx * sensitivity)
        } else if (axis.x && !axis.y && axis.z) {
            mat4.rotateX(m, m, dx * sensitivity)
            mat4.rotateZ(m, m, dx * sensitivity)
        } else if (axis.x && axis.y && !axis.z) {
            mat4.rotateX(m, m, dx * sensitivity)
            mat4.rotateY(m, m, dx * sensitivity)
        } else {
            console.log(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED`)
            return
        }

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
