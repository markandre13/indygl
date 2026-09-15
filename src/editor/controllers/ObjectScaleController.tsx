import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { type IndyNode } from "src/nodes/IndyNode"
import { type XForm } from "src/nodes/XForm"
import { Controller } from "./Controller"
import { mat4, vec3 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import { Circle } from "../viewkit/svg/Circle"
import { LineWithArrows } from "../viewkit/svg/LineWithArrows"
import { world2screen } from "src/gl/algorithms/coordinates"
import { TransformOrientation } from "../app/TransformOrientation"

export class ObjectScaleController extends Controller {
    context: Context

    originMarker!: Circle
    lineToPointer!: LineWithArrows

    initialDistance: number

    initialParentTransform: mat4
    /**
     * the XForm of every selected object (GLOBAL transform orientation only)
     */
    xforms: XForm[] = []
    /**
     * the combined world transform of every selected object at grab start
     */
    initialTransforms: mat4[] = []
    /**
     * the original parent-local transform of every selected object at grab start
     */
    initialXformTransforms: (mat4 | undefined)[] = []
    /**
     * the combined transform of the parent of every selected object at grab start
     */
    initialParentTransforms: mat4[] = []
    /**
     * the median of the selected objects' positions at grab start
     */
    initialMedian: vec3 = vec3.create()

    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context

        // const node = this.context.selection.active as Mesh
        // const parent = node.parent as XForm
        const parent = this.context.selection.getActive()!.getXForm()!
        const objectCenter = mat4.getTranslation(vec3.create(), parent.combined)
        const isLocal = this.context.editorModel.transformOrientation.value === TransformOrientation.LOCAL

        // Collect all selected objects for multi-object support (GLOBAL)
        for (const selected of this.context.selection.getSelected()) {
            const xf = selected.getXForm()
            if (xf) {
                this.xforms.push(xf)
            }
        }
        if (this.xforms.length === 0) {
            const xf = parent
            if (xf) {
                this.xforms.push(xf)
            }
        }
        this.initialTransforms = this.xforms.map((xf) => mat4.clone(xf.combined))
        this.initialXformTransforms = this.xforms.map((xf) => (xf.transform ? mat4.clone(xf.transform) : undefined))
        this.initialParentTransforms = this.xforms.map((xf) => mat4.clone(xf.parent?.combined ?? mat4.create()))

        // GLOBAL multi-object: compute median and use it for the origin marker
        if (!isLocal && this.xforms.length > 1) {
            const center = vec3.create()
            for (const tf of this.initialTransforms) {
                vec3.add(center, center, mat4.getTranslation(vec3.create(), tf))
            }
            vec3.scale(center, center, 1 / this.initialTransforms.length)
            this.initialMedian = center
            vec3.copy(objectCenter, this.initialMedian)
        }

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

        // const node = this.context.selection.active
        // if (!(node instanceof Mesh)) { return }
        // const parent = (node.parent as XForm)
        const parent = this.context.selection.getActive()!.getXForm()!

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
        const isLocal = this.context.editorModel.transformOrientation.value === TransformOrientation.LOCAL
        if (isLocal && this.xforms.length > 1) {
            // LOCAL: scale every selected object along its own coordinate system
            const s = vec3.fromValues(sx, sy, sz)
            this.scaleSelectedLocally(s)
            this.context.selection.updateEditorModelFromActive()
            this.context.invalidate()
            return
        }
        if (!isLocal && this.xforms.length > 1) {
            // GLOBAL: scale every selected object around the median of their positions
            const s = vec3.fromValues(sx, sy, sz)
            this.scaleSelectedAroundMedian(s, this.initialMedian, this.initialTransforms, this.initialParentTransforms)
            this.context.selection.updateEditorModelFromActive()
            this.context.invalidate()
            return
        }
        const scale = vec3.fromValues(sx, sy, sz)
        if (isLocal) {
            mat4.scale(parent.transform, parent.transform, scale)
        } else {
            // GLOBAL: scale along the parent/world axes, keeping the object's position (pivot)
            const position = mat4.getTranslation(vec3.create(), parent.transform)
            const scaleAroundPivot = mat4.fromTranslation(mat4.create(), position)
            mat4.scale(scaleAroundPivot, scaleAroundPivot, scale)
            mat4.translate(scaleAroundPivot, scaleAroundPivot, vec3.negate(vec3.create(), position))
            mat4.multiply(scaleAroundPivot, scaleAroundPivot, parent.transform)
            parent.transform = scaleAroundPivot
        }
        this.updateLabel()

        parent.dirty = true
        this.context.selection.updateEditorModelFromActive()
        this.context.invalidate()
    }

    /**
     * GLOBAL scaling of all selected objects around the median of their positions.
     *
     * Every object's world position is scaled by `factor` (component-wise) around
     * the median, and its own transform is pre-multiplied by the scale matrix.
     */
    private scaleSelectedAroundMedian(
        factor: vec3,
        median: vec3,
        initialTransforms: mat4[],
        initialParentTransforms: mat4[]
    ) {
        const around = mat4.fromTranslation(mat4.create(), median)
        mat4.scale(around, around, factor)
        mat4.translate(around, around, vec3.negate(vec3.create(), median))

        for (let i = 0; i < this.xforms.length; i++) {
            const xf = this.xforms[i]
            const newWorld = mat4.multiply(mat4.create(), around, initialTransforms[i])
            const parentInv = mat4.invert(mat4.create(), initialParentTransforms[i])!
            xf.transform = mat4.multiply(mat4.create(), parentInv, newWorld)
            xf.dirty = true
        }
    }

    /**
     * LOCAL scaling of all selected objects along their own coordinate systems.
     *
     * Every object's transform is reset to its initial value and then scaled
     * along its own local axes, keeping its own position as the pivot.
     */
    private scaleSelectedLocally(factor: vec3) {
        for (let i = 0; i < this.xforms.length; i++) {
            const xf = this.xforms[i]
            const transform = this.initialXformTransforms[i] ? mat4.clone(this.initialXformTransforms[i]!) : mat4.create()
            mat4.scale(transform, transform, factor)
            xf.transform = transform
            xf.dirty = true
        }
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

        // const node = this.context.selection.active!
        // const parent = (node.parent as XForm)
        const parent = this.context.selection.getActive()!.getXForm()!
        const s = mat4.getScaling(vec3.create(), parent.transform!)

        const sx = s[0].toFixed(4)
        const sy = s[1].toFixed(4)
        const sz = s[2].toFixed(4)

        const axis = this.context.axisRenderer
        const orientation = this.context.editorModel.transformOrientation.value === TransformOrientation.LOCAL ? "local" : "global"
        if (!axis.x && !axis.y && !axis.z) {
            this.setInfo(`Scale x: ${sx} y: ${sy} z: ${sz}`)
        } else if (!axis.x && axis.y && axis.z) {
            this.setInfo(`Scale ${sy} ${sz} locking ${orientation} X`)
        } else if (axis.x && !axis.y && axis.z) {
            this.setInfo(`Scale ${sx} ${sz} locking ${orientation} Y`)
        } else if (axis.x && axis.y && !axis.z) {
            this.setInfo(`Scale ${sx} ${sy} locking ${orientation} Z`)
        } else if (axis.x && !axis.y && !axis.z) {
            this.setInfo(`Scale ${sx} along ${orientation} X`)
        } else if (!axis.x && axis.y && !axis.z) {
            this.setInfo(`Scale ${sy} along ${orientation} Y`)
        } else if (!axis.x && !axis.y && axis.z) {
            this.setInfo(`Scale ${sz} along ${orientation} Z`)
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
        // const node = this.context.selection.active!
        // const parent = (node.parent as XForm)
        for (let i = 0; i < this.xforms.length; i++) {
            const xf = this.xforms[i]
            if (this.initialXformTransforms[i]) {
                xf.transform = mat4.clone(this.initialXformTransforms[i]!)
            } else {
                xf.transform = undefined
            }
            xf.dirty = true
        }
        this.context.invalidate()

        this.confirm()
    }
}
