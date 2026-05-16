import type { ColorBuffer } from "../buffers/ColorBuffer"
import type { IndexBuffer } from "../buffers/IndexBuffer"
import type { ModelUniform } from "../buffers/ModelUniform"
import type { PositionBuffer } from "../buffers/PositionBuffer"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import { Texture } from "../buffers/Texture"
import type { Context } from "../Context"
import { ShaderP3_IDX } from "../shaders/ShaderP3_IDX"
import { PICK_SIZE, ShaderP3_PickPoint } from "../shaders/ShaderP3_PickPoint"
import { Controller } from "./Controller"
import { MouseButton } from "./details/MouseButton"

export class EdgeSelectController extends Controller {
    context: Context
    modelUniforms: ModelUniform
    edgeColors: Float32Array
    positions: PositionBuffer
    indices: IndexBuffer
    edgeColorBuffer: ColorBuffer

    constructor(
        context: Context,
        modelUniforms: ModelUniform,
        edgeColors: Float32Array,
        positions: PositionBuffer,
        indices: IndexBuffer,
        edgeColorBuffer: ColorBuffer
    ) {
        super()
        this.context = context
        this.modelUniforms = modelUniforms
        this.edgeColors = edgeColors
        this.positions = positions
        this.indices = indices
        this.edgeColorBuffer = edgeColorBuffer
    }
    override async pointerdown(ev: PointerEvent) {
        if (ev.button !== MouseButton.LEFT) {
            return
        }

        const context = this.context
        const device = context.device
        const canvas = context.canvas
        const modelUniforms = this.modelUniforms
        const edgeColors = this.edgeColors
        const positions = this.positions
        const indices = this.indices
        const edgeColorBuffer = this.edgeColorBuffer

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

        const shaderPickPoints = new ShaderP3_PickPoint(device, context)
        const shaderPickFaces = new ShaderP3_IDX(device, context)

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor(texview))

        shaderPickPoints.draw(pass, context, modelUniforms, positions, 0, edgeColors.length / 3)
        shaderPickFaces.draw(pass, context, modelUniforms, positions, indices, [0, 0, 0, 1])

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

        //
        // find edge closest to pointer position
        //
        let edgeIdx: number = 0
        let distance = Number.MAX_VALUE

        let cx = Math.round(ev.offsetX)
        let cy = Math.round(ev.offsetY)
        let left = Math.max(0, cx - PICK_SIZE)
        let top = Math.max(0, cy - PICK_SIZE)
        let right = Math.min(cx + PICK_SIZE, canvas.width)
        let bottom = Math.min(cy + PICK_SIZE, canvas.height)
        for (let y = top; y < bottom; ++y) {
            for (let x = left; x < right; ++x) {
                const pickIdx = x * 4 + y * bytesPerRow
                const edge = rgba[pickIdx] + (rgba[pickIdx + 1] << 8) + (rgba[pickIdx + 2] << 16)
                if (edge > 0) {
                    const d = Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cy - y, 2))
                    if (d < distance) {
                        distance = d
                        edgeIdx = edge
                    }
                }
            }
        }
        --edgeIdx

        // TODO: search area around mouse click!!!
        // const edgeIdx = rgba[pickIdx] + (rgba[pickIdx + 1] << 8) + (rgba[pickIdx + 2] << 16) - 1
        const edgeColorIdx = edgeIdx * 3
        // console.log(`pointer down ${ev.x}, ${ev.y} -> ${rgba[pickIdx]}, ${rgba[pickIdx + 1]}, ${rgba[pickIdx + 2]}, idx2=${edgeIdx}, idx3=${edgeColorIdx}`)

        readbackBuffer.unmap()
        pickTexture.texture.destroy()

        context.presentationFormat = pf
        context.backgroundColor = cl

        if (edgeIdx >= 0) {
            // toggle color of edge 
            // todo: blender has last selected point in white
            // todo: blender uses shift to add to selection, non-shift to deselect other points
            const v = edgeColors[edgeColorIdx] ? [0, 0, 0] : [1, 0.5, 0]// #fe7900
            edgeColors[edgeColorIdx] = v[0]
            edgeColors[edgeColorIdx + 1] = v[1]
            edgeColors[edgeColorIdx + 2] = v[2]
            device.device.queue.writeBuffer(edgeColorBuffer.buffer, FLOAT32_NUM_BYTES * edgeColorIdx, edgeColors, edgeColorIdx, 3)

            context.invalidate()
        }
    }
}