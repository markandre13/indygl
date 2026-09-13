import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Controller } from "./Controller"
import { mat4, quat, vec3 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import { Circle } from "../viewkit/svg/Circle"
import { world2screen } from "src/gl/algorithms/coordinates"
import { LineWithArrows } from "../viewkit/svg/LineWithArrows"
import { rad2deg } from "src/gl/algorithms/rad2deg"
import { TransformOrientation } from "../app/TransformOrientation"
import type { XForm } from "src/nodes/XForm"

export class ObjectRotateController extends Controller {
    context: Context

    /**
     * a circle indicating the origin of the object and around which we will rotate
     */
    originMarker!: Circle
    lineToPointer!: LineWithArrows

    /**
     * the initial angle between mouse pointer and originMarker
     */
    initialAngle!: number
    initialTransform!: mat4
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

    constructor(context: Context) {
        super()
        this.context = context

        // const node = this.context.selection.active as Mesh
        // const parent = node.parent as XForm
        const node = this.context.selection.getActive()!
        const parent = node.getXForm()!
        const objectCenter = mat4.getTranslation(vec3.create(), node.combined)

        // GLOBAL: rotate all selected objects around the median of their positions.
        // LOCAL: rotate only the active object around its own center.
        if (this.context.editorModel.transformOrientation.value === TransformOrientation.GLOBAL) {
            for (const selected of this.context.selection.getSelected()) {
                const xf = selected.getXForm()
                if (xf) {
                    this.xforms.push(xf)
                }
            }
            if (this.xforms.length === 0) {
                const xf = node.getXForm()
                if (xf) {
                    this.xforms.push(xf)
                }
            }
            this.initialTransforms = this.xforms.map((xf) => mat4.clone(xf.combined))
            this.initialXformTransforms = this.xforms.map((xf) => (xf.transform ? mat4.clone(xf.transform) : undefined))
            this.initialParentTransforms = this.xforms.map((xf) => mat4.clone(xf.parent?.combined ?? mat4.create()))
            const center = vec3.create()
            for (const tf of this.initialTransforms) {
                vec3.add(center, center, mat4.getTranslation(vec3.create(), tf))
            }
            vec3.scale(center, center, 1 / this.initialTransforms.length)
            this.initialMedian = center
            if (this.xforms.length > 1) {
                vec3.copy(objectCenter, this.initialMedian)
            }
        }

        const canvas = context.canvas
        const screenCenter = world2screen(objectCenter, context.sceneUniforms.projectionMatrix, canvas)
        canvas.style.cursor = "none"

        const svgOverlay = document.getElementById('svg-overlay')!
        this.originMarker = new Circle(svgOverlay, screenCenter, "#f80")
        this.lineToPointer = new LineWithArrows(svgOverlay, screenCenter, this.context.lastPointerOffset, "#fff")
        this.initialAngle = this.lineToPointer.angle
        this.initialTransform = parent.transform ? mat4.clone(parent.transform) : mat4.create()

        this.setInfo("Rotation 0.00 along global X")
    }
    override keyboardInfo() {
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
        // const node = this.context.selection.active
        // if (!(node instanceof Mesh)) { return }
        // const parent = (node.parent as XForm)
        const parent = this.context.selection.getActive()!.getXForm()!

        let angle = this.initialAngle - this.lineToPointer.angle

        // ROTATION AROUND THE OBJECT'S LOCAL Z-AXIS
        // * depending whether the axis points to or from the viewer, we need to use either angle or -angle
        //   so that the direction matches that of the pointer around the object's origin
        // parent.transform = mat4.rotate(mat4.create(), this.initialTransform, angle, vec3.fromValues(0,0,1))

        const axis = this.context.axisRenderer
        const isLocal = this.context.editorModel.transformOrientation.value === TransformOrientation.LOCAL
        let i = -1
        let m: mat4
        let p1: vec3, p0: vec3
        let deg = rad2deg(angle)
        if (deg < 0) { deg += 360 }
        if (deg > 360) { deg -= 360 }
        let degTxt = deg.toFixed(4)
        if (!axis.x && !axis.y && !axis.z) {
            p1 = vec3.fromValues(0, 0, 1)
            this.setInfo(`Rotation ${degTxt}`)
        } else if ((!axis.x && axis.y && axis.z) || (axis.x && !axis.y && !axis.z)) {
            i = 0
            p1 = vec3.fromValues(1, 0, 0)
            this.setInfo(`Rotation ${degTxt} along ${isLocal ? "local" : "global"} X`)
        } else if ((axis.x && !axis.y && axis.z) || (!axis.x && axis.y && !axis.z)) {
            i = 1
            p1 = vec3.fromValues(0, 1, 0)
            this.setInfo(`Rotation ${degTxt} along ${isLocal ? "local" : "global"} Y`)
        } else if ((axis.x && axis.y && !axis.z) || (!axis.x && !axis.y && axis.z)) {
            i = 2
            p1 = vec3.fromValues(0, 0, 1)
            this.setInfo(`Rotation ${degTxt} along ${isLocal ? "local" : "global"} Z`)
        } else {
            throw Error(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED YET`)
        }

        if (i !== -1 && isLocal) {
            const rotation = mat4.getRotation(quat.create(), this.initialTransform)
            vec3.transformQuat(p1, p1, rotation)
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

        if (this.xforms.length > 1) {
            // GLOBAL: rotate every selected object around the median of their positions
            this.rotateSelectedAroundMedian(angle, p0)
            this.context.selection.updateEditorModelFromActive()
            this.context.invalidate()
            return
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

    /**
     * GLOBAL rotation of all selected objects around the median of their positions.
     *
     * Every object orbits the median by the same angle around the given world axis,
     * and its own orientation rotates by the same world rotation.
     */
    private rotateSelectedAroundMedian(angle: number, axis: vec3) {
        const rotation = quat.setAxisAngle(quat.create(), axis, angle)
        quat.normalize(rotation, rotation)
        for (let i = 0; i < this.xforms.length; i++) {
            const xf = this.xforms[i]
            const position = vec3.create()
            const scale = vec3.create()
            const orientation = mat4.decompose(quat.create(), position, scale, this.initialTransforms[i])

            const offset = vec3.sub(vec3.create(), position, this.initialMedian)
            vec3.transformQuat(offset, offset, rotation)
            vec3.add(position, this.initialMedian, offset)

            const orient = quat.multiply(quat.create(), rotation, orientation)
            const world = mat4.fromRotationTranslationScale(mat4.create(), orient, position, scale)

            const parentInv = mat4.invert(mat4.create(), this.initialParentTransforms[i])!
            xf.transform = mat4.multiply(mat4.create(), parentInv, world)
            xf.dirty = true
        }
    }

    override destructor(): void {
        this.context.canvas.style.cursor = ""
        this.originMarker.remove()
        this.lineToPointer.remove()
        this.context.axisRenderer.set(false, false, false)
        this.hideInfo()
    }

    confirm() {
        this.context.popController()
    }

    cancel() {
        // const node = this.context.selection.getActive()
        // const parent = node.parent as XForm
        const parent = this.context.selection.getActive()!.getXForm()!
        parent.transform = this.initialTransform
        parent.dirty = true

        for (let i = 0; i < this.xforms.length; i++) {
            const xf = this.xforms[i]
            xf.transform = this.initialXformTransforms[i]
            xf.dirty = true
        }

        this.context.selection.updateEditorModelFromActive()
        this.context.invalidate()

        this.context.popController()
    }
}
