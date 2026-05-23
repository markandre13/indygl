import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import { type Context } from "../Context"
import type { Device } from "../Device"
import code from "./p3-n3-idx.wgsl"
import { Shader } from "./Shader"

export class ShaderP3_N3_IDX extends Shader {
    pipeline: GPURenderPipeline

    constructor(device: Device,
        context: Context
    ) {
        super(device, code, 'p3-n3-idx')
        const label = 'p3-n3-idx'
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
                topology: 'triangle-list',
                cullMode: 'none',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthBias: 1, // this make points and lines look better
                depthBiasSlopeScale: 1,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }
}
