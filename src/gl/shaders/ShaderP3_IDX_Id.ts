import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { Context } from "../Context"
import { Shader } from "./Shader"

/**
 * write id as rgb color
 */
export class ShaderP3_IDX_Id extends Shader {
    pipeline: GPURenderPipeline

    constructor(
        context: Context
    ) {
        const label = 'p3-idx-id'
        const device = context.device
        super(device, label)
        const pipelineDef: GPURenderPipelineDescriptor = {
            label,
            layout: device.device.createPipelineLayout({
                label,
                bindGroupLayouts: [
                    context.bindGroupLayout.scene,
                    context.bindGroupLayout.model,
                    context.bindGroupLayout.materialRGBA
                ]
            }),
            vertex: {
                buffers: [{
                    arrayStride: FLOAT32_NUM_BYTES * 3,
                    attributes: [
                        { shaderLocation: 0, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' },
                    ]
                }],
                module: this.module
            },
            fragment: {
                module: this.module,
                targets: [{ format: context.presentationFormat }]
            },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
            depthStencil: {
                depthWriteEnabled: true,
                depthBias: 1, depthBiasSlopeScale: 1,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }
}
