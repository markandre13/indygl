import { mat4, vec3 } from 'gl-matrix'
import { Context } from './gl/Context'
import { Device } from './gl/Device'
import { BasicMode } from './gl/controllers/BasicController'
import { WavefrontObj } from './gl/file/WavefrontObj'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { MainScreen } from './editor/view/MainScreen'
import { IndyNode, Mesh, Root, XForm } from './nodes/Mesh'
import { Material } from "./nodes/Material"
import { deg2rad } from './gl/algorithms/deg2rad'
import { Texture } from './gl/buffers/Texture'

// [ ] render both texture & rgb
// [ ] select object
// [ ] render object as selected
//     Blender, Viewport Overlays, Objects, Outline Selected, Show an outline hightlight around selected objects.
//     source/blender/draw/engines/overlay/overlay_base.hh
//     source/blender/draw/engines/overlay/overlay_outline.hh
//     source/blender/draw/engines/overlay/shaders/overlay_outline_prepass_vert.glsl
//     * the overlay outline prepass writes 2 bits (0-4)
//       * 3 last selected (active): light orange
//       * 1 other selected: dark orange
//       * 0 during transform: white
//     * width: 2px
//     * can be seen through non-selected objects
//     * on intersections with other selected objects
//

// https://www.reddit.com/r/opengl/comments/14jisvu/how_can_i_outline_selected_meshes/
// https://learnopengl.com/Advanced-OpenGL/Stencil-testing

//     https://www.marginallyclever.com/2025/09/drawing-thick-outlines-in-opengl/
//     Ben Golus’ Jump Flood Algorithm (JFA) is the final answer for most people.
//     It’s the hardest to do and the most efficient at run time. 
//     https://en.wikipedia.org/wiki/Jump_flooding_algorithm  
//
//     source/blender/editors/object/object_modes.cc
//       OB_MODE_EDIT | OB_MODE_OBJECT
//     source/blender/editors/object/object_edit.cc
//       context_active_object(), objects_in_mode_or_selected()
//       BKE_view_layer_active_object_get()
//     source/blender/blenkernel/intern/paint.cc
//        /* default to image paint */
//        return &ts->imapaint.paint;
//     maybe start with
//     * move edges by smooth normal to the outside
//     * draw backface culled... (if the orientation is correct...)
//       or draw everything to texture, draw normal object to erase, then compose into image?

// [ ] re-enable edit mode

export async function loadMesh(parent: XForm, filename: string) {
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
        fuv: obj.fuv.length > 0 ? obj.fuv : undefined,
        normal: obj.normal.length > 0 ? obj.normal : undefined,
        fnormal: obj.fnormal.length > 0 ? obj.fnormal : undefined,
        vcount: obj.vcount,
        groupSubset: obj.groupSubset,
        materialSubset: obj.materialSubset
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

    // const modelUniform = new ModelUniform(context)

    const root = new Root(context)

    // const teapot = new XForm(root)
    // const teapotMesh = await loadMesh(teapot, "obj/utah_teapot.obj")
    // teapotMesh.material = new Material(context, [1, 0.5, 0, 1])

    // const teeth = new XForm(root)
    // const teethMesh = await loadMesh(teeth, "obj/teeth.obj") // two materials
    // teethMesh.material = new Material(context, [1, 1, 1, 1])
    // this wrecks the shading, guess through the normal matrix being messed up
    // teeth.transform = mat4.create()
    // mat4.rotateY(teeth.transform, teeth.transform, deg2rad(90))
    // mat4.scale(teeth.transform, teeth.transform, vec3.fromValues(6,6,6))
    // mat4.translate(teeth.transform, teeth.transform, vec3.fromValues(0,-5.5,-1))

    // const teapot = await loadMesh(device, "obj/cube.obj") // 4-gons

    // const dodecahedron = new XForm(root)
    // dodecahedron.transform = mat4.create()
    // mat4.translate(dodecahedron.transform, dodecahedron.transform, vec3.fromValues(3.15,3.4,0))
    // const dodecahedronMesh = await loadMesh(dodecahedron, "obj/dodecahedron.obj") // 5-gons
    // dodecahedronMesh.material = new Material(context, [0, 1, 0, 1])

    // const cube = new XForm(root)
    // const cubeMesh = await loadMesh(cube, "obj/mh/cube.obj")
    // cubeMesh.material = new Material(context, [1, 1, 1, 1])

    const human = new XForm(root)
    const humanMesh = await loadMesh(human, "obj/mh/base.obj")

    const bodyTexture = new Texture()
    await bodyTexture.load(device.device!!, "img/young_caucasian_female_special_suit.jpg")

    // humanMesh.material = new Material(context, [0.996, 0.890, 0.831, 1])
    humanMesh.material = new Material(context, bodyTexture)

    context.paint = () => {
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

        // pass.setPipeline(context.shader.p3_n3_idx.pipeline)
        pass.setPipeline(context.shader.p3_n3_t2_idx.pipeline)
        // pass.setPipeline(context.shader.p3_idx.pipeline)

        pass.setBindGroup(0, context.sceneUniforms.bindGroup)
        function draw(node: IndyNode) {
            if (node instanceof Mesh) {
                if (node.parent instanceof XForm) {
                    if (node.parent.dirty) {
                        if (node.parent.transform) {
                            mat4.copy(node.modelView.modelViewMatrix, node.parent.transform)
                            mat4.invert(node.modelView.normalMatrix, node.parent.transform)
                            mat4.transpose(node.modelView.normalMatrix, node.modelView.normalMatrix)
                        } else {
                            mat4.identity(node.modelView.modelViewMatrix)
                            mat4.identity(node.modelView.normalMatrix)
                        }
                        node.modelView.writeTo(device)
                    }
                }
                pass.setBindGroup(1, node.modelView.bindGroup)

                node.material!.setBindGroup(pass, node)

                pass.setIndexBuffer(node.indices.buffer, 'uint32')
                if (node.groupSubset && node.groupSubset.has("body")) {
                    const group = node.group("body")!
                    pass.drawIndexed(group.length, 1, group.start)
                } else {
                    pass.drawIndexed(node.indices.length)
                }
            } else {
                for (const child of node.children) {
                    draw(child)
                }
                if (node instanceof XForm) {
                    node.dirty = false
                }
            }
        }
        draw(root)

        pass.end()
        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }
}

main()