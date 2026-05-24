import type { Context } from "../Context"
import { Controller } from "./Controller"
import { MouseButton } from "./details/MouseButton"

// https://toji.dev/webgpu-best-practices/bind-groups.html
// Bind Group Reuse
//   setVertexBuffer
//   setBindGroup
//   setPipeline
//   draw
//   setPipeline
//   draw
//   setPipeline seems to be cheaper...
// Bind Group Subset Reuse
//   

export class ObjectSelectController extends Controller {
    constructor(_context: Context) {
        super()
    }
    override async pointerdown(ev: PointerEvent) {
        if (ev.button !== MouseButton.LEFT) {
            return
        }
        console.log(`click ${ev.offsetX}, ${ev.offsetY}`)
    }
}