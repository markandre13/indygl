import type { ColorBuffer } from "../buffers/ColorBuffer"
import type { IndexBuffer } from "../buffers/IndexBuffer"
import type { ModelUniform } from "../buffers/ModelUniform"
import type { PositionBuffer } from "../buffers/PositionBuffer"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Pipeline } from "./Pipeline"
import type { Shader } from "./Shader"

export class PipelineShadedMono extends Pipeline {
    device: Device
    constructor(device: Device, module: Shader, context: CanvasContext, positions: PositionBuffer, colors: ColorBuffer) {
        const pipelineDef: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex: {
                buffers: [{
                    arrayStride: positions.bytesPerVertex,
                    attributes: [
                        { shaderLocation: 0, ...positions.position },
                    ]
                }, {
                    arrayStride: colors.bytesPerVertex,
                    attributes: [
                        { shaderLocation: 1, ...colors.color },
                    ]
                }],
                module: module.module
            },
            fragment: {
                module: module.module,
                targets: [{ format: context.presentationFormat }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        super(device.device!.createRenderPipeline(pipelineDef))
        this.device = device
    }
    bindGroup?: GPUBindGroup
    createBindGroup(context: CanvasContext, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer },
                    // { binding: 2, resource: context.sampler },
                    // { binding: 3, resource: cubeTexture.texture!.createView() },
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
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
        // pass.draw(testData.vertexCount)
        pass.drawIndexed(indices.length)
    }
}