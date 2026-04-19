// import { cubeData, FLOAT32_SIZE, type VertexData } from './geom-cube'

import { mat4, vec3 } from 'gl-matrix'
import { Device } from './gl/Device'
import { CanvasContext } from './gl/CanvasContext'
import { ModelUniform } from './gl/buffers/ModelUniform'
import { Texture } from './gl/buffers/Texture'
import { IndexBuffer } from './gl/buffers/IndexBuffer'
import { PositionBuffer } from './gl/buffers/PositionBuffer'
import { ColorBuffer } from './gl/buffers/ColorBuffer'
import { ShaderP3_C3_IDX } from './gl/shaders/ShaderP3_C3_IDX'
import { cube_IDX, cube_RGB, cube_XYZ } from './cube'
import { ShaderP4N4T2 } from './gl/shaders/ShaderP4N4T2'
import { VertexBuffer } from './gl/buffers/VertexBuffer'
import { cube_P3N3, cube_P4N4T2 } from './geom-cube'
import { ShaderP3N3 } from './gl/shaders/ShaderP3N3'
import { ShaderP3_PickPoint } from './gl/shaders/ShaderP3_PickPoint'
import { BasicMode } from './gl/controllers/BasicController'

// next steps:
// [ ] update vertex buffer
// [ ] draw lines
// [X] pick points
// [ ] transformation pipelines
// [ ] rotate, fly mode

async function main() {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas')
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()
    const context = new CanvasContext(device, canvas)
    context.pushController(new BasicMode(context))
    const modelUniforms = new ModelUniform(device)

    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = new Texture()
    await cubeTexture.load(device.device!!, "Di-3d.png")

    const positions = new PositionBuffer(device, cube_XYZ)
    const colors = new ColorBuffer(device, cube_RGB)
    const indices = new IndexBuffer(device, cube_IDX)

    const posColUv = new VertexBuffer(device, cube_P4N4T2)
    const posNorm = new VertexBuffer(device, cube_P3N3)

    const shaderPickPoint = new ShaderP3_PickPoint(device, context)
    const shaderColor = new ShaderP3_C3_IDX(device, context)
    const shaderShadedTexture = new ShaderP4N4T2(device, context)
    const shaderShadedMono = new ShaderP3N3(device, context)

    let cubeRotation = 0
    let lastFrameMS = Date.now()

    function frame() {
        const now = Date.now()
        const deltaTime = (now - lastFrameMS) / 4000
        // cubeRotation += deltaTime
        lastFrameMS = now

        const modelViewMatrix = modelUniforms.modelViewMatrix
        // mat4.identity(modelViewMatrix)
        mat4.copy(modelViewMatrix, context.camera)
        mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(0, 0, -6))
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, cubeRotation)
        mat4.rotateY(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7)
        mat4.rotateX(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3)

        const normalMatrix = modelUniforms.normalMatrix
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        modelUniforms.writeTo(device)
        context.ajustSize()

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor()) // this is were we could ask to render into a texture

        shaderPickPoint.draw(pass, context, modelUniforms, positions)
        // shaderColor.draw(pass, context, modelUniforms, positions, colors, indices)
        // shaderShadedTexture.draw(pass, context, modelUniforms, posColUv, cubeTexture)
        shaderShadedMono.draw(pass, context, modelUniforms, posNorm, [0, 1, 0, 1])

        pass.end()
        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])

        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
}

main()


