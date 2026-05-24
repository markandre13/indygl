import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import { type Context } from "../Context"
import { Shader } from "./Shader"

export class ShaderP3_IDX extends Shader {
    pipeline: GPURenderPipeline

    constructor(
        context: Context,
        label = 'p3-idx',
        topology: GPUPrimitiveTopology = 'triangle-list',
        cullMode: GPUCullMode = 'back',
        depthBias = 1,
        depthBiasSlopeScale = 1
    ) {
        const device = context.device
        super(device, 'p3-idx')
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
            primitive: { topology, cullMode },
            depthStencil: {
                depthWriteEnabled: true,
                depthBias, depthBiasSlopeScale,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }
}
