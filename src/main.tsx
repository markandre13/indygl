import { mat4, vec3 } from 'gl-matrix'
import { Context } from './gl/Context'
import { Device } from './gl/Device'
import { BasicMode } from './gl/controllers/BasicController'
import { WavefrontObj } from './gl/file/WavefrontObj'
import { replaceChildren } from 'toad.jsx'
import { EditorModel } from './editor/app/EditorModel'
import { MainScreen } from './editor/view/MainScreen'
import { Mesh } from './nodes/Mesh'
import { XForm } from "./nodes/XForm"
import { Root } from "./nodes/Root"
import { IndyNode } from "./nodes/IndyNode"
import { Material } from "./nodes/Material"
import { deg2rad } from './gl/algorithms/deg2rad'
import { Texture } from './gl/buffers/Texture'
import { ViewportShading } from './editor/app/ViewportShading'
import { ObjectSelectController } from './gl/controllers/ObjectSelectController'

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
    const root = new Root(context)

    editorModel.transform.signal.add(context.invalidate)
    editorModel.selectionMode.signal.add(context.invalidate)
    editorModel.viewportShading.signal.add(context.invalidate)
    new ResizeObserver(context.invalidate).observe(canvas) // TODO: shouldn't this be in CanvasContext???
    context.pushController(new BasicMode(context))
    context.pushController(new ObjectSelectController(context, root))

    // const teapot = new XForm(root)
    // const teapotMesh = await loadMesh(teapot, "obj/utah_teapot.obj")
    // teapotMesh.material = new Material(context, [1, 0.5, 0, 1])

    // const teeth = new XForm(root)
    // const teethMesh = await loadMesh(teeth, "obj/teeth.obj") // two materials
    // teethMesh.material = new Material(context, [1, 1, 1, 1])
    // // this wrecks the shading, guess through the normal matrix being messed up
    // teeth.transform = mat4.create()
    // mat4.rotateY(teeth.transform, teeth.transform, deg2rad(90))
    // mat4.scale(teeth.transform, teeth.transform, vec3.fromValues(6, 6, 6)) // this wrecks the shading, guess through the normal matrix being messed up

    // mat4.translate(teeth.transform, teeth.transform, vec3.fromValues(0, -5.5, -1))

    const dodecahedron = new XForm(root)
    dodecahedron.transform = mat4.create()
    // mat4.translate(dodecahedron.transform, dodecahedron.transform, vec3.fromValues(3.15, 3.4, 0))
    const dodecahedronMesh = await loadMesh(dodecahedron, "obj/dodecahedron.obj") // 5-gons
    dodecahedronMesh.material = new Material(context, [0, 1, 0, 1])

    // // context.selection.add(teapotMesh)
    // context.selection.add(dodecahedronMesh)

    // const cube = new XForm(root)
    // const cubeMesh = await loadMesh(cube, "obj/mh/cube.obj")
    // cubeMesh.material = new Material(context, [0, 0.2, 1, 1])

    // // const human = new XForm(root)
    // // const humanMesh = await loadMesh(human, "obj/mh/base.obj")
    // const bodyTexture = new Texture()
    // await bodyTexture.load(device.device!!, "img/young_caucasian_female_special_suit.jpg")
    // // humanMesh.material = new Material(context, bodyTexture)

    // // humanMesh.material = new Material(context, [0.996, 0.890, 0.831, 1])

    const matWire = new Material(context, [0, 0, 0, 1])
    const matObjectSelected = new Material(context, [0.929, 0.341, 0, 1])
    const matActiveObject = new Material(context, [1, 0.627, 0.157, 1])
    const matTransform = new Material(context, [1, 0.627, 0.157, 1])

    const background = new Material(context, context.backgroundColor)
    // const black = new Material(context, [0, 0, 0, 1])

    context.paint = () => {


        // In a render_pass, all draw calls are executed at the same time, 
        // so inserting buffer updates in the render_pass will not give the expected result.

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

        const rgbNodes: Mesh[] = []
        const texNodes: Mesh[] = []
        const rgbNodesSelected: Mesh[] = []
        const texNodesSelected: Mesh[] = []
        const lineNodes: Mesh[] = []

        function prepare(node: IndyNode) {
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

                    // FIXME: redesign to not have to remove scaling factor AND this hack just works for equal scaling
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
                        lineNodes.push(node)
                        break
                    case ViewportShading.WIREFRAME:
                        lineNodes.push(node)
                        rgbNodes.push(node)
                        break
                    default:
                        if (node.material?.texture !== undefined) {
                            if (context.selection.selected.has(node)) {
                                texNodesSelected.push(node)
                            } else {
                                texNodes.push(node)
                            }
                        } else {
                            if (context.selection.selected.has(node)) {
                                rgbNodesSelected.push(node)
                            } else {
                                rgbNodes.push(node)
                            }
                        }
                }
            }
            for (const child of node.children) {
                prepare(child)
            }
            node.dirty = false
        }
        prepare(root)

        const commandEncoder = device.device!.createCommandEncoder({ label: 'main' })

        //
        // RENDER PASS
        //

        const pass = commandEncoder.beginRenderPass(context.getRenderPassDescriptor())
        pass.setBindGroup(0, context.sceneUniforms.bindGroup)

        if (lineNodes.length > 0) {
            pass.setPipeline(context.shader.p3_idx_line.pipeline)
            // pass.setBindGroup(2, matWire.bindGroup)
            for (const node of lineNodes) {
                pass.setBindGroup(1, node.modelView.bindGroup)
                if (context.selection.active === node) {
                    pass.setBindGroup(2, matActiveObject.bindGroup)
                } else if (context.selection.selected.has(node)) {
                    pass.setBindGroup(2, matObjectSelected.bindGroup)
                } else {
                    pass.setBindGroup(2, matWire.bindGroup)
                }

                // node.material!.setBindGroup(pass, node)
                // pass.setBindGroup(2, node.material!.bindGroup)
                pass.setVertexBuffer(0, node.points.buffer)
                pass.setIndexBuffer(node.edgeIndices.buffer, 'uint32')
                // if (node.groupSubset && node.groupSubset.has("body")) {
                //     const group = node.group("body")!
                //     pass.drawIndexed(group.length, 1, group.start)
                // } else {
                pass.drawIndexed(node.edgeIndices.length)
                // }
            }
        }

        // we need to draw the outline first, then the faces to remove the depth
        // information (which also mean we will have to handle texture within
        // this loop)
        for (let outline of [true, false]) {
            const list = outline ? rgbNodesSelected : rgbNodes
            if (list.length > 0) {
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
                        if (context.selection.active === node) {
                            pass.setStencilReference(1 + 4)
                        } else {
                            pass.setStencilReference(2 + 4)
                        }
                    }
                    pass.setBindGroup(1, node.modelView.bindGroup)
                    if (editorModel.viewportShading.value !== ViewportShading.WIREFRAME) {
                        pass.setBindGroup(2, node.material!.bindGroup)
                    }
                    pass.setVertexBuffer(0, node.points.buffer)
                    pass.setVertexBuffer(1, node.normals.buffer)
                    pass.setIndexBuffer(node.indices.buffer, 'uint32')
                    if (node.groupSubset && node.groupSubset.has("body")) {
                        const group = node.group("body")!
                        pass.drawIndexed(group.length, 1, group.start)
                    } else {
                        pass.drawIndexed(node.indices.length)
                    }
                }
            }
        }

        if (texNodes.length > 0) {
            pass.setPipeline(context.shader.p3_n3_t2_idx.pipeline)
            for (const node of texNodes) {
                pass.setBindGroup(1, node.modelView.bindGroup)
                node.material!.setBindGroup(pass, node)
                pass.setIndexBuffer(node.indices.buffer, 'uint32')
                if (node.groupSubset && node.groupSubset.has("body")) {
                    const group = node.group("body")!
                    pass.drawIndexed(group.length, 1, group.start)
                } else {
                    pass.drawIndexed(node.indices.length)
                }
            }
        }

        pass.setPipeline(context.shader.floor.pipeline)
        pass.draw(6)

        context.axisRenderer.render(pass)

        pass.end()

        //
        // OUTLINE PASS
        //

        {
            context.shader.outline.postProcessRenderPassDescriptor.colorAttachments[0]!.view = context.context!
                .getCurrentTexture()
                .createView()

            const pass = commandEncoder.beginRenderPass(context.shader.outline.postProcessRenderPassDescriptor)
            pass.setPipeline(context.shader.outline.pipeline)
            pass.setBindGroup(0, context.getStencilBindgroup())
            pass.draw(3)
            pass.end()
        }

        const commandBuffer = commandEncoder.finish()
        device.device.queue.submit([commandBuffer])
    }
}

main()