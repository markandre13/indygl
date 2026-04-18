import type { ModelUniform } from "../buffers/ModelUniform"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { VertexBuffer } from "../buffers/VertexBuffer"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Shader } from "./Shader"

export class Shader_P4N4T2 extends Shader {
    pipeline: GPURenderPipeline
    constructor(device: Device,
        context: CanvasContext
    ) {
        super(device, code)
        const pipelineDef: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex: {
                buffers: [{
                    arrayStride: FLOAT32_NUM_BYTES * 10,
                    attributes: [
                        { shaderLocation: 0, offset: FLOAT32_NUM_BYTES * 0, format: 'float32x4' },
                        { shaderLocation: 1, offset: FLOAT32_NUM_BYTES * 4, format: 'float32x4' },
                        { shaderLocation: 2, offset: FLOAT32_NUM_BYTES * 8, format: 'float32x2' }
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
    private createBindGroup(context: CanvasContext, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer },
                    { binding: 2, resource: context.sampler },
                    // { binding: 3, resource: cubeTexture.texture!.createView() },
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
        modelUniforms: ModelUniform,
        positions: VertexBuffer,
    ) {
        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        pass.draw(positions.buffer.size / FLOAT32_NUM_BYTES / 10)
    }
}

const code = /* wgsl */`
    struct SceneUniforms { 
        uProjectionMatrix: mat4x4f,
    };
    struct ModelUniforms { 
        uModelViewMatrix: mat4x4f,
        uNormalMatrix: mat4x4f,
    };
    @group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
    @group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;
    @group(0) @binding(2) var mySampler: sampler;
    // @group(0) @binding(3) var myTexture: texture_2d<f32>;

    struct Vertex2Fragment {
        @builtin(position) Position: vec4f,
        @location(0) fragUV: vec2f,
        @location(1) vLighting: vec3f
    }

    @vertex
    fn vertex_main(
        @location(0) position: vec4f,
        @location(1) normal: vec4f,
        @location(2) uv: vec2f
    ) -> Vertex2Fragment {

        let gl_Position = uniforms.uProjectionMatrix * uniforms.uModelViewMatrix * position;

        let ambientLight = vec3f(0.3, 0.3, 0.3);
        let directionalLightColor = vec3f(1, 1, 1);
        let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

        let transformedNormal = uniforms.uNormalMatrix * vec4f(normal.xyz, 1);

        let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        let vLighting = ambientLight + (directionalLightColor * directional);

        return Vertex2Fragment(
            gl_Position,
            uv,
            vLighting
        );
    }

    @fragment
    fn fragment_main(
        vin: Vertex2Fragment
    ) -> @location(0) vec4f {
        let color = vec3f(1, 0.5, 0);
        // let color = textureSample(myTexture, mySampler, vin.fragUV).rgb;
        return vec4f(color * vin.vLighting, 1);
    }
`