import { mat4, quat, vec3 } from 'gl-matrix'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { ViewportShading } from './editor/app/ViewportShading'
import { BasicController } from './editor/controllers/BasicController'
import { ObjectSelectController } from './editor/controllers/ObjectSelectController'
import { MainScreen } from './editor/view/MainScreen'
import { deg2rad } from './gl/algorithms/deg2rad'
import { VertexBuffer } from './gl/buffers/VertexBuffer'
import { Context } from './gl/Context'
import { Device } from './gl/Device'
import { ObjectSelection } from './gl/ObjectSelection'
import { BlendShape } from './nodes/BlendShape'
import { BlendShapeGroup } from './nodes/BlendShapeGroup'
import { IndyNode, Root } from "./nodes/IndyNode"
import { Material } from "./nodes/Material"
import { Mesh } from './nodes/Mesh'
import { XForm } from "./nodes/XForm"
import { initTheme } from './theme'
import { PICK_SIZE } from './gl/shaders/ShaderP3_PickPoint'
import { ColorBuffer } from './gl/buffers/ColorBuffer'
import { SelectionMode } from './editor/app/SelectionMode'
import { PointSelectController } from './editor/controllers/PointSelectController'

export async function loadMesh(parent: XForm, filename: string) {
    return new Mesh(parent, filename)
}

interface RenderBuckets {
    // surface is a single rgb color
    rgbNodes: Mesh[]
    rgbNodesSelected: Mesh[]
    // surface is a texture
    texNodes: Mesh[]
    texNodesSelected: Mesh[]
    // surface as an rgb color per point (e.g. for weight painting, morphs, ...)
    rgbPerPtNodes: Mesh[]
    rgbPerPtNodesSelected: Mesh[],
    // points (e.g. when mesh is in edit mode)
    pointNodes: Mesh[],
    // lines/edges
    lineNodes: Mesh[]
}

function prepareNode(
    node: IndyNode,
    editorModel: EditorModel,
    context: Context,
    device: Device,
    buckets: RenderBuckets
) {
    if (node.parent && node.parent.dirty) {
        node.dirty = true
    }

    if (node.dirty) {
        //
        // update node.combined
        //
        if ((node instanceof XForm || node instanceof BlendShapeGroup || node instanceof BlendShape) && node.transform !== undefined) {
            if (node.parent === undefined) {
                mat4.copy(node.combined, node.transform)
            } else {
                mat4.mul(node.combined, node.parent.combined, node.transform)
            }
        } else {
            if (node.parent) {
                mat4.copy(node.combined, node.parent.combined)
            } else {
                mat4.identity(node.combined)
            }
        }

        //
        // update modelView.normalMatrix
        //
        if (node instanceof Mesh) {
            // copy object transformation to webgpu uniform
            mat4.copy(node.modelView.modelViewMatrix, node.combined)

            // set object normal matrix to webgpu uniform
            mat4.getRotation(quat.create(), node.combined)
            mat4.fromQuat(
                node.modelView.normalMatrix,
                mat4.getRotation(quat.create(), node.combined)
            )
            mat4.invert(node.modelView.normalMatrix, node.modelView.normalMatrix)
            mat4.transpose(node.modelView.normalMatrix, node.modelView.normalMatrix)

            // send to GPU
            node.modelView.writeTo(device)
        }
    }

    /**
     * collect shaders
     */
    if (node instanceof Mesh && node.xyz && !(node.parent instanceof BlendShape)) {
        const xform = node.getXForm()!

        // TODO: this will later become the edit mode
        if (node.name === "Cube") {
            buckets.pointNodes.push(node)
        }

        switch (editorModel.viewportShading.value) {
            case ViewportShading.WIREFRAME_XRAY:
                buckets.lineNodes.push(node)
                break
            case ViewportShading.WIREFRAME:
                buckets.lineNodes.push(node)
                buckets.rgbNodes.push(node)
                break
            default:
                if (node.material?.texture !== undefined) {
                    if (context.selection.selected.has(xform)) {
                        buckets.texNodesSelected.push(node)
                    } else {
                        buckets.texNodes.push(node)
                    }
                } else {
                    if (context.selection.selected.has(xform)) {
                        buckets.rgbNodesSelected.push(node)
                    } else {
                        buckets.rgbNodes.push(node)
                    }
                }
        }
    }
    // NOTE: the most universal approach would be to deform the morph mesh via another mesh
    if (node instanceof BlendShape) {
        if (node.name === "browInnerUp") {
            const mesh = node.mesh
            if (mesh) {
                const xform = node.getXForm()!
                switch (editorModel.viewportShading.value) {
                    case ViewportShading.WIREFRAME_XRAY:
                        buckets.lineNodes.push(mesh)
                        break
                    case ViewportShading.WIREFRAME:
                        buckets.lineNodes.push(mesh) // colored lines!!!
                        //                 buckets.rgbNodes.push(node)
                        break
                    //             default:
                }

                if (context.selection.selected.has(xform)) {
                    buckets.rgbPerPtNodesSelected.push(mesh)
                } else {
                    buckets.rgbPerPtNodes.push(mesh)
                }
            }
        }
        // node.dirty = false
        // return
    }
    for (const child of node.children) {
        prepareNode(child, editorModel, context, device, buckets)
    }
    node.dirty = false
}

