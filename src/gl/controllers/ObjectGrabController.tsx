import { IconMouseLeft, IconMouseRight, IconKey, IconShift } from "src/editor/viewkit/InputIcons"
import type { IndyNode } from "src/nodes/Mesh"
import type { Context } from "../Context"
import { Controller } from "./Controller"

// [X] do this one quick'n dirty
// [ ] then get the edge select controller working
// [ ] then share code between the two via a new class called PickController

export class ObjectGrabController extends Controller {
    context: Context
    root: IndyNode
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
        status!.innerText = `grab ${ev.offsetX}, ${ev.offsetY}`
    }
    /**
     * quit fly mode and keep current position
     */
    confirm() {
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
