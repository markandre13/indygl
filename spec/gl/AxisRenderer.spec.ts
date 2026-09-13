import { describe, expect, it, vi } from "vitest"
import { mat4, quat, vec3 } from "gl-matrix"
import { AxisRenderer } from "src/gl/AxisRenderer"
import type { IndyNode } from "src/nodes/IndyNode"
import { TransformOrientation } from "src/editor/app/TransformOrientation"

/**
 * floats written to a ModelUniform buffer (model view matrix followed by normal matrix)
 */
function writtenFloats(writes: WriteCall[], index = 0): number[] {
    const w = writes[index]
    return Array.from(new Float32Array(w.data, w.byteOffset, w.byteLength / 4))
}

function modelViewFromWrite(writes: WriteCall[], index = 0): mat4 {
    const floats = writtenFloats(writes, index).slice(0, 16) as [
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
    ]
    return mat4.fromValues(...floats)
}

interface WriteCall {
    buffer: GPUBuffer
    data: ArrayBuffer
    byteOffset: number
    byteLength: number
}

function makeMockDevice() {
    const writes: WriteCall[] = []
    const device = {
        device: {
            createBuffer: vi.fn((desc: { size: number; mappedAtCreation?: boolean }) => {
                const buffer = {
                    size: desc.size,
                    data: new Float32Array(desc.size / 4),
                    getMappedRange() {
                        return this.data.buffer
                    },
                    unmap() { },
                }
                return buffer as unknown as GPUBuffer
            }),
            createBindGroup: vi.fn((desc: { label: string }) => {
                return { label: desc.label } as unknown as GPUBindGroup
            }),
            queue: {
                writeBuffer: vi.fn((buffer: GPUBuffer, offset: number, data: ArrayBuffer, byteOffset = 0, byteLength = data.byteLength) => {
                    const target = buffer as unknown as { data: Float32Array }
                    target.data.set(new Float32Array(data, byteOffset, byteLength / 4), offset / 4)
                    writes.push({ buffer, data: data.slice(byteOffset, byteOffset + byteLength), byteOffset: 0, byteLength })
                }),
            },
        },
    }
    return { device, writes }
}

function makeNode(combined: mat4): IndyNode {
    return { combined } as unknown as IndyNode
}

function makeEditorModel(orientation: TransformOrientation) {
    return {
        transformOrientation: { value: orientation },
    }
}

function makeSelection(options: { active?: IndyNode; selected?: IndyNode[] }) {
    return {
        active: options.active,
        selected: new Set(options.selected ?? []),
        getActive: function (this: { active?: IndyNode }) {
            return this.active
        },
        getSelected: function (this: { selected: Set<IndyNode> }) {
            return this.selected
        },
    }
}

function makePass() {
    return {
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        setVertexBuffer: vi.fn(),
        draw: vi.fn(),
    }
}

function makeAxisRenderer(options: {
    orientation: TransformOrientation
    active?: IndyNode
    selected?: IndyNode[]
}) {
    const { device, writes } = makeMockDevice()
    const context = {
        device,
        editorModel: makeEditorModel(options.orientation),
        selection: makeSelection({ active: options.active, selected: options.selected }),
        bindGroupLayout: { model: { label: "model-layout" } },
        shader: { p3c3_line: { pipeline: { label: "line-pipeline" } } },
    } as any
    const axisRenderer = new AxisRenderer(context)
    return { axisRenderer, writes, context }
}

