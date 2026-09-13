import type { Mesh } from "src/nodes/Mesh"
import { VertexBuffer } from "./buffers/VertexBuffer"
import type { Context } from "./Context"
import { ModelUniform } from "./buffers/ModelUniform"
import { mat4, vec3 } from "gl-matrix"
import { TransformOrientation } from "src/editor/app/TransformOrientation"

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
    get noAxisSelected() {
        return !(this.x || this.y || this.z)
    }
    get oneAxisSelected() {
        return (this.x && !this.y && !this.z) ||
            (!this.x && this.y && !this.z) ||
            (!this.x && !this.y && this.z)
    }
    get twoAxesSelected() {
        return (!this.x && this.y && this.z) ||
            (this.x && !this.y && this.z) ||
            (this.x && this.y && !this.z)
    }

    constructor(context: Context) {
        this.context = context
        const device = context.device
        this.modelView = new ModelUniform(context)

        const s = 10000
        this.points = new VertexBuffer(device, [
            // x-axis
            -s, 0, 0, 1, 0, 0,
            s, 0, 0, 1, 0, 0,

            // y-axis
            0, -s, 0, 0, 1, 0,
            0, s, 0, 0, 1, 0,

            // z-axis
            0, 0, -s, 0, 0, 1,
            0, 0, s, 0, 0, 1,
        ])
    }
    set(x: boolean, y: boolean, z: boolean) {
        // console.log(`set '${this.context.editorModel.transformOrientation.value}' axis ${x}, ${y}, ${z}`)
        const m = this.modelView.modelViewMatrix
        if (this.context.selection.getActive()) {

            const transform = this.context.selection.getActive()?.combined!

            switch (this.context.editorModel.transformOrientation.value) {
                case TransformOrientation.GLOBAL:
                    mat4.identity(m)
                    const t = mat4.getTranslation(vec3.create(), transform)
                    // console.log(`set global axis through ${t[0]}, ${t[1]}, ${t[2]}`)
                    mat4.translate(m, m, t)
                    break
                case TransformOrientation.LOCAL:
                    mat4.copy(m, transform)
                    break
                default:
                    mat4.identity(m)
                    break
            }
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
        if (!selection.isActive(this.active)) {
            this.active = selection.getActive()?.getMesh()
        }
        if (!this.active) {
            return
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
