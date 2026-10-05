import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { Context } from "../Context"
import { Shader } from "./Shader"

export const PICK_SIZE = 5

export class ShaderP3_PickPoint extends Shader {
    readonly pipeline: GPURenderPipeline

    constructor(context: Context) {
        const label = "p3-pick-point"
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
                    arrayStride: FLOAT32_NUM_BYTES * 3,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' },
                    ]
                }],
                module: this.module
            },
            fragment: {
                module: this.module,
                targets: [{ format: "rgba8unorm" }]
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }

    bindGroup?: GPUBindGroup
    private createBindGroup(context: Context, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer },
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: Context,
        modelUniforms: ModelUniform,
        positions: PositionBuffer,
        offset?: number,
        length?: number
    ) {
        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        const firstInstance = offset ? offset : 0
        const instanceCount = length ? length : (positions.buffer.size / 3 / FLOAT32_NUM_BYTES) - firstInstance
        pass.draw(
            6, // vertices for point
            instanceCount, // number of instances
            0, // first vertex for point
            firstInstance)
    }
}
