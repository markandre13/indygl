import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { type IndyNode } from "src/nodes/IndyNode"
import { type XForm } from "src/nodes/XForm"
import { Controller } from "./Controller"
import { mat4, quat, vec3 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import type { Point } from "src/gl/types/Point"
import { screen2pointInPlane, screen2world, setMat4Translation, world2screen } from "src/gl/algorithms/coordinates"
import { nearestPointBetweenLines } from "src/gl/algorithms/nearestPointBetweenLines"
import { TransformOrientation } from "../app/TransformOrientation"

export class ObjectGrabController extends Controller {
    context: Context
    root: IndyNode
    grabbing = false
    xforms: XForm[] = []
    initialCenter?: vec3
    /**
     * the combined transform of the active object at grab start,
     * used for LOCAL axis/plane orientation
     */
    initialTransform?: mat4
    /**
     * the combined transform of every selected object at grab start
     */
    initialTransforms: mat4[] = []
    /**
     * the median of all selected objects moved by the latest pointer move
     */
    moved: vec3 = vec3.create()
    delta?: Point
    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context
        this.root = root
        this.initGrab()
        this.updateLabel()
    }
    override keyboardInfo() {
        return <>
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
        this.initGrab()
        this.updateLabel()
        this.context.invalidate()
    }

    /**
     * the XForm of every selected node; falls back to the active node
     */
    private selectedXForms(): XForm[] {
        const xforms: XForm[] = []
        for (const node of this.context.selection.getSelected()) {
            const xf = node.getXForm()
            if (xf) {
                xforms.push(xf)
            }
        }
        if (xforms.length === 0) {
            const node = this.context.selection.getActive()
            if (node) {
                const xf = node.getXForm()
                if (xf) {
                    xforms.push(xf)
                }
            }
        }
        return xforms
    }

    /**
     * the median (average) of the combined centers of the given XForms
     */
    private medianCenter(xforms: XForm[]): vec3 {
        const center = vec3.create()
        for (const xf of xforms) {
            const p = mat4.getTranslation(vec3.create(), xf.combined)
            vec3.add(center, center, p)
        }
        if (xforms.length > 0) {
            vec3.scale(center, center, 1 / xforms.length)
        }
        return center
    }

    /**
     * (re-)anchor the grab: store the median and the initial state of all selected objects
     */
    private initGrab() {
        this.xforms = this.selectedXForms().map((xf) => {
            if (xf.transform === undefined) {
                xf.transform = mat4.create()
            }
            return xf
        })
        this.initialCenter = this.medianCenter(this.xforms)
        this.initialTransforms = this.xforms.map((xf) => mat4.clone(xf.combined))
        const active = this.context.selection.getActive()
        const activeXForm = active?.getXForm()
        this.initialTransform = mat4.clone((activeXForm ?? this.xforms[0])?.combined ?? mat4.create())
        this.moved = vec3.create()
    }

    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()

        if (!this.grabbing) {
            this.grabbing = true
            this.initGrab()
            // calculate the screen difference between the median of the selected objects and the pointer
            const screen = world2screen(this.initialCenter!, this.context.sceneUniforms.projectionMatrix, this.context.canvas)
            screen.x -= ev.offsetX
            screen.y -= ev.offsetY
            this.delta = screen
        }

        const axis = this.context.axisRenderer
        const isLocal = this.context.editorModel.transformOrientation.value === TransformOrientation.LOCAL
        const pointerPosition = { x: ev.offsetX + this.delta!.x, y: ev.offsetY + this.delta!.y }

        if (axis.oneAxisSelected) {
            this.grabAlongAxis(pointerPosition, isLocal)
        } else if (axis.twoAxesSelected || axis.noAxisSelected) {
            this.grabInPlane(pointerPosition, isLocal)
        } else {
            console.log(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED`)
            return
        }

        this.updateMoved()
        this.updateLabel()

        this.context.selection.updateEditorModelFromActive()
        this.context.invalidate()
    }

    /**
     * initial world position of the object with the given index
     */
    private initialPosition(i: number): vec3 {
        return mat4.getTranslation(vec3.create(), this.initialTransforms[i])
    }

    private setPosition(i: number, pos: vec3) {
        const xf = this.xforms[i]
        if (xf.transform === undefined) {
            xf.transform = mat4.create()
        }
        setMat4Translation(xf.transform, pos)
        xf.dirty = true
    }

    /**
     * move all objects by the same world delta
     */
    private applyDelta(delta: vec3) {
        for (let i = 0; i < this.xforms.length; i++) {
            this.setPosition(i, vec3.add(vec3.create(), this.initialPosition(i), delta))
        }
    }

    /**
     * move along a single axis.
     *
     * GLOBAL: all objects move by the same world-space delta.
     * LOCAL: each object translates along its own axis, anchored at its own position.
     */
    private grabAlongAxis(pointerPosition: Point, isLocal: boolean) {
        const axis = this.context.axisRenderer
        const worldDir = vec3.fromValues(
            axis.x ? 1 : 0,
            axis.y ? 1 : 0,
            axis.z ? 1 : 0
        )
        const perspectiveCamera = mat4.multiply(mat4.create(), this.context.sceneUniforms.perspective, this.context.sceneUniforms.camera)
        const camMat = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)!
        const camPos = mat4.getTranslation(vec3.create(), camMat)
        const rayDir = screen2world(pointerPosition, perspectiveCamera, this.context.canvas)

        if (!isLocal) {
            const result = nearestPointBetweenLines(camPos, rayDir, this.initialCenter!, worldDir)
            this.applyDelta(vec3.scale(vec3.create(), worldDir, result.b))
            return
        }

        for (let i = 0; i < this.xforms.length; i++) {
            const dir = vec3.clone(worldDir)
            const rotation = mat4.getRotation(quat.create(), this.initialTransforms[i])
            vec3.transformQuat(dir, dir, rotation)
            const anchor = this.initialPosition(i)
            const result = nearestPointBetweenLines(camPos, rayDir, anchor, dir)
            const pos = vec3.add(vec3.create(), anchor, vec3.scale(vec3.create(), dir, result.b))
            this.setPosition(i, pos)
        }
    }

    /**
     * move within a plane.
     *
     * no axis selected: plane of the camera's view direction.
     * two axes selected: plane perpendicular to the locked axis.
     *
     * GLOBAL: all objects move by the same world-space delta.
     * LOCAL: each object moves within its own plane, anchored at its own position.
     */
    private grabInPlane(pointerPosition: Point, isLocal: boolean) {
        const axis = this.context.axisRenderer
        let worldNormal: vec3
        if (axis.noAxisSelected) {
            worldNormal = vec3.fromValues(0, 0, 1)
            const camMat = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)!
            vec3.transformMat4(worldNormal, worldNormal, camMat)
            vec3.normalize(worldNormal, worldNormal)
        } else {
            worldNormal = vec3.fromValues(
                axis.x ? 0 : 1,
                axis.y ? 0 : 1,
                axis.z ? 0 : 1
            )
        }

        if (!isLocal) {
            const pt = screen2pointInPlane(
                pointerPosition,
                this.initialCenter!,
                this.context.sceneUniforms.perspective,
                this.context.sceneUniforms.camera,
                worldNormal,
                this.context.canvas
            )
            this.applyDelta(vec3.sub(vec3.create(), pt, this.initialCenter!))
            return
        }

        for (let i = 0; i < this.xforms.length; i++) {
            const normal = vec3.clone(worldNormal)
            const rotation = mat4.getRotation(quat.create(), this.initialTransforms[i])
            vec3.transformQuat(normal, normal, rotation)
            const pos = screen2pointInPlane(
                pointerPosition,
                this.initialPosition(i),
                this.context.sceneUniforms.perspective,
                this.context.sceneUniforms.camera,
                normal,
                this.context.canvas
            )
            this.setPosition(i, pos)
        }
    }

    /**
     * the median of the moved objects relative to the initial median
     */
    private updateMoved() {
        if (this.xforms.length === 0) {
            this.moved = vec3.create()
            return
        }
        const center = vec3.create()
        for (const xf of this.xforms) {
            const p = mat4.getTranslation(vec3.create(), xf.transform!)
            vec3.add(center, center, p)
        }
        vec3.scale(center, center, 1 / this.xforms.length)
        vec3.sub(this.moved, center, this.initialCenter!)
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
        const p1 = vec3.clone(this.moved)

        const dx = p1[0].toFixed(4)
        const dy = p1[1].toFixed(4)
        const dz = p1[2].toFixed(4)
        const d = vec3.length(p1).toFixed(4)

        const axis = this.context.axisRenderer
        const orientation = this.context.editorModel.transformOrientation.value === TransformOrientation.LOCAL ? "local" : "global"
        if (!axis.x && !axis.y && !axis.z) {
            this.setInfo(`𝛥y ${dx} m 𝛥y: ${dy} m 𝛥z: ${dz} m (${d} m)`)
        } else if (!axis.x && axis.y && axis.z) {
            this.setInfo(`𝛥y: ${dy} m  𝛥z: ${dz} m (${d}) locking ${orientation} X`)
        } else if (axis.x && !axis.y && axis.z) {
            this.setInfo(`𝛥x: ${dx} m  𝛥z: ${dz} m (${d}) locking ${orientation} Y`)
        } else if (axis.x && axis.y && !axis.z) {
            this.setInfo(`𝛥x: ${dx} m  𝛥y: ${dy} m (${d}) locking ${orientation} Z`)
        } else if (axis.x && !axis.y && !axis.z) {
            this.setInfo(`𝛥x: ${dx} m (${d}) along ${orientation} X`)
        } else if (!axis.x && axis.y && !axis.z) {
            this.setInfo(`𝛥y: ${dy} m (${d}) along ${orientation} Y`)
        } else if (!axis.x && !axis.y && axis.z) {
            this.setInfo(`𝛥z: ${dz} m (${d}) along ${orientation} Z`)
        }
    }

    /**
     * quit fly mode and keep current position
     */
    confirm() {
        this.grabbing = false
        this.context.axisRenderer.set(false, false, false)
        this.context.popController()
    }
    /**
     * quit grab
     */
    cancel() {
        for (let i = 0; i < this.xforms.length; i++) {
            const xf = this.xforms[i]
            const pos = mat4.getTranslation(vec3.create(), this.initialTransforms[i])
            setMat4Translation(xf.transform!, pos)

            xf.dirty = true
        }
        this.context.invalidate()

        this.confirm()
    }
}