function renderLines(
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    context: Context,
    materials: { wire: Material; selected: Material; active: Material }
) {
    if (nodes.length === 0) return
    pass.setPipeline(context.shader.p3_idx_line.pipeline)
    for (const node of nodes) {
        const xform = node.getXForm()!
        pass.setBindGroup(1, node.modelView.bindGroup)
        if (context.selection.isActive(xform)) {
            pass.setBindGroup(2, materials.active.bindGroup)
        } else if (context.selection.selected.has(xform)) {
            pass.setBindGroup(2, materials.selected.bindGroup)
        } else {
            pass.setBindGroup(2, materials.wire.bindGroup)
        }
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setIndexBuffer(node.edgeIndices.buffer, 'uint32')
        pass.drawIndexed(node.edgeIndices.length)
    }
}

// commit d99a4f1c54c4059044cef41652bf6ee26e2bdb57
//
//     const edgeIndices = new IndexBuffer(device, edges)
//
//     // const positions = new PositionBuffer(device, cube_XYZ)
//     const edgeColors = new Float32Array(mesh.positions.length /*3 * cube_XYZ.length*/)
//     const edgeColorBuffer = new ColorBuffer(device, edgeColors)
//
//         if (editorModel.selectionMode.value !== SelectionMode.OBJECT) {
//             shaderPickPoints.draw(pass, context, modelUniforms, positions, edgeColorBuffer, 0, obj.positions.length / 3)
//         }

let edgeColors: Float32Array | undefined
let edgeColorBuffer: ColorBuffer | undefined

function renderPoints(
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    context: Context
) {
    if (nodes.length === 0) return
    // console.log('renderPoints')
    const shader = context.shader.p3_c3_point
    shader.pickUniform.values[0][0] = PICK_SIZE / context.canvas.clientWidth
    shader.pickUniform.values[0][1] = PICK_SIZE / context.canvas.clientHeight
    shader.pickUniform.writeTo(context.device)

    pass.setPipeline(context.shader.p3_c3_point.pipeline)
    for (const node of nodes) {
        pass.setBindGroup(1, node.modelView.bindGroup)
        pass.setVertexBuffer(0, node.points.buffer)

        if (edgeColors === undefined) {
            edgeColors = new Float32Array(node.xyz!.length)
            edgeColorBuffer = new ColorBuffer(context.device, edgeColors)
        }

        pass.setVertexBuffer(1, edgeColorBuffer!.buffer)

        // const firstInstance = offset ? offset : 0
        // const instanceCount = length ? length : (positions.buffer.size / 3 / FLOAT32_NUM_BYTES) - firstInstance
        pass.draw(6, node.xyz!.length / 3, 0, 0)
    }
}

