import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import { Controller } from "./Controller"
import { mat4, vec3 } from "gl-matrix"
import type { XForm } from "src/nodes/XForm"
import type { Context } from "src/gl/Context"
import { Circle } from "../viewkit/svg/Circle"
import { LineWithArrows } from "../viewkit/svg/LineWithArrows"
import { world2screen } from "src/gl/algorithms/coordinates"


export class ObjectScaleController extends Controller {
    context: Context

    originMarker!: Circle
    lineToPointer!: LineWithArrows

    initialDistance: number

    initialParentTransform: mat4
    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context

        const node = this.context.selection.active as Mesh
        const parent = node.parent as XForm
        const objectCenter = mat4.getTranslation(vec3.create(), node.combined)
        const canvas = context.canvas
        const screenCenter = world2screen(objectCenter, context.sceneUniforms.projectionMatrix, canvas)
        canvas.style.cursor = "none"

        const svgOverlay = document.getElementById('svg-overlay')!
        this.originMarker = new Circle(svgOverlay, screenCenter, "#f80")
        this.lineToPointer = new LineWithArrows(svgOverlay, screenCenter, this.context.lastPointerOffset, "#fff", 90)
        this.initialDistance = this.lineToPointer.distance
        this.initialParentTransform = parent.transform ? mat4.clone(parent.transform) : mat4.create()

        // this.setInfo("Scale X: 0.0000 Scale Y: 0.0000 Scale Z: 0.0000")
        this.updateLabel()
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
        this.updateLabel()
    }

    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()

        this.lineToPointer.setP1({ x: ev.offsetX, y: ev.offsetY })

        const node = this.context.selection.active
        if (!(node instanceof Mesh)) { return }
        const parent = (node.parent as XForm)


        let factor = this.lineToPointer.distance - this.initialDistance
        factor *= 0.01
        factor += 1
        if (factor < 0) {
            factor = -factor
        }

        let sx = 1, sy = 1, sz = 1

        const axis = this.context.axisRenderer
        if (!axis.x && !axis.y && !axis.z) {
            sx = sy = sz = factor
        } else if (axis.x && !axis.y && !axis.z) {
            sx = factor
        } else if (!axis.x && axis.y && !axis.z) {
            sy = factor
        } else if (!axis.x && !axis.y && axis.z) {
            sz = factor
        } else if (!axis.x && axis.y && axis.z) {
            sy = sz = factor
        } else if (axis.x && !axis.y && axis.z) {
            sx = sz = factor
        } else if (axis.x && axis.y && !axis.z) {
            sx = sy = factor
        } else {
            console.log(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED`)
            return
        }

        if (this.initialParentTransform) {
            parent.transform = mat4.clone(this.initialParentTransform)
        } else {
            parent.transform = mat4.create()
        }
        mat4.scale(parent.transform, parent.transform, vec3.fromValues(sx, sy, sz))
        this.updateLabel()

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

    private updateLabel() {

        const node = this.context.selection.active!
        const parent = (node.parent as XForm)
        const s = mat4.getScaling(vec3.create(), parent.transform!)

        const sx = s[0].toFixed(4)
        const sy = s[1].toFixed(4)
        const sz = s[2].toFixed(4)

        const axis = this.context.axisRenderer
        if (!axis.x && !axis.y && !axis.z) {
            this.setInfo(`Scale x: ${sx} y: ${sy} z: ${sz}`)
        } else if (!axis.x && axis.y && axis.z) {
            this.setInfo(`Scale ${sy} ${sz} locking global X`)
        } else if (axis.x && !axis.y && axis.z) {
            this.setInfo(`Scale ${sx} ${sz} locking global Y`)
        } else if (axis.x && axis.y && !axis.z) {
            this.setInfo(`Scale ${sx} ${sy} locking global Z`)
        } else if (axis.x && !axis.y && !axis.z) {
            this.setInfo(`Scale ${sx} along global X`)
        } else if (!axis.x && axis.y && !axis.z) {
            this.setInfo(`Scale ${sy} along global Y`)
        } else if (!axis.x && !axis.y && axis.z) {
            this.setInfo(`Scale ${sz} along global Z`)
        }
    }

    override destructor(): void {
        this.context.canvas.style.cursor = ""
        this.originMarker.remove()
        this.lineToPointer.remove()
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
