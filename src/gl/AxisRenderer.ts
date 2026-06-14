import type { Mesh } from "src/nodes/Mesh"
import { VertexBuffer } from "./buffers/VertexBuffer"
import type { Context } from "./Context"

export class AxisRenderer {
    context: Context
    active?: Mesh
    points: VertexBuffer
    // indices: IndexBuffer // TODO: we could do without (and one with colors..., no depth check, ...)
    // materialXAxis: Material // won't be needed with different shader
    x = false;
    y = false;
    z = false;

    constructor(context: Context) {
        this.context = context
        const device = context.device
        const s = 100
        this.points = new VertexBuffer(device, [
            -s, 0, 0, 1, 0, 0,
            s, 0, 0, 1, 0, 0,

            0, -s, 0, 0, 1, 0,
            0, s, 0, 0, 1, 0,

            0, 0, -s, 0, 0, 1,
            0, 0, s, 0, 0, 1,
        ])
    }
    set(x: boolean, y: boolean, z: boolean) {
        this.x = x
        this.y = y
        this.z = z
    }
    render(pass: GPURenderPassEncoder) {
        if (!this.x && !this.y && !this.z) {
            return
        }

        const context = this.context
        const selection = context.selection
        if (!selection.active) {
            this.active = undefined
            return
        }
        if (selection.active !== this.active) {
            this.active = selection.active as Mesh
        }
        pass.setPipeline(context.shader.p3c3_line.pipeline)
        pass.setBindGroup(1, this.active.modelView.bindGroup)
        pass.setVertexBuffer(0, this.points.buffer)
        if (this.x) {
            pass.draw(2, undefined, 0)
        }
        if (this.y) {
            pass.draw(2, undefined, 2)
        }
        if (this.z) {
            pass.draw(2, undefined, 4)
        }
    }
}