function renderRGBFaces(
    outline: boolean,
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    selectedNodes: Mesh[],
    context: Context,
    editorModel: EditorModel,
    background: Material
) {
    const list = outline ? selectedNodes : nodes
    if (list.length === 0) return

    if (editorModel.viewportShading.value === ViewportShading.WIREFRAME) {
        // fill mesh with background color
        pass.setBindGroup(2, background.bindGroup)
        pass.setPipeline(context.shader.p3_idx.pipeline)
    } else {
        if (outline) {
            pass.setPipeline(context.shader.p3_n3_idx.pipelineOutline)
        } else {
            pass.setStencilReference(0)
            pass.setPipeline(context.shader.p3_n3_idx.pipeline)
        }
    }

    for (const node of list) {
        const mbg = node.material?.bindGroup
        if (mbg === undefined) {
            continue
        }

        if (outline) {
            // TODO: handle isActive(node.getXForm()!) via one call
            const xform = node.getXForm()!
            pass.setStencilReference(context.selection.isActive(xform) ? 1 + 4 : 2 + 4)
        }
        pass.setBindGroup(1, node.modelView.bindGroup)
        if (editorModel.viewportShading.value !== ViewportShading.WIREFRAME) {
            pass.setBindGroup(2, node.material!.bindGroup)
        }
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setVertexBuffer(1, node.normals.buffer)
        pass.setIndexBuffer(node.indices.buffer, 'uint32')
        if (node.groupSubset?.has("body")) {
            const group = node.group("body")!
            pass.drawIndexed(group.length, 1, group.start)
        } else {
            pass.drawIndexed(node.indices.length)
        }
    }
}

function renderRGBPerPtFaces(
    outline: boolean,
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    selectedNodes: Mesh[],
    context: Context,
    editorModel: EditorModel,
    background: Material
) {
    const list = outline ? selectedNodes : nodes
    if (list.length === 0) return

    if (editorModel.viewportShading.value === ViewportShading.WIREFRAME) {
        pass.setBindGroup(2, background.bindGroup)
        pass.setPipeline(context.shader.p3_idx.pipeline)
    } else {
        if (outline) {
            pass.setPipeline(context.shader.p3_c3_idx.pipelineOutline)
        } else {
            pass.setStencilReference(0)
            pass.setPipeline(context.shader.p3_c3_idx.pipeline)
        }
    }

    for (const node of list) {
        if (outline) {
            // TODO: handle isActive(node.getXForm()!) via one call
            const xform = node.getXForm()!
            pass.setStencilReference(context.selection.isActive(xform) ? 1 + 4 : 2 + 4)
        }
        pass.setBindGroup(1, node.modelView.bindGroup)
        // pass.setBindGroup(2, node.modelView.bindGroup) // DUMMY
        // if (editorModel.viewportShading.value !== ViewportShading.WIREFRAME) {
        //     pass.setBindGroup(2, node.material!.bindGroup)
        // }
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setVertexBuffer(1, node.colors.buffer)
        pass.setIndexBuffer(node.indices.buffer, 'uint32')
        if (node.groupSubset?.has("body")) {
            const group = node.group("body")!
            pass.drawIndexed(group.length, 1, group.start)
        } else {
            pass.drawIndexed(node.indices.length)
        }
    }
}

function renderTexFaces(
    outline: boolean,
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    selectedNodes: Mesh[],
    context: Context,
) {
    const list = outline ? selectedNodes : nodes
    if (list.length === 0) return

    // pass.setPipeline(context.shader.p3_n3_t2_idx.pipeline)
    if (outline) {
        pass.setPipeline(context.shader.p3_n3_t2_idx.pipelineOutline)
    } else {
        pass.setStencilReference(0)
        pass.setPipeline(context.shader.p3_n3_t2_idx.pipeline)
    }

    for (const node of list) {
        if (node.material?.bindGroup === undefined) {
            continue
        }
        if (outline) {
            // TODO: handle isActive(node.getXForm()!) via one call
            const xform = node.getXForm()!
            pass.setStencilReference(context.selection.isActive(xform) ? 1 + 4 : 2 + 4)
        }
        pass.setBindGroup(1, node.modelView.bindGroup)

        pass.setBindGroup(2, node.material!.bindGroup)
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setVertexBuffer(1, node.normals.buffer)
        pass.setVertexBuffer(2, node.texcoords.buffer)

        pass.setIndexBuffer(node.indices.buffer, 'uint32')
        if (node.groupSubset?.has("body")) {
            const group = node.group("body")!
            pass.drawIndexed(group.length, 1, group.start)
        } else {
            pass.drawIndexed(node.indices.length)
        }
    }
}

function renderFloorAndAxis(pass: GPURenderPassEncoder, context: Context) {
    pass.setPipeline(context.shader.floor.pipeline)
    pass.draw(6)
    context.axisRenderer.render(pass)
}

