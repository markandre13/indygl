import { mat4, vec3 } from 'gl-matrix'
import { CanvasContext } from './gl/CanvasContext'
import { Device } from './gl/Device'
import { quadsToEdges } from './gl/algorithms/quadsToEdges'
import { quadsToFlatTriangles } from './gl/algorithms/quadsToFlatTriangles'
import { ColorBuffer } from './gl/buffers/ColorBuffer'
import { IndexBuffer } from './gl/buffers/IndexBuffer'
import { ModelUniform } from './gl/buffers/ModelUniform'
import { PositionBuffer } from './gl/buffers/PositionBuffer'
import { Texture } from './gl/buffers/Texture'
import { VertexBuffer } from './gl/buffers/VertexBuffer'
import { FLOAT32_NUM_BYTES } from './gl/buffers/sizeof'
import { BasicMode } from './gl/controllers/BasicController'
import { Controller } from './gl/controllers/Controller'
import { MouseButton } from './gl/controllers/details/MouseButton'

import { ShaderP3 } from './gl/shaders/ShaderP3'
import { ShaderP3N3 } from './gl/shaders/ShaderP3N3'
import { ShaderP3_C3_IDX } from './gl/shaders/ShaderP3_C3_IDX'
import { ShaderP3_C3_Point } from './gl/shaders/ShaderP3_C3_Point'
import { ShaderP3_IDX_LineList } from './gl/shaders/ShaderP3_IDX_LineList'
import { ShaderP3_N3_IDX } from './gl/shaders/ShaderP3_N3_IDX'
import { PICK_SIZE, ShaderP3_PickPoint } from './gl/shaders/ShaderP3_PickPoint'
import { ShaderP4N4T2 } from './gl/shaders/ShaderP4N4T2'
import { ShaderP3_IDX } from './gl/shaders/ShaderP3_IDX'
import { ShaderP3_C3_IDX_LineList } from './gl/shaders/ShaderP3_C3_IDX_LineList'
import { WavefrontObj } from './gl/file/WavefrontObj'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { MainScreen } from './editor/view/MainScreen'
import { ViewportShading } from './editor/app/ViewportShading'
import { SelectionMode } from './editor/app/SelectionMode'
import { subset_P3_IDX } from './gl/algorithms/subset_P3_IDX'
import { ShaderP3_N3_IDX_Alpha } from './gl/shaders/ShaderP3_N3_IDX_Alpha'
import { quadsToTriangles } from './gl/algorithms/quadsToTriangles'
import { calculateNormalsQuads } from './gl/algorithms/calculateNormalsQuads'

// add some ui element from blender and extend toad.js with a blender like style for that (smaller ui elements)
// could write a screenshot test for that in toad.js too!!!

// next steps:
// [ ] update vertex buffer
// [X] draw lines
// [X] pick points
// [ ] transformation pipelines
// [X] rotate, fly mode

// for the rest: try to build something usable for the morph editor.
// [ ] import some meshes

// [ ] edit mode: mesh symmetry: x, y, z
// [ ] select via click, circle, rectangle

// mimic some more things from the blender ui:
// [ ] wireframe, solid, 
// [ ] x-ray
// [ ] interaction mode: object, edit, ...
// [ ] select mode: vertex, line, face
// [ ] draw ground

/*
blender starts with solid
           object                                          edit
wireframe  orange edges, gray, not shaded, not smooth    + edges, points, faces
solid:     orange outline, gray, shaded, smooth          + edges, points, faces (depthbuffer disabled? not quite? hidden e&p have another color)

X render subset (subset operator? later...) we need the subset to test transparency
X do the transparent stuff
X smooth shading
-> texture
-> transform using the panel on the right
*/

