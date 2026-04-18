import { ColorBuffer } from "../buffers/ColorBuffer"
import type { IndexBuffer } from "../buffers/IndexBuffer"
import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Shader } from "./Shader"

export class Shader_XYZ_RGB_IDX extends Shader {
    pipeline: GPURenderPipeline
    constructor(device: Device,
        context: CanvasContext
    ) {
        super(device, code)
        const pipelineDef: GPURenderPipelineDescriptor = {
            layout: 'auto',
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
                topology: 'triangle-list',
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
    bindGroup?: GPUBindGroup
    createBindGroup(context: CanvasContext, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer }
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
        modelUniforms: ModelUniform,
        positions: PositionBuffer,
        colors: ColorBuffer,
        indices: IndexBuffer
    ) {
        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        pass.setVertexBuffer(1, colors.buffer)
        pass.setIndexBuffer(indices.buffer, 'uint32')
        pass.drawIndexed(indices.length)
    }
}

const code = /* wgsl */ `
    struct SceneUniforms { 
        uProjectionMatrix: mat4x4f,
    };
    struct ModelUniforms { 
        uModelViewMatrix: mat4x4f,
        uNormalMatrix: mat4x4f,
    };
    @group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
    @group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;

    struct Vertex2Fragment {
        @builtin(position) Position: vec4f,
        @location(0) rgb: vec3f
    }

    @vertex
    fn vertex_main(
        @location(0) position: vec3f,
        @location(1) rgb: vec3f
    ) -> Vertex2Fragment {
        let pos = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(position, 1);
        return Vertex2Fragment(pos, rgb);
    }

    @fragment
    fn fragment_main(
        vin: Vertex2Fragment
    ) -> @location(0) vec4f {
        return vec4f(vin.rgb, 1);
    }
`