function renderOutlinePass(commandEncoder: GPUCommandEncoder, context: Context) {
    context.shader.outline.postProcessRenderPassDescriptor.colorAttachments[0]!.view = context.context!
        .getCurrentTexture()
        .createView()

    const pass = commandEncoder.beginRenderPass(context.shader.outline.postProcessRenderPassDescriptor)
    pass.setPipeline(context.shader.outline.pipeline)
    pass.setBindGroup(0, context.getStencilBindgroup())
    pass.draw(3)
    pass.end()
}

async function loadDemoScene(root: Root) {
    const teapot = new XForm(root)
    const teapotMesh = await loadMesh(teapot, "obj/utah_teapot.obj")
    teapot.objectName = teapotMesh.dataName = "Utah Teapot"
    teapotMesh.material = new Material(root, [1, 0.5, 0, 1])
    teapot.transform = mat4.create()
    // mat4.translate(teapot.transform, teapot.transform, vec3.fromValues(3, 5, -7))
    // mat4.rotateX(teapot.transform, teapot.transform, deg2rad(20))
    mat4.rotateY(teapot.transform, teapot.transform, deg2rad(45))
    // mat4.rotateZ(teapot.transform, teapot.transform, deg2rad(40))

    const dodecahedron = new XForm(root)
    const dodecahedronMesh = await loadMesh(dodecahedron, "obj/dodecahedron.obj")
    dodecahedron.objectName = dodecahedronMesh.dataName = "Dodecahedron"
    dodecahedronMesh.material = new Material(root, [0, 1, 0, 1])
    dodecahedron.transform = mat4.create()
    mat4.translate(dodecahedron.transform, dodecahedron.transform, vec3.fromValues(3.15, 3.4, 0))

    const cube = new XForm(root)
    const cubeMesh = await loadMesh(cube, "obj/mh/cube.obj")
    cube.objectName = cubeMesh.dataName = "Cube"
    cubeMesh.material = new Material(root, [0, 0.2, 1, 1])
    cube.transform = mat4.create()
    mat4.translate(cube.transform, cube.transform, vec3.fromValues(2, 1, 4))

    const human = new XForm(root)
    const humanMesh = await loadMesh(human, "obj/mh/base.obj")
    human.objectName = humanMesh.dataName = "Human"
    humanMesh.material = new Material(root, "img/young_caucasian_female_special_suit.jpg")

    human.transform = mat4.create()
    mat4.translate(human.transform, human.transform, vec3.fromValues(3, 8.05, -7))
    // mat4.rotateX(human.transform, human.transform, deg2rad(20))
    // mat4.rotateY(human.transform, human.transform, deg2rad(30))
    // mat4.rotateZ(human.transform, human.transform, deg2rad(40))

    // humanMesh.material = new Material(context, [0.996, 0.890, 0.831, 1])

    // const teeth = new XForm(root)
    // const teethMesh = await loadMesh(teeth, "obj/teeth.obj") // two materials
    // teethMesh.material = new Material(context, [1, 1, 1, 1])
    // // this wrecks the shading, guess through the normal matrix being messed up
    // teeth.transform = mat4.create()
    // mat4.rotateY(teeth.transform, teeth.transform, deg2rad(90))
    // // mat4.scale(teeth.transform, teeth.transform, vec3.fromValues(6, 6, 6)) // this wrecks the shading, guess through the normal matrix being messed up
}

let sourceBuffer: VertexBuffer | undefined
let destinationBuffer: VertexBuffer | undefined
let copyBuffer = false

