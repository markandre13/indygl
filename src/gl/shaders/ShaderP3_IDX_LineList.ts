import { ColorUniform } from "../buffers/ColorUniform"
import type { IndexBuffer } from "../buffers/IndexBuffer"
import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Shader } from "./Shader"

export class ShaderP3_IDX_LineList extends Shader {
    pipeline: GPURenderPipeline
    colorUniform: ColorUniform
    constructor(device: Device,
        context: CanvasContext
    ) {
        super(device, code)
        this.colorUniform = new ColorUniform(device)
        const pipelineDef: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex: {
                buffers: [{
                    arrayStride: PositionBuffer.bytesPerVertex,
                    attributes: [
                        { shaderLocation: 0, ...PositionBuffer.position },
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
                depthCompare: 'less-equal',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }
    
    bindGroup?: GPUBindGroup
    private createBindGroup(context: CanvasContext, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer },
                    { binding: 2, resource: this.colorUniform.buffer }
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
        modelUniforms: ModelUniform,
        positions: PositionBuffer,
        indices: IndexBuffer,
        rgba: ArrayLike<number>
    ) {
        this.colorUniform.rgba = rgba
        this.colorUniform.writeTo(this.device)

        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
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
    struct ColorUniforms {
        uColor: vec4f
    };
    @group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
    @group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;
    @group(0) @binding(2) var<uniform> colorUniforms: ColorUniforms;

    struct Vertex2Fragment {
        @builtin(position) Position: vec4f
    }

    @vertex
    fn vertex_main(
        @location(0) position: vec3f
    ) -> Vertex2Fragment {
        let pos = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(position, 1);
        return Vertex2Fragment(pos);
    }

    @fragment
    fn fragment_main(
        vin: Vertex2Fragment
    ) -> @location(0) vec4f {
        return colorUniforms.uColor;
    }
`