// import { cubeData, FLOAT32_SIZE, type VertexData } from './geom-cube'

import { mat4, vec3 } from 'gl-matrix'
import { FLOAT32_SIZE, type VertexData } from './geom-cube'
import { Device } from './gl/Device'
import { CanvasContext } from './gl/CanvasContext'
import { ShaderShadedMono } from './gl/shaders/ShaderShadedMono'
import { Pipeline } from './gl/shaders/Pipeline'
import type { Shader } from './gl/shaders/Shader'
import { ModelUniform } from './gl/buffers/ModelUniform'
import { Texture } from './gl/buffers/Texture'
import { IndexBuffer } from './gl/buffers/IndexBuffer'
import { PositionBuffer } from './gl/buffers/PositionBuffer'
import { ColorBuffer } from './gl/buffers/ColorBuffer'

// * create examples for all possible use cases
//   * xyz, norm, uv, rgb, rgba and all their combinations
//   * for performance, when writing to vertex buffers, it might be usefull to cycle through
//     about four of them
//     https://www.reddit.com/r/opengl/comments/155jq8v/whats_better_multiple_vertex_buffers_or_a_single/
// * test them with visual regression tests
//   https://vitest.dev/guide/browser/visual-regression-testing

export const cube_XYZ_RGB: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        -1, 1, -1, 0, 0, 1,
        1, 1, -1, 0, 0.5, 1,
        1, -1, -1, 0, 1, 0,
        -1, -1, -1, 0.5, 1, 0,

        -1, 1, 1, 1, 0.5, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0.5,
        -1, -1, 1, 1, 0, 1
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_SIZE * 6,
    /**
     * offsets within vertex
     */
    layout: {
        POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        COLOR: { offset: FLOAT32_SIZE * 3, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

export const cube_XYZ: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        -1, 1, -1,
        1, 1, -1,
        1, -1, -1,
        -1, -1, -1,

        -1, 1, 1,
        1, 1, 1,
        1, -1, 1,
        -1, -1, 1,
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_SIZE * 3,
    /**
     * offsets within vertex
     */
    layout: {
        POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        // COLOR: { offset: FLOAT32_SIZE * 3, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

export const cube_RGB: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        0, 0, 1,
        0, 0.5, 1,
        0, 1, 0,
        0.5, 1, 0,

        1, 0.5, 0,
        1, 0, 0,
        1, 0, 0.5,
        1, 0, 1
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_SIZE * 3,
    /**
     * offsets within vertex
     */
    layout: {
        // POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        COLOR: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

class PipelineShadedMono extends Pipeline {
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

async function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()
    const context = new CanvasContext(device, canvas)

    // uniforms shared by all shaders
    // * projection matrix
    // * lights...

    const modelUniforms = new ModelUniform(device)

    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = new Texture()
    await cubeTexture.load(device.device!!, "Di-3d.png")


    //  0     1
    // 3     2
    //
    //  4     5
    // 7     6
    const positions = new PositionBuffer(device.device!!, cube_XYZ.vertices)
    const colors = new ColorBuffer(device.device!!, cube_RGB.vertices)
    const indices = new IndexBuffer(device.device!!, [
        // top
        0, 1, 2,
        0, 2, 3,
        // left
        0, 3, 7,
        0, 7, 4,
        // back
        1, 0, 4,
        1, 4, 5,
        // front
        3, 2, 6,
        3, 6, 7,
        // right
        1, 5, 6,
        1, 6, 2,
        // bottom
        5, 4, 7,
        5, 7, 6,
    ])
    const module = new ShaderShadedMono(device)
    const shadedTrianglePipeline = new PipelineShadedMono(device, module, context, positions, colors)

    // define the values for shaders '@group(...) @binding(...)' sections
    const bindGroup = device.device!.createBindGroup({
        layout: shadedTrianglePipeline.pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: context.sceneUniforms.buffer },
            { binding: 1, resource: modelUniforms.buffer },
            { binding: 2, resource: context.sampler },
            { binding: 3, resource: cubeTexture.texture!.createView() },
        ],
    })

    // move into context?
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: undefined as any, // assigned later
                clearValue: [0.5, 0.5, 0.5, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: undefined as any, // assigned later
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    }

    let cubeRotation = 0

    // like my OpenGL
    let lastFrameMS = Date.now()

    function frame() {
        const now = Date.now()
        const deltaTime = (now - lastFrameMS) / 1000
        cubeRotation += deltaTime
        lastFrameMS = now

        const modelViewMatrix = modelUniforms.modelViewMatrix
        mat4.identity(modelViewMatrix)
        mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(0, 0, -6))
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, cubeRotation)
        mat4.rotateY(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7)
        mat4.rotateX(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3)

        const normalMatrix = modelUniforms.normalMatrix
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        context.ajustSize()

        // set render destination
        renderPassDescriptor.colorAttachments[0]!.view = context.getCanvasView()
        renderPassDescriptor.depthStencilAttachment!.view = context.getDepthTextureView()

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(renderPassDescriptor)
        {
            pass.setPipeline(shadedTrianglePipeline.pipeline)
            {
                modelUniforms.writeTo(device.device!.queue)
                pass.setBindGroup(0, bindGroup)
                pass.setVertexBuffer(0, positions.buffer)
                pass.setVertexBuffer(1, colors.buffer)
                pass.setIndexBuffer(indices.buffer, 'uint32')
                // pass.draw(testData.vertexCount)
                pass.drawIndexed(indices.length)
            }
            pass.end()
        }
        const commandBuffer = commandEncoder.finish()
        device.device!.queue.submit([commandBuffer])

        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
}

main()


