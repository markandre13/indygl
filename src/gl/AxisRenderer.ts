import type { IndyNode } from "src/nodes/IndyNode"
import { VertexBuffer } from "./buffers/VertexBuffer"
import type { Context } from "./Context"
import { ModelUniform } from "./buffers/ModelUniform"
import { mat4, vec3 } from "gl-matrix"
import { TransformOrientation } from "src/editor/app/TransformOrientation"

export class AxisRenderer {
    modelView: ModelUniform
    context: Context
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
        this.x = x
        this.y = y
        this.z = z
    }
    /**
     * the objects whose axes are displayed
     *
     * GLOBAL: the active object.
     * LOCAL: every selected object.
     */
    private axisNodes(): IndyNode[] {
        const selection = this.context.selection
        const nodes: IndyNode[] = []
        switch (this.context.editorModel.transformOrientation.value) {
            case TransformOrientation.LOCAL:
                for (const node of selection.getSelected()) {
                    nodes.push(node)
                }
                break
            default:
                if (selection.getActive()) {
                    nodes.push(selection.getActive()!)
                }
                break
        }
        return nodes
    }
    /**
     * ModelUniform cache for LOCAL axis rendering: one uniform per node,
     * because each draw call needs its own buffer/bind group.
     */
    private localModelViews = new Map<IndyNode, ModelUniform>()

    /**
     * the model view matrix for the given node's axes and the ModelUniform
     * that will render them.
     *
     * LOCAL: each node gets its own ModelUniform, otherwise all nodes share
     * the single `modelView` uniform.
     */
    private modelViewFor(node: IndyNode): ModelUniform {
        const m = this.modelView.modelViewMatrix
        switch (this.context.editorModel.transformOrientation.value) {
            case TransformOrientation.GLOBAL:
                mat4.identity(m)
                const t = mat4.getTranslation(vec3.create(), node.combined)
                // console.log(`set global axis through ${t[0]}, ${t[1]}, ${t[2]}`)
                mat4.translate(m, m, t)
                this.modelView.writeTo(this.context.device)
                return this.modelView
            case TransformOrientation.LOCAL:
                let mv = this.localModelViews.get(node)
                if (mv === undefined) {
                    mv = new ModelUniform(this.context)
                    this.localModelViews.set(node, mv)
                }
                mat4.copy(mv.modelViewMatrix, node.combined)
                mv.writeTo(this.context.device)
                return mv
            default:
                mat4.identity(m)
                this.modelView.writeTo(this.context.device)
                return this.modelView
        }
    }
    render(pass: GPURenderPassEncoder) {
        if (!this.x && !this.y && !this.z) {
            return
        }

        const context = this.context
        const nodes = this.axisNodes()
        if (nodes.length === 0) {
            return
        }

        pass.setPipeline(context.shader.p3c3_line.pipeline)
        // FIXME: THIS IS FOR OBJECT LOCAL AXES, PROVIDE A GLOBAL IDENTITY TRANSFORM FOR THIS
        pass.setVertexBuffer(0, this.points.buffer)
        for (const node of nodes) {
            const mv = this.modelViewFor(node)
            pass.setBindGroup(1, mv.bindGroup)

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
}
