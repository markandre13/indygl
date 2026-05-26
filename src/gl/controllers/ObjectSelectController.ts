import { IndyNode, Mesh } from "src/nodes/Mesh"
import { Texture } from "../buffers/Texture"
import type { Context } from "../Context"
import { ShaderP3_IDX_Id } from "../shaders/ShaderP3_IDX_Id"
import { PICK_SIZE } from "../shaders/ShaderP3_PickPoint"
import { Controller } from "./Controller"
import { MouseButton } from "./details/MouseButton"

// [X] do this one quick'n dirty
// [ ] then get the edge select controller working
// [ ] then share code between the two via a new class called PickController

export class ObjectSelectController extends Controller {
    context: Context
    root: IndyNode
    constructor(context: Context, root: IndyNode) {
        super()
        this.context = context
        this.root = root
    }
    override async pointerdown(ev: PointerEvent) {
        if (ev.button !== MouseButton.LEFT) {
            return
        }

        const context = this.context
        const device = context.device
        const canvas = context.canvas

        const pickTexture = new Texture()
        pickTexture.texture = device.device.createTexture({
            label: "pick-texture",
            size: [canvas.width, canvas.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.COPY_SRC |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })
        const texview = pickTexture.texture.createView()

        const pickShader = new ShaderP3_IDX_Id(this.context, pickTexture.texture.format)

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor(texview, [0, 0, 0, 1]))

        pass.setBindGroup(0, context.sceneUniforms.bindGroup)

        pass.setPipeline(pickShader.pipeline)

        const allObjects: IndyNode[] = []
        function prepare(node: IndyNode) {
            if (node instanceof Mesh) {
                pass.setBindGroup(1, node.modelView.bindGroup)
                pass.setVertexBuffer(0, node.points.buffer)
                pass.setIndexBuffer(node.indices.buffer, 'uint32')
                pass.drawIndexed(node.indices.length, 1, 0, 0, allObjects.length)
                allObjects.push(node)
            }
            for (const child of node.children) {
                prepare(child)
            }
        }
        prepare(this.root)

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
        let index: number = 0
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
                const thisIndex = rgba[pickIdx] + (rgba[pickIdx + 1] << 8) + (rgba[pickIdx + 2] << 16)
                if (thisIndex > 0) {
                    const thisDistance = Math.sqrt(Math.pow(cx - x, 2) + Math.pow(cy - y, 2))
                    if (thisDistance < distance) {
                        distance = thisDistance
                        index = thisIndex
                    }
                }
            }
        }
        --index

        readbackBuffer.unmap()
        pickTexture.texture.destroy()

        //
        // add to selection
        //

        // TODO: move the logic below into Selection
        if (!ev.shiftKey) {
            this.context.selection.clear()
        }
        if (index >= 0) {
            if (this.context.selection.active === allObjects[index]) {
                this.context.selection.active = undefined
                this.context.selection.selected.delete(allObjects[index])
            } else {
                this.context.selection.add(allObjects[index])
            }
        }
        this.context.invalidate()
    }
}

