import type { ModelUniform } from "../buffers/ModelUniform"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import { Uniform } from "../buffers/Uniform"
import type { VertexBuffer } from "../buffers/VertexBuffer"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Shader } from "./Shader"

export class ShaderP3N3 extends Shader {
    pipeline: GPURenderPipeline
    colorUniform: Uniform
    constructor(device: Device,
        context: CanvasContext
    ) {
        super(device, code)
        this.colorUniform = new Uniform(device.device, ["vec4f"])
        const pipelineDef: GPURenderPipelineDescriptor = {
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
                    { binding: 2, resource: this.colorUniform.buffer },
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
        modelUniforms: ModelUniform,
        vertices: VertexBuffer,
        rgba: number[]
    ) {
        const color = this.colorUniform.values[0]
        color[0] = rgba[0]
        color[1] = rgba[1]
        color[2] = rgba[2]
        color[3] = rgba[3]
        this.colorUniform.writeTo(this.device)

        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, vertices.buffer)
        pass.draw(vertices.buffer.size / FLOAT32_NUM_BYTES / 6)
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
    struct ColorUniforms {
        uColor: vec4f
    }
    @group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
    @group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;
    @group(0) @binding(2) var<uniform> colorUniforms: ColorUniforms;

    struct Vertex2Fragment {
        @builtin(position) Position: vec4f,
        @location(0) vLighting: vec3f
    }

    @vertex
    fn vertex_main(
        @location(0) position: vec4f,
        @location(1) normal: vec4f,
    ) -> Vertex2Fragment {

        let gl_Position = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * position;

        let ambientLight = vec3f(0.3, 0.3, 0.3);
        let directionalLightColor = vec3f(1, 1, 1);
        let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

        let transformedNormal = modelUniforms.uNormalMatrix * vec4f(normal.xyz, 1);

        let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        let vLighting = ambientLight + (directionalLightColor * directional);

        return Vertex2Fragment(
            gl_Position,
            vLighting
        );
    }

    @fragment
    fn fragment_main(
        vin: Vertex2Fragment
    ) -> @location(0) vec4f {
        return vec4f(colorUniforms.uColor.xyz * vin.vLighting, colorUniforms.uColor.w);
    }
`