import { mat4, vec3 } from 'gl-matrix'
import { Context } from './gl/Context'
import { Device } from './gl/Device'
import { BasicMode } from './gl/controllers/BasicController'
import { ObjectSelectController } from './gl/controllers/ObjectSelectController'
import { WavefrontObj } from './gl/file/WavefrontObj'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { MainScreen } from './editor/view/MainScreen'
import { Mesh } from './nodes/Mesh'
import { XForm } from "./nodes/XForm"
import { Root } from "./nodes/Root"
import { IndyNode } from "./nodes/IndyNode"
import { Material } from "./nodes/Material"
import { ViewportShading } from './editor/app/ViewportShading'
import { deg2rad } from './gl/algorithms/deg2rad'

export async function loadMesh(parent: XForm, filename: string) {
    const r = await fetch(filename)
    if (!r.ok) {
        throw Error(`failed to load '${filename}': ${r.status} ${r.statusText}: ${await r.text()}`)
    }
    const obj = new WavefrontObj(filename, await r.text())
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

function prepareNode(
    node: IndyNode,
    editorModel: EditorModel,
    context: Context,
    device: Device,
    buckets: {
        rgbNodes: Mesh[]
        texNodes: Mesh[]
        rgbNodesSelected: Mesh[]
        texNodesSelected: Mesh[]
        lineNodes: Mesh[]
    }
) {
    if (node.parent && node.parent.dirty) {
        node.dirty = true
    }

    if (node.dirty) {
        if (node instanceof XForm && node.transform !== undefined) {
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

        if (node instanceof Mesh) {
            mat4.copy(node.modelView.modelViewMatrix, node.combined)
            const v0 = vec3.fromValues(0, 0, 0)
            const v1 = vec3.fromValues(1, 0, 0)
            vec3.transformMat4(v0, v0, node.combined)
            vec3.transformMat4(v1, v1, node.combined)
            vec3.sub(v1, v1, v0)
            const l = 1 / vec3.length(v1)
            mat4.scale(node.modelView.normalMatrix, node.combined, vec3.fromValues(l, l, l))
            node.modelView.normalMatrix[12] = node.modelView.normalMatrix[13] = node.modelView.normalMatrix[14] = 0
            mat4.invert(node.modelView.normalMatrix, node.modelView.normalMatrix)
            mat4.transpose(node.modelView.normalMatrix, node.modelView.normalMatrix)
            node.modelView.writeTo(device)
        }
    }

    if (node instanceof Mesh) {
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
                    if (context.selection.selected.has(node)) {
                        buckets.texNodesSelected.push(node)
                    } else {
                        buckets.texNodes.push(node)
                    }
                } else {
                    if (context.selection.selected.has(node)) {
                        buckets.rgbNodesSelected.push(node)
                    } else {
                        buckets.rgbNodes.push(node)
                    }
                }
        }
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
        pass.setBindGroup(1, node.modelView.bindGroup)
        if (context.selection.active === node) {
            pass.setBindGroup(2, materials.active.bindGroup)
        } else if (context.selection.selected.has(node)) {
            pass.setBindGroup(2, materials.selected.bindGroup)
        } else {
            pass.setBindGroup(2, materials.wire.bindGroup)
        }
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setIndexBuffer(node.edgeIndices.buffer, 'uint32')
        pass.drawIndexed(node.edgeIndices.length)
    }
}

function renderRGBFaces(
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    selectedNodes: Mesh[],
    context: Context,
    editorModel: EditorModel,
    background: Material
) {
    for (const outline of [true, false]) {
        const list = outline ? selectedNodes : nodes
        if (list.length === 0) continue

        if (editorModel.viewportShading.value === ViewportShading.WIREFRAME) {
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
            if (outline) {
                pass.setStencilReference(context.selection.active === node ? 1 + 4 : 2 + 4)
            }
            pass.setBindGroup(1, node.modelView.bindGroup)
            if (editorModel.viewportShading.value !== ViewportShading.WIREFRAME) {
                pass.setBindGroup(2, node.material!.bindGroup)
            }
            pass.setVertexBuffer(0, node.points.buffer)
            pass.setVertexBuffer(1, node.normals.buffer)
            pass.setIndexBuffer(node.indices.buffer, 'uint32')
            pass.drawIndexed(node.indices.length)
        }
    }
}