describe("AxisRenderer", () => {
    describe("axis selection getters", () => {
        it("noAxisSelected when no axis is set", () => {
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
            })
            axisRenderer.set(false, false, false)
            expect(axisRenderer.noAxisSelected).toBe(true)
            expect(axisRenderer.oneAxisSelected).toBe(false)
            expect(axisRenderer.twoAxesSelected).toBe(false)
        })

        it("oneAxisSelected for a single axis", () => {
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
            })
            axisRenderer.set(true, false, false)
            expect(axisRenderer.oneAxisSelected).toBe(true)
            axisRenderer.set(false, true, false)
            expect(axisRenderer.oneAxisSelected).toBe(true)
            axisRenderer.set(false, false, true)
            expect(axisRenderer.oneAxisSelected).toBe(true)
        })

        it("twoAxesSelected for a plane", () => {
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
            })
            axisRenderer.set(true, true, false)
            expect(axisRenderer.twoAxesSelected).toBe(true)
            axisRenderer.set(true, false, true)
            expect(axisRenderer.twoAxesSelected).toBe(true)
            axisRenderer.set(false, true, true)
            expect(axisRenderer.twoAxesSelected).toBe(true)
        })
    })

    describe("render()", () => {
        it("does nothing when no axis is selected", () => {
            const node = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
                active: node,
            })
            const pass = makePass()
            axisRenderer.set(false, false, false)

            axisRenderer.render(pass as any)

            expect(pass.setPipeline).not.toHaveBeenCalled()
            expect(pass.draw).not.toHaveBeenCalled()
        })

        it("does nothing when there is no active node in GLOBAL orientation", () => {
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            expect(pass.setPipeline).not.toHaveBeenCalled()
            expect(pass.draw).not.toHaveBeenCalled()
        })

        it("GLOBAL: renders the axes through the active node using identity rotation", () => {
            const node = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const { axisRenderer, writes } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
                active: node,
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            expect(pass.setPipeline).toHaveBeenCalledWith({ label: "line-pipeline" })
            expect(pass.setBindGroup).toHaveBeenCalledTimes(1)
            expect(pass.setBindGroup).toHaveBeenCalledWith(1, axisRenderer.modelView.bindGroup)
            expect(pass.draw).toHaveBeenCalledTimes(1)
            expect(pass.draw).toHaveBeenCalledWith(2, undefined, 0)

            // model view matrix: identity rotation, translation of the active node
            const expected = mat4.fromTranslation(mat4.create(), [1, 2, 3])
            expect(mat4.equals(modelViewFromWrite(writes), expected)).toBe(true)
        })

        it("GLOBAL: ignores all but the active node", () => {
            const active = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const other = makeNode(mat4.fromTranslation(mat4.create(), [10, 20, 30]))
            const { axisRenderer, writes } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
                active,
                selected: [active, other],
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            expect(pass.draw).toHaveBeenCalledTimes(1)
            const expected = mat4.fromTranslation(mat4.create(), [1, 2, 3])
            expect(mat4.equals(modelViewFromWrite(writes), expected)).toBe(true)
        })

        it("GLOBAL: draws one axis per selected flag", () => {
            const node = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.GLOBAL,
                active: node,
            })
            const pass = makePass()
            axisRenderer.set(true, false, true)

            axisRenderer.render(pass as any)

            expect(pass.draw).toHaveBeenCalledTimes(2)
            expect(pass.draw).toHaveBeenNthCalledWith(1, 2, undefined, 0)
            expect(pass.draw).toHaveBeenNthCalledWith(2, 2, undefined, 4)
        })

        it("LOCAL: renders the axes of every selected object", () => {
            const active = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const other = makeNode(mat4.fromTranslation(mat4.create(), [10, 20, 30]))
            const { axisRenderer, writes } = makeAxisRenderer({
                orientation: TransformOrientation.LOCAL,
                active,
                selected: [active, other],
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            // one draw per selected object
            expect(pass.draw).toHaveBeenCalledTimes(2)
            expect(pass.draw).toHaveBeenNthCalledWith(1, 2, undefined, 0)
            expect(pass.draw).toHaveBeenNthCalledWith(2, 2, undefined, 0)

            // each object gets its own bind group and model view matrix
            expect(pass.setBindGroup).toHaveBeenCalledTimes(2)
            const bg1 = pass.setBindGroup.mock.calls[0]![1]
            const bg2 = pass.setBindGroup.mock.calls[1]![1]
            expect(bg1).not.toBe(bg2)

            const mv1 = modelViewFromWrite(writes, 0)
            const mv2 = modelViewFromWrite(writes, 1)
            expect(mat4.equals(mv1, mat4.fromTranslation(mat4.create(), [1, 2, 3]))).toBe(true)
            expect(mat4.equals(mv2, mat4.fromTranslation(mat4.create(), [10, 20, 30]))).toBe(true)
        })

        it("LOCAL: uses the object's rotation in the model view matrix", () => {
            const q = quat.fromEuler(quat.create(), 0, 0, Math.PI / 2)
            const combined = mat4.fromRotationTranslation(mat4.create(), q, [1, 2, 3])
            const node = makeNode(combined)
            const { axisRenderer, writes } = makeAxisRenderer({
                orientation: TransformOrientation.LOCAL,
                active: node,
                selected: [node],
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            expect(mat4.equals(modelViewFromWrite(writes), combined)).toBe(true)
        })

        it("LOCAL: renders when there is no active node, as long as objects are selected", () => {
            const node = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const { axisRenderer } = makeAxisRenderer({
                orientation: TransformOrientation.LOCAL,
                selected: [node],
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            expect(pass.draw).toHaveBeenCalledTimes(1)
        })

        it("LOCAL: uses a separate model view per node and reuses it across renders", () => {
            const node = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const { axisRenderer, context } = makeAxisRenderer({
                orientation: TransformOrientation.LOCAL,
                active: node,
                selected: [node],
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)
            axisRenderer.render(pass as any)

            const createBindGroupCalls = context.device.device.createBindGroup.mock.calls.length
            // shared modelView uniform + one cached uniform for the node
            expect(createBindGroupCalls).toBe(2)

            const bg1 = pass.setBindGroup.mock.calls[0]![1]
            const bg2 = pass.setBindGroup.mock.calls[1]![1]
            expect(bg1).toBe(bg2)
        })

        it("LOCAL: uses the default identity transform for unknown orientations", () => {
            const node = makeNode(mat4.fromTranslation(mat4.create(), [1, 2, 3]))
            const { axisRenderer, writes } = makeAxisRenderer({
                orientation: "UNKNOWN" as TransformOrientation,
                active: node,
                selected: [node],
            })
            const pass = makePass()
            axisRenderer.set(true, false, false)

            axisRenderer.render(pass as any)

            expect(mat4.equals(modelViewFromWrite(writes), mat4.identity(mat4.create()))).toBe(true)
        })
    })
})