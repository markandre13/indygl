import { ColorBuffer } from "../buffers/ColorBuffer"
import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import { Uniform } from "../buffers/Uniform"
import type { Context } from "../Context"
import { Shader } from "./Shader"
import { PICK_SIZE } from "./ShaderP3_PickPoint"

export class ShaderP3_C3_Point extends Shader {
    pipeline: GPURenderPipeline
    pickUniform: Uniform
    constructor(context: Context) {
        const label = "p3-c3-point"
        const device = context.device
        super(device, label)
        const pipelineDef: GPURenderPipelineDescriptor = {
            label,
            layout: device.device.createPipelineLayout({
                label,
                bindGroupLayouts: [
                    context.bindGroupLayout.scene,
                    context.bindGroupLayout.model,
                ]
            }),
            vertex: {
                buffers: [{
                    arrayStride: PositionBuffer.bytesPerVertex,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, ...PositionBuffer.position },
                    ]
                }, {
                    arrayStride: ColorBuffer.bytesPerVertex,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 1, ...ColorBuffer.color },
                    ]
                }],
                module: this.module
            },
            fragment: {
                module: this.module,
                targets: [{ format: context.presentationFormat }]
            },
            depthStencil: {
                format: context.depthTextureFormat,

                depthWriteEnabled: true,
                depthCompare: 'less',
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)

        this.pickUniform = new Uniform(device.device, ["vec2f"])
    }

    bindGroup?: GPUBindGroup
    private createBindGroup(context: Context, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer },
                    { binding: 2, resource: this.pickUniform.buffer }
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: Context,
        modelUniforms: ModelUniform,
        positions: PositionBuffer,
        colors: ColorBuffer,
        offset?: number,
        length?: number
    ) {
        this.pickUniform.values[0][0] = PICK_SIZE / context.canvas.clientWidth
        this.pickUniform.values[0][1] = PICK_SIZE / context.canvas.clientHeight
        this.pickUniform.writeTo(this.device)

        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        pass.setVertexBuffer(1, colors.buffer)
        const firstInstance = offset ? offset : 0
        const instanceCount = length ? length : (positions.buffer.size / 3 / FLOAT32_NUM_BYTES) - firstInstance
        pass.draw(6, instanceCount, 0, firstInstance)
    }
}
