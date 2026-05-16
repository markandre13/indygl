import { mat4, vec3 } from 'gl-matrix'
import { Context } from './gl/Context'
import { Device } from './gl/Device'
import { ModelUniform } from './gl/buffers/ModelUniform'
import { BasicMode } from './gl/controllers/BasicController'
import { WavefrontObj } from './gl/file/WavefrontObj'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { MainScreen } from './editor/view/MainScreen'
import { IndyNode, Mesh, Root, XForm } from './Mesh'
import { Material } from "./Material"

async function loadMesh(parent: XForm, filename: string) {
    const r = await fetch(filename)
    if (!r.ok) {
        throw Error(`failed to load '${filename}': ${r.status} ${r.statusText}: ${await r.text()}`)
    }
    const obj = new WavefrontObj(filename, await r.text())
    // console.log(obj)
    const mesh = new Mesh(parent, {
        xyz: obj.xyz,
        fxyz: obj.fxyz,
        uv: obj.uv.length > 0 ? obj.uv : undefined,
        fuv: obj.fuv.length > 0 ? obj.uv : undefined,
        normal: obj.normal.length > 0 ? obj.normal : undefined,
        fnormal: obj.fnormal.length > 0 ? obj.fnormal : undefined,
        vcount: obj.vcount
    })
    return mesh
}

export async function main() {
    // start the ui
    const editorModel = new EditorModel()
    replaceChildren(document.body, <MainScreen model={editorModel} />)

    // do all the webgpu stuff:
    const canvas = document.querySelector<HTMLCanvasElement>('canvas') // todo: use ref to get the canvas
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()
    const context = new Context(device, canvas)

    editorModel.transform.signal.add(context.invalidate)
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)
    new ResizeObserver(context.invalidate).observe(canvas) // TODO: shouldn't this be in CanvasContext???
    context.pushController(new BasicMode(context))

    const modelUniform = new ModelUniform(context)
    // const modelBindGroup = new ModelBindGroup(device, modelUniforms)

    const root = new Root(device)
    const teapot = new XForm(root)
    const teapotMesh = await loadMesh(teapot, "obj/utah_teapot.obj")
    teapotMesh.material = new Material(context, [1, 0.5, 0, 1])
    // const teapot = await loadMesh(device, "obj/teeth.obj") // two materials
    // const teapot = await loadMesh(device, "obj/cube.obj") // 4-gons
    const dodecahedron = new XForm(root)
    const dodecahedronMesh = await loadMesh(dodecahedron, "obj/dodecahedron.obj") // 5-gons
    dodecahedronMesh.material = new Material(context, [0, 1, 0, 1])

    // const teapot = await loadMesh(device, "obj/mh/base.obj")
    // console.log(teapot)

    context.paint = () => {
        console.log(`paint`)

        const modelViewMatrix = modelUniform.modelViewMatrix

        // mat4.copy(modelViewMatrix, context.camera)
        // mat4.multiply(modelViewMatrix, context.camera.value, editorModel.transform.value)
        mat4.copy(modelViewMatrix, editorModel.transform.value)
        
        const normalMatrix = modelUniform.normalMatrix
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        modelUniform.writeTo(device)
        context.ajustSize()

        // In a render_pass, all draw calls are executed at the same time, so inserting buffer updates in the render_pass will not give the expected result.

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())

        // https://github.com/gfx-rs/wgpu/issues/733
        //   "all draws within a render pass are executed in parallel"
        // https://webgpu.github.io/webgpu-samples/?sample=occlusionQuery
        //   one uniform buffer & bind group per object...???
        // https://www.reddit.com/r/webgpu/comments/1go20qr/best_way_to_render_multiple_objects_with/
        // https://toji.dev/webgpu-best-practices/bind-groups.html
        // https://www.reddit.com/r/webgpu/comments/1bbwag3/are_dynamic_uniforms_efficient/
        //   bind group per object, groups for: scene, object, material
        // https://www.willusher.io/graphics/2023/04/11/0-to-gltf-bind-groups/
        // https://www.khronos.org/assets/uploads/developers/presentations/WebGPU_Best_Practices_Google.pdf
        // THE LAST ONE IS A GOOD READ!!! by https://toji.dev also the author of glMatrix
        // https://toji.dev/webgpu-gltf-case-study/
        // https://whoisryosuke.com/blog/2025/structure-of-a-webgpu-renderer/
        // https://github.com/AmyangXYZ/reze-engine

        // Render pipelines are also fairly expensive to create, and can cause hitches if you create them while rendering.
        // As a result we’ll want to build all of our render pipelines at the point we load our model, rather than during 
        // the main render loop when it will cause the most visible stutters.

        // pass.setPipeline is also expensive!!!

        pass.setPipeline(context.shader.p3_n3_idx.pipeline)
        pass.setBindGroup(0, context.sceneUniforms.bindGroup)
        function draw(node: IndyNode) {
            if (node instanceof Mesh) {
                pass.setBindGroup(1, modelUniform.bindGroup)
                pass.setBindGroup(2, node.material!.bindGroup)
                pass.setVertexBuffer(0, node.points.buffer)
                pass.setVertexBuffer(1, node.normals.buffer)
                pass.setIndexBuffer(node.indices.buffer, 'uint32')
                pass.drawIndexed(node.indices.length)
            } else {
                for (const child of node.children) {
                    draw(child)
                }
            }
        }
        draw(root)

        pass.end()
        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }

    console.log("main is done")
}

main()