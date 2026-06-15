import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import type { Context } from "../Context"
import { Controller } from "./Controller"
import { mat4, vec3, vec4 } from "gl-matrix"
import type { XForm } from "src/nodes/XForm"
import { screen2pointInPlane, setMat4Translation, world2screen } from "../algorithms/coordinates"
import type { Point } from "../types/Point"
import { nearestPointOnLine2D } from "../algorithms/nearestPointOnLine2D"

export class ObjectGrabController extends Controller {
    context: Context
    root: IndyNode
    grabbing = false
    initialCenter?: vec3
    initialTransform?: mat4
    delta?: Point
    label?: HTMLElement
    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context
        this.root = root
    }
    override info() {
        return <>
            <span>GRAB:</span>
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
        const node = this.context.selection.active
        if (node instanceof Mesh) {
            this.initialCenter = mat4.getTranslation(vec3.create(), node.combined)
            this.initialTransform = mat4.clone(node.combined)
        }
        this.context.invalidate()
    }

    override pointermove(ev: PointerEvent): void {
        // console.log("XXX")
        ev.preventDefault()

        // this.context.canvas.setPointerCapture(ev.pointerId)

        const node = this.context.selection.active
        if (!(node instanceof Mesh)) {
            return
        }

        if (!this.grabbing) {
            this.grabbing = true
            // save the object's initial transform
            this.initialCenter = mat4.getTranslation(vec3.create(), node.combined)
            this.initialTransform = mat4.clone(node.combined)
            // calculate the screen diference between the object and the pointer
            const screen = world2screen(this.initialCenter, this.context.sceneUniforms.projectionMatrix, this.context.canvas)
            screen.x -= ev.offsetX
            screen.y -= ev.offsetY
            this.delta = screen
        }

        const parent = (node.parent as XForm)
        if (parent.transform === undefined) {
            parent.transform = mat4.create()
        }

        let pn: vec3 | undefined
        const axis = this.context.axisRenderer
        const status = document.getElementById("status")

        let pointerPosition = { x: ev.offsetX + this.delta!.x, y: ev.offsetY + this.delta!.y }
        if (!axis.x && !axis.y && !axis.z) {
            // plane normal in camera space, along which we want to move during grab
            const camMat = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)!
            pn = vec3.fromValues(0, 0, 1)
            vec3.transformMat4(pn, pn, camMat)
            vec3.normalize(pn, pn)
        } else if (!axis.x && axis.y && axis.z) {
            pn = vec3.fromValues(1, 0, 0)
        } else if (axis.x && !axis.y && axis.z) {
            pn = vec3.fromValues(0, 1, 0)
        } else if (axis.x && axis.y && !axis.z) {
            pn = vec3.fromValues(0, 0, 1)
        } else if (axis.x && !axis.y && !axis.z) {
            pointerPosition = pointerToObjectAxisInScreenSpace(ev, this.initialTransform!, vec3.fromValues(1, 0, 0), this.context)
            pn = vec3.fromValues(0, 1, 0)
        } else if (!axis.x && axis.y && !axis.z) {
            pointerPosition = pointerToObjectAxisInScreenSpace(ev, this.initialTransform!, vec3.fromValues(0, 1, 0), this.context)
            pn = vec3.fromValues(1, 0, 0)
        } else if (!axis.x && !axis.y && axis.z) {
            pointerPosition = pointerToObjectAxisInScreenSpace(ev, this.initialTransform!, vec3.fromValues(0, 0, 1), this.context)
            pn = vec3.fromValues(1, 0, 0)
        } else {
            console.log(`CONSTRAINT ${axis.x} ${axis.y} ${axis.z} IS NOT IMPLEMENTED`)
            return
        }

        const pt = screen2pointInPlane(
            pointerPosition,
            this.initialCenter!,
            this.context.sceneUniforms.perspective,
            this.context.sceneUniforms.camera,
            pn,
            this.context.canvas
        )

        status!.innerText = `CONSTRAIN ${axis.x} ${axis.y} ${axis.z} => ${vec3.str(pt)}`

        // status!.innerText = vec3.str(pt)
        setMat4Translation(parent.transform, pt)
        parent.dirty = true

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
     * quit fly mode and keep current position
     */
    confirm() {
        this.grabbing = false
        this.context.axisRenderer.set(false, false, false)
        this.context.popController()

        if (this.label) {
            this.label.remove()
            this.label = undefined
        }
    }
    /**
     * quit grab
     */
    cancel() {
        const node = this.context.selection.active!
        const parent = (node.parent as XForm)
        setMat4Translation(parent.transform!, this.initialCenter!)

        parent.dirty = true
        this.context.invalidate()

        this.confirm()
    }
}

/**
  * return a point in screen space which is close the object's axis given by axis
  * 
  * @param pointer the pointer's position
  * @param transform the object's transform
  * @param axis the object's axis
  * @param context context to get perspective, camera and canvas
  * @returns 
  */
function pointerToObjectAxisInScreenSpace(ev: PointerEvent, transform: mat4, axis: vec3, context: Context) {
    const scene = context.sceneUniforms
    const m = mat4.mul(mat4.create(), scene.perspective, scene.camera)
    mat4.mul(m, m, transform)

    // axis as a line from p0 to p1
    const p0 = vec3.fromValues(0, 0, 0)
    const p1 = axis

    // map the line representing the axis into screen space
    const s0 = world2screen(p0, m, context.canvas)
    const s1 = world2screen(p1, m, context.canvas)

    // find the clostest point on screen
    return nearestPointOnLine2D(
        { x: ev.offsetX, y: ev.offsetY },
        s0,
        { x: s1.x - s0.x, y: s1.y - s0.y }
    ).p
}