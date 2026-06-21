import type { Mesh } from "src/nodes/Mesh"
import { VertexBuffer } from "./buffers/VertexBuffer"
import type { Context } from "./Context"
import { ModelUniform } from "./buffers/ModelUniform"
import { mat4, vec3 } from "gl-matrix"

export class AxisRenderer {
    modelView: ModelUniform
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
        this.modelView = new ModelUniform(context)

        const s = 10000
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
        const m = this.modelView.modelViewMatrix
        mat4.identity(m)
        if (this.context.selection.active) {
            const t = mat4.getTranslation(vec3.create(), this.context.selection.active.combined)
            mat4.translate(m, m, t)
        }
        this.modelView.writeTo(this.context.device)

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
        pass.setBindGroup(1, this.modelView.bindGroup) // FIXME: THIS IS FOR OBJECT LOCAL AXES, PROVIDE A GLOBAL IDENTITY TRANSFORM FOR THIS
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
