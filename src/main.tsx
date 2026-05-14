import { mat4, vec3 } from 'gl-matrix'
import { CanvasContext } from './gl/CanvasContext'
import { Device } from './gl/Device'
import { ModelUniform } from './gl/buffers/ModelUniform'
import { BasicMode } from './gl/controllers/BasicController'
import { ShaderP3_N3_IDX } from './gl/shaders/ShaderP3_N3_IDX'
import { ShaderP3_IDX } from './gl/shaders/ShaderP3_IDX'
import { WavefrontObj } from './gl/file/WavefrontObj'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { MainScreen } from './editor/view/MainScreen'
import { ShaderP3_N3_IDX_Alpha } from './gl/shaders/ShaderP3_N3_IDX_Alpha'
import { IndyNode, Material, Mesh, Root, XForm } from './Mesh'
import { ColorUniform } from './gl/buffers/ColorUniform'
import type { SceneUniform } from './gl/buffers/SceneUniform'

// [ ] make rendering more generic: like a mesh object?
//     https://graphics.cs.utah.edu/teapot/
//     https://en.wikipedia.org/wiki/Utah_teapot
//
//  [ ] have cube, human and teapot a the same time
//  [ ] select object with pointer
//  [ ] move object with pointer
//
// blender tree:
//   Scene Collection (name can't be changed)
//     Collection
//       Camera
//         Camera
//       Cube
//         Cube
//           Material
//       Light
//         Light
// usd tree
//   Xform root (UsdGeomXform)
//     Xform Cube ;; custom string userProperties:blender:object_name = "Cube"
//       Mesh     ;; custom string userProperties:blender:data_name = "Cube"
//         UsdGeomMesh
//   Scope
//     Material
//       Shader
//   DomeLight
//
// https://docs.blender.org/manual/en/2.80/modeling/meshes/editing/edges.html
// * Seams are a way to create separations, “islands”, in UV maps.
// * Crease: This edge property, a value between (0.0 to 1.0), is used by the 
//   Subdivision Surface Modifier to control the sharpness of the edges in the
//   subdivided mesh.
// * Sharp: exlude from smooth shading
// * Bevel weight
// For editing
// slide (move edge using constraints), rotate (rotate edge and create new points), splice, bridge (connect groups of points)


// USD and WavefrontObj have similar data structures for meshes
//
// faceVertexCounts: int[]      vcount
// faceVertexIndices: int[]     fxyz
// normals: normal3f[]          normal
// points: point3f[]            xyz
// primvars:st: texCoord2f[]    uv
// primvars:st:indices: int[]   fuv
//
// but for editing i will need my own internal data format
//
// face:
//    flat/smooth
//    material <- that's the one we want to distinguish teeth and gum
// edges:
//    sharp <-- that's the one we want for fingernails
//    seam
//    ...
//
// ./source/blender/bmesh/bmesh.hh
// loops: https://docs.blender.org/manual/en/latest/modeling/meshes/selecting/loops.html
// class BMesh {
//   BMVert {
//      float co[3] // vertex coordinate
//      float no[3] // vertex normal
//   }
//   BMEdge {
//      v1, v2
//   }
//     edge/vert/face/loop
// }

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
X transform using the panel on the right
[ ] panel: propper styles for headings
[X] fix select point (location is of)
[ ] select multiple tuple elements

[ ] nicer api for SpringLayout
[ ] propper tests for SpringLayout
[X] edges aren't completly visible (persist camera position to debug this)
[X] status bar icons for mouse buttons and special keys
[X] texture
[ ] draw ground
[ ] draw axis

[ ] menubar (via toad styles: big and small)
[ ] undo/redo
[ ] two objects (MH & ARKit neutral)
*/

class ShaderCollection {
    // readonly p3_idx: ShaderP3_IDX
    readonly p3_n3_idx: ShaderP3_N3_IDX
    // readonly p3_n3_idx_alpha: ShaderP3_N3_IDX_Alpha