function renderTexFaces(
    pass: GPURenderPassEncoder,
    nodes: Mesh[],
    context: Context
) {
    if (nodes.length === 0) return
    pass.setPipeline(context.shader.p3_n3_t2_idx.pipeline)
    for (const node of nodes) {
        pass.setBindGroup(1, node.modelView.bindGroup)
        node.material!.setBindGroup(pass, node)
        pass.setIndexBuffer(node.indices.buffer, 'uint32')
        pass.drawIndexed(node.indices.length)
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

async function loadDemoScene(root: Root, context: Context) {
    const teapot = new XForm(root)
    const teapotMesh = await loadMesh(teapot, "obj/utah_teapot.obj")
    teapotMesh.material = new Material(context, [1, 0.5, 0, 1])

    const dodecahedron = new XForm(root)
    dodecahedron.transform = mat4.create()
    mat4.translate(dodecahedron.transform, dodecahedron.transform, vec3.fromValues(3.15, 3.4, 0))
    const mesh = await loadMesh(dodecahedron, "obj/dodecahedron.obj")
    mesh.material = new Material(context, [0, 1, 0, 1])

    const cube = new XForm(root)
    cube.transform = mat4.create()
    mat4.translate(cube.transform, cube.transform, vec3.fromValues(2, 1, 4))
    const cubeMesh = await loadMesh(cube, "obj/mh/cube.obj")
    cubeMesh.material = new Material(context, [0, 0.2, 1, 1])

    const teeth = new XForm(root)
    const teethMesh = await loadMesh(teeth, "obj/teeth.obj") // two materials
    teethMesh.material = new Material(context, [1, 1, 1, 1])
    // this wrecks the shading, guess through the normal matrix being messed up
    teeth.transform = mat4.create()
    mat4.rotateY(teeth.transform, teeth.transform, deg2rad(90))
    mat4.scale(teeth.transform, teeth.transform, vec3.fromValues(6, 6, 6)) // this wrecks the shading, guess through the normal matrix being messed up
}

export async function main() {
    const editorModel = new EditorModel()
    replaceChildren(document.body, <MainScreen model={editorModel} />)

    const canvas = document.querySelector<HTMLCanvasElement>('canvas')
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()
    const context = new Context(device, canvas)
    const root = new Root(context)

    editorModel.transform.signal.add(context.invalidate)
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)
    new ResizeObserver(context.invalidate).observe(canvas)
    context.pushController(new BasicMode(context))
    context.pushController(new ObjectSelectController(context, root))

    await loadDemoScene(root, context)

    const matWire = new Material(context, [0, 0, 0, 1])
    const matObjectSelected = new Material(context, [0.929, 0.341, 0, 1])
    const matActiveObject = new Material(context, [1, 0.627, 0.157, 1])
    const background = new Material(context, context.backgroundColor)

    const materials = { wire: matWire, selected: matObjectSelected, active: matActiveObject }

    context.paint = () => {
        const buckets = {
            rgbNodes: [] as Mesh[],
            texNodes: [] as Mesh[],
            rgbNodesSelected: [] as Mesh[],
            texNodesSelected: [] as Mesh[],
            lineNodes: [] as Mesh[],
        }
        prepareNode(root, editorModel, context, device, buckets)

        const commandEncoder = device.device!.createCommandEncoder({ label: 'main' })

        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())
        pass.setBindGroup(0, context.sceneUniforms.bindGroup)

        renderLines(pass, buckets.lineNodes, context, materials)
        renderRGBFaces(pass, buckets.rgbNodes, buckets.rgbNodesSelected, context, editorModel, background)
        renderTexFaces(pass, buckets.texNodes, context)
        renderFloorAndAxis(pass, context)

        pass.end()
        renderOutlinePass(commandEncoder, context)

        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }
}

main()