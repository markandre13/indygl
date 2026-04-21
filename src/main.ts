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
import { Shader_P3 } from './gl/shaders/Shader_P3'
import { Controller } from './gl/controllers/Controller'
import { ShaderP3_C3_Point } from './gl/shaders/ShaderP3_C3_Point'
import { MouseButton } from './gl/controllers/details/MouseButton'
import { FLOAT32_NUM_BYTES } from './gl/buffers/sizeof'

// next steps:
// [ ] update vertex buffer
// [ ] draw lines
// [ ] pick points
// [ ] transformation pipelines
// [X] rotate, fly mode

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
    // const cubeTexture = new Texture()
    // await cubeTexture.load(device.device!!, "Di-3d.png")

    const positions = new PositionBuffer(device, cube_XYZ)
    const edgeColors = new Float32Array(3 * 8)
    const edgeColorBuffer = new ColorBuffer(device, edgeColors)
    const colors = new ColorBuffer(device, cube_RGB)
    const indices = new IndexBuffer(device, cube_IDX)

    const posColUv = new VertexBuffer(device, cube_P4N4T2)
    const posNorm = new VertexBuffer(device, cube_P3N3)

    const shaderPickPoint = new ShaderP3_PickPoint(device, context)
    const shaderPoint = new ShaderP3_C3_Point(device, context)
    const shaderMono = new Shader_P3(device, context)
    const shaderColor = new ShaderP3_C3_IDX(device, context)
    const shaderShadedTexture = new ShaderP4N4T2(device, context)
    const shaderShadedMono = new ShaderP3N3(device, context)

    mat4.translate(context.camera, context.camera, vec3.fromValues(0, 0, -6))

    let updateEdgeColors = false

    context.pushController(new class extends Controller {
        override async pointerdown(ev: PointerEvent) {
            if (ev.button !== MouseButton.LEFT) {
                return
            }

            const pickTexture = new Texture()
            pickTexture.texture = device.device.createTexture({
                label: "pick texture",
                size: [canvas.width, canvas.height],
                format: 'rgba8unorm',
                usage:
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.COPY_SRC |
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            })
            const texview = pickTexture.texture.createView()

            const cl = context.backgroundColor
            const pf = context.presentationFormat

            context.presentationFormat = pickTexture.texture.format
            context.backgroundColor = [0, 0, 0, 1]

            const commandEncoder = device.device!.createCommandEncoder()
            const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor(texview))

            const shader0 = new ShaderP3_PickPoint(device, context)
            const shader1 = new ShaderP3N3(device, context)
            shader0.draw(pass, context, modelUniforms, positions)
            shader1.draw(pass, context, modelUniforms, posNorm, [0, 0, 0, 1])

            pass.end()

            function roundTo(a: number, r: number) {
                return a + (r - a % r)
            }

            const bytesPerRow = roundTo(canvas.width * 4, 256)

            const readbackBuffer = device.device.createBuffer({
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
                size: bytesPerRow * canvas.height,
            })

            commandEncoder.copyTextureToBuffer(
                { texture: pickTexture.texture },
                { buffer: readbackBuffer, offset: 0, bytesPerRow, rowsPerImage: canvas.height },
                { width: canvas.width, height: canvas.height }
            )

            const commandBuffer = commandEncoder.finish()
            device.device.queue.submit([commandBuffer])
            await device.device.queue.onSubmittedWorkDone()

            await readbackBuffer.mapAsync(GPUMapMode.READ)
            const data = readbackBuffer.getMappedRange()
            const rgba = new Uint8Array(data)

            const x = Math.round(ev.x)
            const y = Math.round(ev.y)
            const pickIdx = x * 4 + y * bytesPerRow

            // TODO: search area around mouse click!!!
            const edgeIdx = rgba[pickIdx] + (rgba[pickIdx + 1] << 8) + (rgba[pickIdx + 2] << 16) - 1
            const edgeColorIdx = edgeIdx * 3
            console.log(`pointer down ${ev.x}, ${ev.y} -> ${rgba[pickIdx]}, ${rgba[pickIdx + 1]}, ${rgba[pickIdx + 2]}, idx2=${edgeIdx}, idx3=${edgeColorIdx}`)

            readbackBuffer.unmap()
            pickTexture.texture.destroy()

            context.presentationFormat = pf
            context.backgroundColor = cl

            if (edgeIdx >= 0) {
                const v = edgeColors[edgeColorIdx] ? 0 : 1
                edgeColors[edgeColorIdx] = v
                edgeColors[edgeColorIdx + 1] = v
                edgeColors[edgeColorIdx + 2] = v
                device.device.queue.writeBuffer(edgeColorBuffer.buffer, FLOAT32_NUM_BYTES * edgeColorIdx, edgeColors, edgeColorIdx, 3)
                context.invalidate()
            }
        }
    })

    context.paint = () => {

        const modelViewMatrix = modelUniforms.modelViewMatrix
        mat4.copy(modelViewMatrix, context.camera)

        const normalMatrix = modelUniforms.normalMatrix
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        modelUniforms.writeTo(device)
        context.ajustSize()

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())

        // if (updateEdgeColors) {
        //     device.device.queue.writeBuffer(edgeColorBuffer.buffer, 0, edgeColors) // TODO: write just the color
        //     updateEdgeColors = false
        // }

        // shaderPickPoint.draw(pass, context, modelUniforms, positions)
        shaderPoint.draw(pass, context, modelUniforms, positions, edgeColorBuffer)
        // shaderColor.draw(pass, context, modelUniforms, positions, colors, indices)
        // shaderShadedTexture.draw(pass, context, modelUniforms, posColUv, pickTexture)
        shaderShadedMono.draw(pass, context, modelUniforms, posNorm, [0, 1, 0, 1])
        // shaderMono.draw(pass, context, modelUniforms, positions, indices, [0, 0, 0, 1])

        pass.end()
        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])

        // context.invalidate()
        // requestAnimationFrame(frame)
    }
    // requestAnimationFrame(frame)
}

main()