async function loadBlendshapes(root: Root) {
    const human = new XForm(root)
    human.objectName = "Human"
    const humanMesh = await loadMesh(human, "obj/mh/base.obj")
    humanMesh.dataName = "Human"
    humanMesh.material = new Material(root, "img/young_caucasian_female_special_suit.jpg")
    // humanMesh.material = new Material(context, [0, 0.5, 1, 1])

    const blendshapeGroup = new BlendShapeGroup(humanMesh)
    const s = 10.257156372070312
    blendshapeGroup.transform = mat4.create()
    mat4.translate(blendshapeGroup.transform, blendshapeGroup.transform, vec3.fromValues(0, 7.0285, 0.9557))
    mat4.scale(blendshapeGroup.transform, blendshapeGroup.transform, vec3.fromValues(s, s, s))

    const key0 = new BlendShape(blendshapeGroup, "Neutral", "obj/arkit/Neutral.obj")
    const key1 = new BlendShape(blendshapeGroup, "browInnerUp", "obj/arkit/browInnerUp.obj")
    const key2 = new BlendShape(blendshapeGroup, "browDownRight", "obj/arkit/browDownRight.obj")
    const key3 = new BlendShape(blendshapeGroup, "browOuterUpRight", "obj/arkit/browOuterUpRight.obj")
}

// some experimental code to persist/restore some of the more complex
// application state.
// for now to persist ObjectSelection to make it nicer to develop the
// mesh edit modes
function persist(root: Root, selection: ObjectSelection) {

}

function p(node: IndyNode) {
    for(const child of node.children) {
        p(child)
    }
}

function restore(root: Root, selection: ObjectSelection) {

}


// MainScreen provides the canvas needed by Context (formerly CanvasContext)
export async function main() {
    initTheme()

    // const nodeTree = new NodeTree()
    const editorModel = new EditorModel()
    const selection = new ObjectSelection(editorModel)

    const root = new Root()
    // await loadBlendshapes(root)
    await loadDemoScene(root)

    document.addEventListener("visibilitychange", () => persist(root, selection) )
    restore(root, selection)

    // console.log(root)

    replaceChildren(document.body, <MainScreen model={editorModel} selection={selection} root={root} />)

    const canvas = document.querySelector<HTMLCanvasElement>('canvas')
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()

    const context = new Context(device, canvas, editorModel, selection)
    root._context = context

    editorModel.transform.signal.add(context.invalidate)
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)
    new ResizeObserver(context.invalidate).observe(canvas)

    editorModel.selectionMode.signal.add(() => {
        context.clearController()
        switch (editorModel.selectionMode.value) {

            case SelectionMode.OBJECT:
                context.pushController(new BasicController(context))
                context.pushController(new ObjectSelectController(context, root))
                break
            default:
                context.pushController(new BasicController(context))
                // context.pushController(new PointSelectController(context, root))
        }
    })
    editorModel.selectionMode.signal.emit()


    // FIXME: these materials are internal and should not be nodes => split the Material class?
    const matWire = new Material(root, [0, 0, 0, 1])
    const matObjectSelected = new Material(root, [0.929, 0.341, 0, 1])
    const matActiveObject = new Material(root, [1, 0.627, 0.157, 1])
    const background = new Material(root, context.backgroundColor)

    const materials = { wire: matWire, selected: matObjectSelected, active: matActiveObject }

    context.paint = () => {
        const buckets: RenderBuckets = {
            rgbNodes: [] as Mesh[],
            rgbNodesSelected: [] as Mesh[],
            texNodes: [] as Mesh[],
            texNodesSelected: [] as Mesh[],
            rgbPerPtNodes: [] as Mesh[],
            rgbPerPtNodesSelected: [] as Mesh[],
            pointNodes: [] as Mesh[],
            lineNodes: [] as Mesh[],
        }
        prepareNode(root, editorModel, context, device, buckets)

        const commandEncoder = device.device!.createCommandEncoder({ label: 'main' })

        if (copyBuffer) {
            copyBuffer = false
            commandEncoder.copyBufferToBuffer(sourceBuffer!.buffer, destinationBuffer!.buffer)
        }

        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())
        pass.setBindGroup(0, context.sceneUniforms.bindGroup)

        renderLines(pass, buckets.lineNodes, context, materials)
        renderPoints(pass, buckets.pointNodes, context)
        for (let outline of [true, false]) {
            renderRGBFaces(outline, pass, buckets.rgbNodes, buckets.rgbNodesSelected, context, editorModel, background)
            renderTexFaces(outline, pass, buckets.texNodes, buckets.texNodesSelected, context)
            renderRGBPerPtFaces(outline, pass, buckets.rgbPerPtNodes, buckets.rgbPerPtNodesSelected, context, editorModel, background)
        }

        renderFloorAndAxis(pass, context)

        pass.end()
        renderOutlinePass(commandEncoder, context)

        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }
}

main()