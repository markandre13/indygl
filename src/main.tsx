// import { cubeData, FLOAT32_SIZE, type VertexData } from './geom-cube'

import { mat4, vec3 } from 'gl-matrix'
import { Device } from './gl/Device'
import { CanvasContext } from './gl/CanvasContext'
import { ShaderShadedMono } from './gl/shaders/ShaderShadedMono'
import { ModelUniform } from './gl/buffers/ModelUniform'
import { Texture } from './gl/buffers/Texture'
import { IndexBuffer } from './gl/buffers/IndexBuffer'
import { PositionBuffer } from './gl/buffers/PositionBuffer'
import { ColorBuffer } from './gl/buffers/ColorBuffer'
import { PipelineShadedMono } from './gl/shaders/PipelineShadedMono'
import { cube_IDX, cube_RGB, cube_XYZ } from './cube'

// * create examples for all possible use cases
//   * xyz, norm, uv, rgb, rgba and all their combinations
//   * for performance, when writing to vertex buffers, it might be usefull to cycle through
//     about four of them
//     https://www.reddit.com/r/opengl/comments/155jq8v/whats_better_multiple_vertex_buffers_or_a_single/
// * test them with visual regression tests
//   https://vitest.dev/guide/browser/visual-regression-testing

async function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()
    const context = new CanvasContext(device, canvas)
    const modelUniforms = new ModelUniform(device)

    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = new Texture()
    await cubeTexture.load(device.device!!, "Di-3d.png")

    const positions = new PositionBuffer(device, cube_XYZ)
    const colors = new ColorBuffer(device, cube_RGB)
    const indices = new IndexBuffer(device, cube_IDX)
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

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())
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


