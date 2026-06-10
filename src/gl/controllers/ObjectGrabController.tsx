import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import { Mesh } from "src/nodes/Mesh"
import { type IndyNode } from "src/nodes/IndyNode"
import type { Context } from "../Context"
import { Controller } from "./Controller"

// [X] do this one quick'n dirty
// [ ] then get the edge select controller working
// [ ] then share code between the two via a new class called PickController

export class ObjectGrabController extends Controller {
    context: Context
    root: IndyNode
    grabbing = false
    x = 0
    y = 0
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
        if (!this.grabbing) {
            this.grabbing = true
            this.x = ev.offsetX
            this.y = ev.offsetY
        }
        ev.preventDefault()
        this.context.canvas.setPointerCapture(ev.pointerId)
        const status = document.getElementById("status")
        status!.innerText = `grab ${ev.offsetX - this.x}, ${ev.offsetY - this.y}`

        const node = this.context.selection.active
        if (node instanceof Mesh) {
            const origin = node.origin!

            // how to go from screen coordinates to origin's translation?
            // i already did this one for picking?
            // basically, i have to run the 3d to 2d mapping backwards
            // ah! i already have code to go from 3d to 2d in makehuman.js to place the labels
            // use it to show object names to verify it works here, then calculate it backwards

            // status!.innerText = `grab ${origin[0]}, ${origin[1]}, ${origin[2]}`
        }
    }
    /**
     * quit fly mode and keep current position
     */
    confirm() {
        this.grabbing = false
        this.context.popController()
    }
    /**
     * quit grab
     */
    cancel() {
        // this.context.camera.value = this._initial
        this.confirm()
    }
}
