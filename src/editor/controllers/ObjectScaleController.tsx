import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import { Controller } from "./Controller"
import { mat4, vec3 } from "gl-matrix"
import type { XForm } from "src/nodes/XForm"
import type { Context } from "src/gl/Context"
import type { Point } from "src/gl/types/Point"


export class ObjectScaleController extends Controller {
    context: Context
    root: IndyNode
    scaling = false
    initialMousePosition?: Point
    initialParentTransform?: mat4
    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context
        this.root = root
    }
    override keyboardInfo() {
        return <>
            <span>SCALE:</span>
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

        if (!this.scaling) {
            this.scaling = true
            this.initialParentTransform = parent.transform ? mat4.clone(parent.transform) : undefined
            this.initialMousePosition = { x: ev.offsetX, y: ev.offsetY }
        }

        const dx = ev.offsetX - this.initialMousePosition!.x
        const dy = ev.offsetY - this.initialMousePosition!.y
        const axis = this.context.axisRenderer
        const sensitivity = 0.01

        let sx = 1, sy = 1, sz = 1

        if (!axis.x && !axis.y && !axis.z) {
            const factor = 1 + dx * sensitivity
            sx = sy = sz = factor
        } else if (axis.x && !axis.y && !axis.z) {
            sx = 1 + dx * sensitivity
        } else if (!axis.x && axis.y && !axis.z) {
            sy = 1 + dy * sensitivity
        } else if (!axis.x && !axis.y && axis.z) {
            sz = 1 + dx * sensitivity
        } else if (!axis.x && axis.y && axis.z) {
            const factor = 1 + dy * sensitivity
            sy = sz = factor
        } else if (axis.x && !axis.y && axis.z) {
            const factor = 1 + dy * sensitivity
            sx = sz = factor
        } else if (axis.x && axis.y && !axis.z) {
            const factor = 1 + dy * sensitivity
            sx = sy = factor
        } else {
            console.log(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED`)
            return
        }

        const minScale = 0.001
        sx = Math.max(minScale, sx)
        sy = Math.max(minScale, sy)
        sz = Math.max(minScale, sz)

        if (this.initialParentTransform) {
            parent.transform = mat4.clone(this.initialParentTransform)
        } else {
            parent.transform = mat4.create()
        }
        mat4.scale(parent.transform, parent.transform, vec3.fromValues(sx, sy, sz))
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
        this.scaling = false
        this.context.axisRenderer.set(false, false, false)       
    }

    confirm() {
        this.context.popController()
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
