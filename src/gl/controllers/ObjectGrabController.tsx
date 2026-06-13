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
    override pointermove(ev: PointerEvent): void {
        ev.preventDefault()
        this.context.canvas.setPointerCapture(ev.pointerId)
        const status = document.getElementById("status")


        const node = this.context.selection.active
        if (node instanceof Mesh) {

            if (!this.grabbing) {
                this.grabbing = true
                this.initialCenter = mat4.getTranslation(vec3.create(), node.combined)
                const screen = world2screen(this.initialCenter, this.context.sceneUniforms.projectionMatrix, this.context.canvas)
                screen.x -= ev.offsetX
                screen.y -= ev.offsetY
                this.delta = screen
            }

            const pt = screen2pointInPlane(
                {x: ev.offsetX + this.delta!.x, y: ev.offsetY + this.delta!.y},
                this.initialCenter!,
                this.context.sceneUniforms.perspective,
                this.context.sceneUniforms.camera,
                this.context.canvas
            )

            const parent = (node.parent as XForm)
            if (parent.transform === undefined) {
                parent.transform = mat4.create()
            }
            // status!.innerText = vec3.str(pt)
            setMat4Translation(parent.transform, pt)
            parent.dirty = true

            // status!.innerText = `grab to ${ev.offsetX}, ${ev.offsetY}`

            this.context.invalidate()
        }
    }
    /**
     * quit fly mode and keep current position
     */
    confirm() {
        this.grabbing = false
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
