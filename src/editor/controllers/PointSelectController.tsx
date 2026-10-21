import type { Context } from "src/gl/Context"
import { Controller } from "./Controller"
import { MouseButton } from "./details/MouseButton"
import { PICK_SIZE } from "src/gl/shaders/ShaderP3_PickPoint"
import type { IndyNode } from "src/nodes/IndyNode"
import { FLOAT32_NUM_BYTES } from "src/gl/buffers/sizeof"
import { ViewportShading } from "../app/ViewportShading"
import type { Material } from "src/nodes/Material"

// NEXT STEPS
// STEP 1 DONE
// when x-ray mode is off (wire and solid)
// * draw faces in black when during pick
// STEP 1.5
// * draw faces
// STEP 2
// * share duplicate code between (Object|Point)SelectController
// STEP 3
// * the cube with it's separated faces has 3 points per edge
// * in Blender x-ray mode
//   * tool is Tweak
//     * using click, the selection cycles through all points
//     * using shift-click, when there are still unselected
//       edges, they are added one by one
//   * tool is Circle
//     * all points are selected with a single click
//
//   * Blender cycles through all points within the pick radius
//
// * how is blender doing that?
// * i could maintain an extra list tracking overlapping points in
//   world space? (or better: determine overlapping points in view space)

export class PointSelectController extends Controller {
    context: Context
    root: IndyNode
    matBlack: Material

    constructor(context: Context, root: IndyNode, matBlack: Material) {
        super()
        this.context = context
        this.root = root
        this.matBlack = matBlack
    }

    override async pointerdown(ev: PointerEvent) {
        if (ev.button !== MouseButton.LEFT) {
            return
        }

        const context = this.context
        const device = context.device
        const canvas = context.canvas

        const node = context.selection.active?.getMesh()
        if (!node) {
            return
        }

        // console.log('select point')

        const texview = context.getPickTextureView()
        const pickTexture = context.getPickTexture()!

        // FIXME: p3_c3_point draws points with color from buffer
        //        ShaderP3_PickPoint draws points with color from enumeration
        //        and the shaders hasn't been updated yet

        // also: this needs 2 shaders, one for the points, one for the surfaces in black

        const commandEncoder = device.device!.createCommandEncoder({ label: "point-select-controller" })
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor(texview, [0, 0, 0, 1]))

        pass.setBindGroup(0, context.sceneUniforms.bindGroup)
        pass.setBindGroup(1, node.modelView.bindGroup)

        // draw points
        pass.setPipeline(context.shader.p3_pick_point.pipeline)
        pass.setVertexBuffer(0, node.points.buffer)
        pass.draw(
            6, // vertex count
            node.xyz!.length / 3, // instance count
            0, // first vertex
            0  // first index
        )

        // when not in x-ray mode, render surfaces in black
        if (context.editorModel.viewportShading.value != ViewportShading.WIREFRAME_XRAY &&
            context.editorModel.viewportShading.value != ViewportShading.SOLID_XRAY) {

            pass.setPipeline(context.shader.texture.p3_idx.pipeline)
            pass.setBindGroup(2, this.matBlack.bindGroup)

            pass.setIndexBuffer(node.indices.buffer, 'uint32')
            pass.drawIndexed(node.indices.length)
        }

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
            { texture: pickTexture },
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
        // find point closest to pointer position
        //
        let pointIdx: number = 0
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
                        pointIdx = edge
                    }
                }
            }
        }
        --pointIdx

        // for (let y = 0; y < canvas.height; ++y) {
        //     for (let x = 0; x < canvas.width; ++x) {
        //         const pickIdx = x * 4 + y * bytesPerRow
        //         const edge = rgba[pickIdx] + (rgba[pickIdx + 1] << 8) + (rgba[pickIdx + 2] << 16)
        //         if (edge > 0) {
        //             console.log(`${x}, ${y}: ${edge}`)
        //         }
        //     }
        // }

        // TODO: search area around mouse click!!!
        // const edgeIdx = rgba[pickIdx] + (rgba[pickIdx + 1] << 8) + (rgba[pickIdx + 2] << 16) - 1
        const pointColorIdx = pointIdx * 3
        // console.log(`pointer down ${ev.x}, ${ev.y} -> ${rgba[pickIdx]}, ${rgba[pickIdx + 1]}, ${rgba[pickIdx + 2]}, idx2=${edgeIdx}, idx3=${edgeColorIdx}`)

        readbackBuffer.unmap()
        // pickTexture.texture.destroy()
        // console.log(`pointIdx = ${pointIdx}`)

        if (pointIdx >= 0) {
            const edgeColors = node._edgeColors!
            const edgeColorBuffer = node._edgeColorBuffer!

            // toggle color of edge 
            // todo: blender has last selected point in white
            // todo: blender uses shift to add to selection, non-shift to deselect other points
            const v = edgeColors[pointColorIdx] ? [0, 0, 0] : [1, 0.5, 0]// #fe7900
            edgeColors[pointColorIdx] = v[0]
            edgeColors[pointColorIdx + 1] = v[1]
            edgeColors[pointColorIdx + 2] = v[2]
            device.device.queue.writeBuffer(edgeColorBuffer.buffer, FLOAT32_NUM_BYTES * pointColorIdx, edgeColors, pointColorIdx, 3)

            context.invalidate()
        }
    }
}