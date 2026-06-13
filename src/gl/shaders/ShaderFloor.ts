import type { Context } from "../Context"
import { Shader } from "./Shader"

export class ShaderFloor extends Shader {
    pipeline: GPURenderPipeline

    constructor(context: Context) {
        const label = 'floor'
        const device = context.device
        super(device, label)

        const pipelineDef: GPURenderPipelineDescriptor = {
            label,
            layout: device.device.createPipelineLayout({
                label,
                bindGroupLayouts: [context.bindGroupLayout.scene]
            }),
            vertex: {
                module: this.module
            },
            fragment: {
                module: this.module,
                targets: [{ 
                    format: context.presentationFormat,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha'
                        },
                        alpha: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha'
                        },
                    },
                }]
            },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
            depthStencil: {
                depthWriteEnabled: false,
                stencilWriteMask: 0,
                // depthBias: 1, depthBiasSlopeScale: 1,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }
}
