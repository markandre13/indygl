import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Shader } from "./Shader"

export class ShaderP3_PickPoint extends Shader {
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
                    stepMode: 'instance',
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
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
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
                    { binding: 1, resource: modelUniforms.buffer }
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
        modelUniforms: ModelUniform,
        positions: PositionBuffer
    ) {
        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        pass.draw(6, positions.buffer.size / 3 / FLOAT32_NUM_BYTES)
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

    struct VSOutput {
        @builtin(position) Position: vec4f,
        @location(0) color: vec4f,
    }

    @vertex
    fn vertex_main(
        @location(0) vert: vec3f,
        @builtin(vertex_index) vNdx: u32,
        @builtin(instance_index) iNdx: u32,
    ) -> VSOutput {
        let rectangle = array(
            vec2f(-1, -1), vec2f( 1, -1), vec2f(-1,  1),
            vec2f(-1,  1), vec2f( 1, -1), vec2f( 1,  1),
        );
        let pos = rectangle[vNdx];
        let clipPos = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(vert, 1);
        let scale = vec2f(0.01, 0.01);
        let pointPos = vec4f(pos * scale * clipPos.w, 0, 0);
        let color = vec4f(f32(iNdx) / 8.0, 0, 0, 1);
        return VSOutput(clipPos + pointPos, color);
    }

    @fragment
    fn fragment_main(
        vin: VSOutput
    ) -> @location(0) vec4f {
        return vin.color;
    }
`