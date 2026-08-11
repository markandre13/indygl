import { ColorBuffer } from "../buffers/ColorBuffer"
import type { IndexBuffer } from "../buffers/IndexBuffer"
import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { Context } from "../Context"
import { Shader } from "./Shader"

export class ShaderP3_C3_IDX extends Shader {
    pipeline: GPURenderPipeline
    pipelineOutline: GPURenderPipeline

    constructor(context: Context,
        cullMode: GPUCullMode | undefined = "back",
        topology: GPUPrimitiveTopology | undefined = 'triangle-list'
    ) {
        const label = 'p3-c3-idx'
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
                    attributes: [
                        { shaderLocation: 0, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' },
                    ]
                }, {
                    arrayStride: FLOAT32_NUM_BYTES * 3,
                    attributes: [
                        { shaderLocation: 1, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' },
                    ]
                }],
                module: this.module
            },
            fragment: {
                module: this.module,
                targets: [{ format: context.presentationFormat }]
            },
            primitive: {
                topology,
                cullMode,
            },
            depthStencil: {
                format: context.depthTextureFormat,

                depthWriteEnabled: true,
                depthBias: 1, // this make points and lines look better
                depthBiasSlopeScale: 1,
                depthCompare: 'less',

                stencilFront: {
                    compare: "always",
                    passOp: "replace"
                },
                stencilBack: {
                    compare: "always",
                    passOp: "replace"
                }
            },
        }
        this.pipelineOutline = device.device!.createRenderPipeline(pipelineDef)

        // only touch the depth flag
        pipelineDef.depthStencil!.stencilWriteMask = 0x04

        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }

    bindGroup?: GPUBindGroup
    private createBindGroup(context: Context, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer }
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
        indices: IndexBuffer
    ) {
        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        pass.setVertexBuffer(1, colors.buffer)
        pass.setIndexBuffer(indices.buffer, 'uint32')
        pass.drawIndexed(indices.length)
    }
}
