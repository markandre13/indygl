import { ColorBuffer } from "../buffers/ColorBuffer"
import { PositionBuffer } from "../buffers/PositionBuffer"
import type { Context } from "../Context"
import { Shader } from "./Shader"

export class ShaderP3_C3_Point extends Shader {
    pipeline: GPURenderPipeline
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
    }
}
