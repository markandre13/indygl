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
import { subset_P3_T2_IDX } from "./gl/algorithms/subset_P3_T2_IDX"
import { ShaderP3_N3_IDX_Alpha } from './gl/shaders/ShaderP3_N3_IDX_Alpha'
import { quadsToTriangles } from './gl/algorithms/quadsToTriangles'
import { calculateNormalsQuads } from './gl/algorithms/calculateNormalsQuads'
import { ShaderP3_N3_T2 } from './gl/shaders/ShaderP3_N3_T2'
import { ShaderP3_N3_T2_IDX } from './gl/shaders/ShaderP3_N3_T2_IDX'
import { decoupleXYZandUV } from './gl/algorithms/decoupleXYZandUV'
import { EdgeSelectController } from './gl/controllers/EdgeSelectController'
import { Mesh } from './Mesh'

// [ ] make rendering more generic: like a mesh object?
//     https://graphics.cs.utah.edu/teapot/
//     https://en.wikipedia.org/wiki/Utah_teapot
//
//  [ ] have cube, human and teapot a the same time
//  [ ] select object with pointer
//  [ ] move object with pointer
//
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
    readonly p3_idx: ShaderP3_IDX
    readonly p3_n3_idx: ShaderP3_N3_IDX
    readonly p3_n3_idx_alpha: ShaderP3_N3_IDX_Alpha

    constructor(context: CanvasContext) {
        const device = context.device
        this.p3_n3_idx = new ShaderP3_N3_IDX(device, context)
        this.p3_n3_idx_alpha = new ShaderP3_N3_IDX_Alpha(device, context)
        // // const shaderPickPoint = new ShaderP3_PickPoint(device, context)
        // const shaderPickPoints = new ShaderP3_C3_Point(device, context)
        this.p3_idx = new ShaderP3_IDX(device, context)

        // // const shaderColor = new ShaderP3_C3_IDX(device, context)
        // const shaderShadedTexture = new ShaderP4N4T2(device, context)
        // const shaderShadedTexture2 = new ShaderP3_N3_T2(device, context)
        // const shaderShadedTexture3 = new ShaderP3_N3_T2_IDX(device, context)
        // // const shaderShadedMono = new ShaderP3N3(device, context)
        // const shaderLines = new ShaderP3_C3_IDX_LineList(device, context) // need ShaderP3_C3_IDX_LineList
    }
}

async function loadMesh(device: Device, filename: string) {
    const r = await fetch(filename)
    if (!r.ok) {
        throw Error(`failed to load '${filename}': ${r.status} ${r.statusText}: ${await r.text()}`)
    }
    const obj = new WavefrontObj(filename, await r.text())
    // console.log(obj)
    const mesh = new Mesh(device, {
        xyz: obj.xyz,
        fxyz: obj.fxyz,
        uv: obj.uv.length > 0 ? obj.uv : undefined,
        fuv: obj.fuv.length > 0 ? obj.uv : undefined,
        normals: obj.normal.length > 0 ? obj.normal : undefined,
        fnormals: obj.fnormal.length > 0 ? obj.fnormal : undefined,
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
    const context = new CanvasContext(device, canvas)
    const shader = new ShaderCollection(context)

    editorModel.transform.signal.add(context.invalidate)
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)
    new ResizeObserver(context.invalidate).observe(canvas) // TODO: shouldn't this be in CanvasContext???
    context.pushController(new BasicMode(context))
    const modelUniforms = new ModelUniform(device)

    const teapot = await loadMesh(device, "obj/utah_teapot.obj")
    // const teapot = await loadMesh(device, "obj/teeth.obj")
    // const teapot = await loadMesh(device, "obj/mh/cube.obj") // quads
    // const teapot = await loadMesh(device, "obj/dodecahedron.obj")
    // const teapot = await loadMesh(device, "obj/mh/base.obj")

    context.paint = () => {

        const modelViewMatrix = modelUniforms.modelViewMatrix

        // mat4.copy(modelViewMatrix, context.camera)
        mat4.multiply(modelViewMatrix, context.camera.value, editorModel.transform.value)

        const normalMatrix = modelUniforms.normalMatrix
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        modelUniforms.writeTo(device)
        context.ajustSize()

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())

        shader.p3_idx.draw(pass, context, modelUniforms, teapot.points, teapot.indices, [1, 0.5, 0, 1])

        pass.end()
        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }
}

main()