    constructor(context: CanvasContext) {
        const device = context.device
        this.p3_n3_idx = new ShaderP3_N3_IDX(device, context)
        // this.p3_n3_idx_alpha = new ShaderP3_N3_IDX_Alpha(device, context)
        // // const shaderPickPoint = new ShaderP3_PickPoint(device, context)
        // const shaderPickPoints = new ShaderP3_C3_Point(device, context)
        // this.p3_idx = new ShaderP3_IDX(device, context)

        // // const shaderColor = new ShaderP3_C3_IDX(device, context)
        // const shaderShadedTexture = new ShaderP4N4T2(device, context)
        // const shaderShadedTexture2 = new ShaderP3_N3_T2(device, context)
        // const shaderShadedTexture3 = new ShaderP3_N3_T2_IDX(device, context)
        // // const shaderShadedMono = new ShaderP3N3(device, context)
        // const shaderLines = new ShaderP3_C3_IDX_LineList(device, context) // need ShaderP3_C3_IDX_LineList
    }
}

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

// one per model
export class ModelBindGroup {
    static layout: GPUBindGroupLayout
    bindGroup: GPUBindGroup
    constructor(device: Device, model: ModelUniform) {
        if (ModelBindGroup.layout === undefined) {
            ModelBindGroup.layout = device.device.createBindGroupLayout({
                label: 'model-bind-group-layout',
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                        minBindingSize: 0
                    }
                }]
            })
        }
        this.bindGroup = device.device.createBindGroup({
            label: 'model-bind-group',
            layout: ModelBindGroup.layout,
            entries: [
                { binding: 0, resource: model },
            ],
        })
    }
}

// one per material
export class MaterialBindGroup {
    static layout: GPUBindGroupLayout
    bindGroup: GPUBindGroup
    constructor(device: Device, color: ColorUniform) {
        if (MaterialBindGroup.layout === undefined) {
            MaterialBindGroup.layout = device.device.createBindGroupLayout({
                label: 'material-bind-group-layout',
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                        minBindingSize: 0
                    }
                }]
            })
        }
        this.bindGroup = device.device.createBindGroup({
            label: 'material-bind-group',
            layout: MaterialBindGroup.layout,
            entries: [
                { binding: 0, resource: color },
            ],
        })
    }
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
    const context = new CanvasContext(device, canvas)

    editorModel.transform.signal.add(context.invalidate)
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)
    new ResizeObserver(context.invalidate).observe(canvas) // TODO: shouldn't this be in CanvasContext???
    context.pushController(new BasicMode(context))

    const modelUniforms = new ModelUniform(device)
    const modelBindGroup = new ModelBindGroup(device, modelUniforms)

    const colorUniform0 = new ColorUniform(device)
    colorUniform0.rgba = [1, 0.5, 0, 1]
    const materialBindGroup0 = new MaterialBindGroup(device, colorUniform0)
    colorUniform0.writeTo(device)

    const colorUniform1 = new ColorUniform(device)
    colorUniform1.rgba = [0, 1, 0, 1]
    const materialBindGroup1 = new MaterialBindGroup(device, colorUniform1)
    colorUniform1.writeTo(device)

    const shader = new ShaderCollection(context)

    const root = new Root(device)
    const teapot = new XForm(root)
    const teapotMesh = await loadMesh(teapot, "obj/utah_teapot.obj")
    teapotMesh.material = new Material(device, [1, 0.5, 0, 1])
    // const teapot = await loadMesh(device, "obj/teeth.obj") // two materials
    // const teapot = await loadMesh(device, "obj/cube.obj") // 4-gons
    const dodecahedron = new XForm(root)
    const dodecahedronMesh = await loadMesh(dodecahedron, "obj/dodecahedron.obj") // 5-gons
    dodecahedronMesh.material = new Material(device, [0, 1, 0, 1])

    // const teapot = await loadMesh(device, "obj/mh/base.obj")
    // console.log(teapot)

    context.paint = () => {

        const modelViewMatrix = modelUniforms.modelViewMatrix

        // mat4.copy(modelViewMatrix, context.camera)
        mat4.multiply(modelViewMatrix, context.camera.value, editorModel.transform.value)

        const normalMatrix = modelUniforms.normalMatrix
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        modelUniforms.writeTo(device)
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
        let flag = false

        function draw(node: IndyNode) {
            if (node instanceof Mesh) {
                // shader.p3_idx.draw(pass, context, modelUniforms, teapot.points, teapot.indices, [1, 0.5, 0, 1])
                flag = !flag
                if (flag) {
                    shader.p3_n3_idx.draw(pass, context.cameraBindGroup, modelBindGroup, materialBindGroup0, node.points, node.normals, node.indices)
                } else {
                    shader.p3_n3_idx.draw(pass, context.cameraBindGroup, modelBindGroup, materialBindGroup1, node.points, node.normals, node.indices)
                }
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
}

main()