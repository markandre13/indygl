import type { ColorBuffer } from "../buffers/ColorBuffer"
import type { PositionBuffer } from "../buffers/PositionBuffer"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Pipeline } from "./Pipeline"
import type { Shader } from "./Shader"

export class PipelineShadedMono extends Pipeline {
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
    }
}
