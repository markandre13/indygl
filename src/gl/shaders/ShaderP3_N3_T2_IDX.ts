import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { Context } from "../Context"
import { Shader } from "./Shader"

/**
 * single vertex consisting of: point4f, normal4f, texCoord2
 */
export class ShaderP3_N3_T2_IDX extends Shader {
    pipeline: GPURenderPipeline
    pipelineOutline: GPURenderPipeline
    constructor(context: Context) {
        const label = 'p3-n3-t2-idx'
        const device = context.device
        super(device, label)
        const pipelineDef: GPURenderPipelineDescriptor = {
            label,
            layout: device.device.createPipelineLayout({
                label,
                bindGroupLayouts: [
                    context.bindGroupLayout.scene,
                    context.bindGroupLayout.model,
                    context.bindGroupLayout.materialTexture
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
                }, {
                    arrayStride: FLOAT32_NUM_BYTES * 2,
                    attributes: [
                        { shaderLocation: 2, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x2' }
                    ]
                }
                ],
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
}
