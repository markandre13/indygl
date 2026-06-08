import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { Context } from "../Context"
import { Shader } from "./Shader"

export class ShaderOutline extends Shader {
    outlineBindGroupLayout: GPUBindGroupLayout
    pipeline: GPURenderPipeline
    postProcessRenderPassDescriptor: GPURenderPassDescriptor
    // postProcessBindGroup: GPUBindGroup

    constructor(context: Context) {
        const label = 'outline'
        const device = context.device
        super(context.device, label)

        this.outlineBindGroupLayout = device.device!.createBindGroupLayout({
            label: 'outline',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'uint'
                }
            }]
        })!

        const outlinePipelineLayout = device.device?.createPipelineLayout({
            label: 'outline',
            bindGroupLayouts: [this.outlineBindGroupLayout]
        })!

        this.pipeline = device.device!.createRenderPipeline({
            layout: outlinePipelineLayout,
            vertex: { module: this.module },
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
                }],
            },
        })

        this.postProcessRenderPassDescriptor = {
            label: 'outline',
            colorAttachments: [
                { loadOp: 'load', storeOp: 'store' },
            ],
        } as GPURenderPassDescriptor

        // this.postProcessBindGroup = device.device!.createBindGroup({
        //     label: 'outline',
        //     layout: this.outlineBindGroupLayout,
        //     entries: [
        //         {
        //             binding: 0, 
        //             resource: context.depthTexture!.createView(
        //                 { aspect: 'stencil-only' }
        //             )
        //         },
        //     ],
        // })

    }
}
