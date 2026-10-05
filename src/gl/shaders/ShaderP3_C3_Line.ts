import { FLOAT32_NUM_BYTES } from "src/gl/buffers/sizeof"
import type { Context } from "src/gl/Context"
import { Shader } from "./Shader"
import { PositionBuffer } from "../buffers/PositionBuffer"
import { ColorBuffer } from "../buffers/ColorBuffer"

export class ShaderP3_C3_Line extends Shader {
    pipeline: GPURenderPipeline
    constructor(context: Context) {
        const label = 'p3-c3-line'
        const device = context.device
        super(device, "p3-c3-idx")
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
                    attributes: [
                        { shaderLocation: 0, ...PositionBuffer.position },
                    ]
                }, {
                    arrayStride: ColorBuffer.bytesPerVertex,
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
            primitive: {
                topology: 'line-list',
                cullMode: 'none',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }
}