export async function main() {
    const editorModel = new EditorModel()
    replaceChildren(document.body, <MainScreen model={editorModel} />)

    const canvas = document.querySelector<HTMLCanvasElement>('canvas')
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    // const r = await fetch("obj/arkit/Neutral.obj")
    // const r = await fetch("obj/mh/cube.obj")
    const r = await fetch("obj/mh/base.obj")

    if (!r.ok) {
        console.log(`${r.status} ${r.statusText}: ${await r.text()}`)
    }
    const neutral = new WavefrontObj("Neutral.obj", await r.text())
    // console.log(mesh)

    const device = new Device()
    await device.init()
    const context = new CanvasContext(device, canvas)

    new ResizeObserver(context.invalidate).observe(canvas)

    context.pushController(new BasicMode(context))
    const modelUniforms = new ModelUniform(device)

    // Fetch the image and upload it into a GPUTexture.
    // const cubeTexture = new Texture()
    // await cubeTexture.load(device.device!!, "Di-3d.png")
    // const mesh = {
    //     positions: cube_XYZ,
    //     quads: cube_quads
    // }

    // const obj = {
    //     positions: neutral.xyz,
    //     quads: neutral.fxyz
    // }

    const bodyGroup = neutral.getFaceGroup("body")!
    const body = subset_P3_IDX(neutral.xyz, neutral.fxyz, bodyGroup.startIndex, bodyGroup.startIndex + bodyGroup.length)
    const obj = {
        positions: body.xyz,
        quads: body.fxyz
    }
    // const mesh = quadsToFlatTriangles(obj.positions, obj.quads)

    const mesh = {
        positions: obj.positions,
        indices: quadsToTriangles(obj.quads),
        normals: calculateNormalsQuads(undefined, obj.positions, obj.quads)
    }
    const edges = quadsToEdges(obj.quads)

    const positions = new PositionBuffer(device, mesh.positions)
    const normals = new VertexBuffer(device, mesh.normals)
    const indices = new IndexBuffer(device, mesh.indices)

    const edgeIndices = new IndexBuffer(device, edges)

    // const positions = new PositionBuffer(device, cube_XYZ)
    const edgeColors = new Float32Array(mesh.positions.length /*3 * cube_XYZ.length*/)
    const edgeColorBuffer = new ColorBuffer(device, edgeColors)
    // const colors = new ColorBuffer(device, cube_RGB)
    // const indices = new IndexBuffer(device, cube_IDX)

    // const posColUv = new VertexBuffer(device, cube_P4N4T2)
    // const posNorm = new VertexBuffer(device, cube_P3N3)

    const shaderShadedMono = new ShaderP3_N3_IDX(device, context)
    // const shaderShadedMono = new ShaderP3_N3_IDX_Alpha(device, context)
    // const shaderPickPoint = new ShaderP3_PickPoint(device, context)
    const shaderPickPoints = new ShaderP3_C3_Point(device, context)
    // const shaderMono = new Shader_P3(device, context)
    // const shaderColor = new ShaderP3_C3_IDX(device, context)
    // const shaderShadedTexture = new ShaderP4N4T2(device, context)
    // const shaderShadedMono = new ShaderP3N3(device, context)
    const shaderLines = new ShaderP3_C3_IDX_LineList(device, context) // need ShaderP3_C3_IDX_LineList

    mat4.translate(context.camera, context.camera, vec3.fromValues(0, 0, -24))

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

            const shaderPickPoints = new ShaderP3_PickPoint(device, context)
            const shaderPickFaces = new ShaderP3_IDX(device, context)

            const commandEncoder = device.device!.createCommandEncoder()
            const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor(texview))

            shaderPickPoints.draw(pass, context, modelUniforms, positions, 0, obj.positions.length / 3)
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

            let cx = Math.round(ev.x)
            let cy = Math.round(ev.y) - 2 // FIXME
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

                const v = edgeColors[edgeColorIdx] ? 0 : 1
                edgeColors[edgeColorIdx] = v
                edgeColors[edgeColorIdx + 1] = v
                edgeColors[edgeColorIdx + 2] = v
                device.device.queue.writeBuffer(edgeColorBuffer.buffer, FLOAT32_NUM_BYTES * edgeColorIdx, edgeColors, edgeColorIdx, 3)

                context.invalidate()
            }
        }
    })
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)

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

        // shaderPickPoint.draw(pass, context, modelUniforms, positions)
        if (editorModel.selectionMode.value !== SelectionMode.OBJECT) {
            shaderPickPoints.draw(pass, context, modelUniforms, positions, edgeColorBuffer, 0, obj.positions.length / 3)
        }
        // shaderColor.draw(pass, context, modelUniforms, positions, colors, indices)
        // shaderShadedTexture.draw(pass, context, modelUniforms, posColUv, pickTexture)
        // shaderShadedMono.draw(pass, context, modelUniforms, posNorm, [0, 1, 0, 1])
        // shaderMono.draw(pass, context, modelUniforms, positions, indices, [0, 0, 0, 1])
        if ([ViewportShading.WIREFRAME].includes(editorModel.viewportShading.value)) {
            shaderShadedMono.draw(pass, context, modelUniforms, positions, normals, indices, [0.6, 0.6, 0.6, 1])
        }
        if ([ViewportShading.SOLID_XRAY, ViewportShading.SOLID].includes(editorModel.viewportShading.value)) {
            shaderShadedMono.draw(pass, context, modelUniforms, positions, normals, indices, [1, 0.8, 0.7, 0.5])
        }
        if ([ViewportShading.WIREFRAME_XRAY, ViewportShading.WIREFRAME, ViewportShading.SOLID_XRAY].includes(editorModel.viewportShading.value)) {
            shaderLines.draw(pass, context, modelUniforms, positions, edgeColorBuffer, edgeIndices)
        }

        pass.end()
        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }
}

main()