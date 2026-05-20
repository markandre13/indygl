import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import type { Context } from "../Context"
import type { Device } from "../Device"
import { Shader } from "./Shader"

/**
 * single vertex consisting of: point4f, normal4f, texCoord2
 */
export class ShaderP3_N3_T2_IDX extends Shader {
    pipeline: GPURenderPipeline
    constructor(device: Device,
        context: Context
    ) {
        super(device, code)
        const label = 'p3-n3-t2-idx'
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
                depthWriteEnabled: true,
                depthBias: 1, // this make points and lines look better
                depthBiasSlopeScale: 1,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)
    }

    // draw(pass: GPURenderPassEncoder,
    //     context: Context,
    //     modelUniforms: ModelUniform,
    //     points: VertexBuffer,
    //     normals: VertexBuffer,
    //     texcoords: VertexBuffer,
    //     texture: Texture,
    //     indices: IndexBuffer,
    //     offset?: number,
    //     length?: number
    // ) {
    //     if (texture.texture !== this.texture) {
    //         this.texture = texture.texture
    //         this.bindGroup = undefined
    //     }
    //     pass.setPipeline(this.pipeline)
    //     pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
    //     pass.setVertexBuffer(0, points.buffer)
    //     pass.setVertexBuffer(1, normals.buffer)
    //     pass.setVertexBuffer(2, texcoords.buffer)
    //     pass.setIndexBuffer(indices.buffer, 'uint32')
    //     pass.drawIndexed(length === undefined ? indices.length : length, 1, offset)
    // }
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
    @group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
    @group(2) @binding(0) var mySampler: sampler;
    @group(2) @binding(1) var myTexture: texture_2d<f32>;

    struct Vertex2Fragment {
        @builtin(position) Position: vec4f,
        @location(0) fragUV: vec2f,
        @location(1) vLighting: vec3f
    }

    @vertex
    fn vertex_main(
        @location(0) position: vec3f,
        @location(1) normal: vec3f,
        @location(2) uv: vec2f
    ) -> Vertex2Fragment {

        let gl_Position = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4f(position.xyz, 1);

        let ambientLight = vec3f(0.3, 0.3, 0.3);
        let directionalLightColor = vec3f(1, 1, 1);
        let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

        let transformedNormal = modelUniforms.uNormalMatrix * vec4f(normal.xyz, 1);

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
        // let color = vec3f(1, 0.5, 0);
        let color = textureSample(myTexture, mySampler, vin.fragUV).rgb;
        return vec4f(color * vin.vLighting, 1);
    }
`