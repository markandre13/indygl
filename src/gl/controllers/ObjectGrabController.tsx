import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import type { Context } from "../Context"
import { Controller } from "./Controller"
import { mat4, vec3, vec4 } from "gl-matrix"
// import { screen2world, world2screen } from "../algorithms/coordinates"
import type { XForm } from "src/nodes/XForm"
import { screen2pointInPlane, setMat4Translation, world2screen } from "../algorithms/coordinates"
import type { Point } from "../types/Point"

// [X] do this one quick'n dirty
// [ ] then get the edge select controller working
// [ ] then share code between the two via a new class called PickController

export class ObjectGrabController extends Controller {
    context: Context
    root: IndyNode
    grabbing = false
    initialCenter?: vec3
    transform?: mat4
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
            this.transform = mat4.clone(node.combined)
        }
        this.context.invalidate()
    }

    override pointermove(ev: PointerEvent): void {
        // console.log("XXX")
        ev.preventDefault()
        // this.context.canvas.setPointerCapture(ev.pointerId)

        const node = this.context.selection.active
        if (node instanceof Mesh) {

            if (!this.grabbing) {
                this.grabbing = true
                this.initialCenter = mat4.getTranslation(vec3.create(), node.combined)
                this.transform = mat4.clone(node.combined)
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
                // TODO: blender does something better 
                const camMat = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)!
                pn = vec3.fromValues(1, 0, 0)
                vec3.transformMat4(pn, pn, camMat)
                vec3.normalize(pn, pn)
            } else if (!axis.x && axis.y && !axis.z) {
                const camMat = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)!
                pn = vec3.fromValues(0, 1, 0)
                vec3.transformMat4(pn, pn, camMat)
                vec3.normalize(pn, pn)
            } else if (!axis.x && !axis.y && axis.z) {
                const camMat = mat4.invert(mat4.create(), this.context.sceneUniforms.camera)!
                pn = vec3.fromValues(0, 0, 1)
                vec3.transformMat4(pn, pn, camMat)
                vec3.normalize(pn, pn)
            } else {
                console.log(`CONSTRAIN ${axis.x} ${axis.y} ${axis.z}`)
                return
            }

            const pt = screen2pointInPlane(
                { x: ev.offsetX + this.delta!.x, y: ev.offsetY + this.delta!.y },
                this.initialCenter!,
                this.context.sceneUniforms.perspective,
                this.context.sceneUniforms.camera,
                pn,
                this.context.canvas
            )

            if (axis.x && !axis.y && !axis.z) {
                pt[1] = this.initialCenter![1]
                pt[2] = this.initialCenter![2]
            }
            if (!axis.x && axis.y && !axis.z) {
                pt[0] = this.initialCenter![0]
                pt[2] = this.initialCenter![2]
            }
            if (!axis.x && !axis.y && axis.z) {
                pt[0] = this.initialCenter![0]
                pt[1] = this.initialCenter![1]
            }
            status!.innerText = `CONSTRAIN ${axis.x} ${axis.y} ${axis.z} => ${vec3.str(pt)}`

            // status!.innerText = vec3.str(pt)
            setMat4Translation(parent.transform, pt)
            parent.dirty = true


            this.context.invalidate()
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
        // this.context.camera.value = this._initial
        this.confirm()
    }
}
