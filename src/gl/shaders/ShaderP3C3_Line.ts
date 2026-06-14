import { FLOAT32_NUM_BYTES } from "src/gl/buffers/sizeof"
import type { Context } from "src/gl/Context"
import { Shader } from "./Shader"

export class ShaderP3C3_Line extends Shader {
    pipeline: GPURenderPipeline
    constructor(context: Context) {
        const label = 'p3c3-line'
        const device = context.device
        super(device, 'p3c3')
        const pipelineDef: GPURenderPipelineDescriptor = {
            label,
            layout: 'auto',
            vertex: {
                buffers: [{
                    arrayStride: FLOAT32_NUM_BYTES * 6,
                    attributes: [
                        { shaderLocation: 0, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: FLOAT32_NUM_BYTES * 3, format: 'float32x3' },
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
