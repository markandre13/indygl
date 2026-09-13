import { describe, expect, it, beforeEach, vi } from "vitest"
import { mat4, vec3 } from "gl-matrix"
import { ObjectGrabController } from "src/editor/controllers/ObjectGrabController"
import { XForm } from "src/nodes/XForm"
import { Mesh } from "src/nodes/Mesh"
import { AxisRenderer } from "src/gl/AxisRenderer"
import { Root } from "src/nodes/IndyNode"
import { TransformOrientation } from "src/editor/app/TransformOrientation"
import { setMat4Translation } from "src/gl/algorithms/coordinates"

describe("ObjectGrabController", () => {
    beforeEach(() => {
        document.getElementById("overlay")?.remove()
    })

    describe("constructor", () => {
        it("stores initial state and creates info label", () => {
            const { context, infoOverlay } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh

            const ctrl = new ObjectGrabController(context, root)

            expect(ctrl.initialCenter).toBeDefined()
            expect(ctrl.initialTransform).toBeDefined()
            expect(ctrl.grabbing).toBe(false)
            expect(infoOverlay.childElementCount).toBe(1)
            expect(ctrl.initialCenter![0]).toBeCloseTo(0, 6)
            expect(ctrl.initialCenter![1]).toBeCloseTo(0, 6)
            expect(ctrl.initialCenter![2]).toBeCloseTo(-10, 6)
        })

        it("creates transform when node.transform is undefined", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = undefined as any

            const ctrl = new ObjectGrabController(context, root)

            expect(parent.transform).toBeDefined()
            expect(parent.transform!.length).toBe(16)
        })
    })

    describe("keydown", () => {
        it("X|Y|Z sets single axis constraint", () => {
            const { context } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyX" }))
            expect(context.axisRenderer.x).toBe(true)
            expect(context.axisRenderer.y).toBe(false)
            expect(context.axisRenderer.z).toBe(false)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyY" }))
            expect(context.axisRenderer.x).toBe(false)
            expect(context.axisRenderer.y).toBe(true)
            expect(context.axisRenderer.z).toBe(false)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyZ" }))
            expect(context.axisRenderer.x).toBe(false)
            expect(context.axisRenderer.y).toBe(false)
            expect(context.axisRenderer.z).toBe(true)
        })

        it("Shift+(X|Y|Z) sets plane constraint", () => {
            const { context } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyX", shiftKey: true }))
            expect(context.axisRenderer.x).toBe(false)
            expect(context.axisRenderer.y).toBe(true)
            expect(context.axisRenderer.z).toBe(true)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyY", shiftKey: true }))
            expect(context.axisRenderer.x).toBe(true)
            expect(context.axisRenderer.y).toBe(false)
            expect(context.axisRenderer.z).toBe(true)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyZ", shiftKey: true }))
            expect(context.axisRenderer.x).toBe(true)
            expect(context.axisRenderer.y).toBe(true)
            expect(context.axisRenderer.z).toBe(false)
        })

        it("invalidates and updates info label", () => {
            const { context, infoOverlay } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyX" }))
            expect(context.invalidate).toHaveBeenCalled()
            expect(infoText(infoOverlay)).toContain("global X")
        })
    })

    describe("pointerdown", () => {
        it("left mouse button calls confirm()", () => {
            const { context } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            const spy = vi.spyOn(ctrl, "confirm")
            ctrl.pointerdown(new PointerEvent("pointerdown", { button: 0 }))
            expect(spy).toHaveBeenCalled()
        })

        it("right mouse button calls cancel()", () => {
            const { context } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            const spy = vi.spyOn(ctrl, "cancel")
            ctrl.pointerdown(new PointerEvent("pointerdown", { button: 2 }))
            expect(spy).toHaveBeenCalled()
        })
    })

    describe("confirm()", () => {
        it("resets grabbing, axis, and pops controller", () => {
            const { context } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            context.axisRenderer.set(true, false, false)
            const ctrl = new ObjectGrabController(context, root)
            ctrl.grabbing = true

            ctrl.confirm()

            expect(ctrl.grabbing).toBe(false)
            expect(context.axisRenderer.x).toBe(false)
            expect(context.axisRenderer.y).toBe(false)
            expect(context.axisRenderer.z).toBe(false)
            expect(context.popController).toHaveBeenCalled()
        })
    })

    describe("cancel()", () => {
        it("restores initial position and pops controller", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            setMat4Translation(parent.transform!, vec3.fromValues(5, 3, 8))

            ctrl.cancel()

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[0]).toBeCloseTo(0, 6)
            expect(t[1]).toBeCloseTo(0, 6)
            expect(t[2]).toBeCloseTo(-10, 6)
            expect(parent.dirty).toBe(true)
            expect(context.invalidate).toHaveBeenCalled()
            expect(context.popController).toHaveBeenCalled()
        })
    })

    describe("pointermove()", () => {
        it("free grab grips the object on the first move", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            expect(ctrl.grabbing).toBe(true)
            expect(parent.dirty).toBe(true)
            expect(context.selection.updateEditorModelFromActive).toHaveBeenCalled()
            expect(context.invalidate).toHaveBeenCalled()

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[0]).toBeCloseTo(0, 6)
            expect(t[1]).toBeCloseTo(0, 6)
            expect(t[2]).toBeCloseTo(-10, 6)
        })

        it("free grab moves the object as the pointer moves", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))
            ctrl.pointermove(makeMove(500, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            const dx = t[0]
            const dy = t[1]
            const dz = t[2] - (-10)
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            expect(dist).toBeGreaterThan(0.001)
        })

        it("free grab works with a tilted camera", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            expect(ctrl.grabbing).toBe(true)
            expect(parent.dirty).toBe(true)
            expect(context.invalidate).toHaveBeenCalled()

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            const dx = t[0]
            const dy = t[1]
            const dz = t[2] - (-10)
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            expect(dist).toBeGreaterThan(0.001)
        })

        it("sets grabbing flag on first move only", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))
            expect(ctrl.grabbing).toBe(true)

            ctrl.pointermove(makeMove(420, 310))
            expect(ctrl.grabbing).toBe(true)
        })

        it("does not recompute delta on subsequent moves", () => {
            const { context } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))
            const delta1 = { x: ctrl.delta!.x, y: ctrl.delta!.y }

            ctrl.pointermove(makeMove(100, 50))

            expect(ctrl.delta!.x).toBeCloseTo(delta1.x, 6)
            expect(ctrl.delta!.y).toBeCloseTo(delta1.y, 6)
        })

        it("X axis constraint keeps the grab on the X plane", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.axisRenderer.set(true, false, false)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[1]).toBeCloseTo(0, 4)
            expectMoved(t)
        })

        it("Y axis constraint keeps the grab on the Y plane", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.axisRenderer.set(false, true, false)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[0]).toBeCloseTo(0, 4)
            expectMoved(t)
        })

        it("Z axis constraint keeps the grab on the Z plane", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.axisRenderer.set(false, false, true)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[0]).toBeCloseTo(0, 4)
            expectMoved(t)
        })

        it("XY plane constraint keeps the grab on the XY plane", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.axisRenderer.set(true, true, false)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[2]).toBeCloseTo(-10, 4)
            expectMoved(t)
        })

        it("XZ plane constraint keeps the grab on the XZ plane", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.axisRenderer.set(true, false, true)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[1]).toBeCloseTo(0, 4)
            expectMoved(t)
        })

        it("YZ plane constraint keeps the grab on the YZ plane", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.axisRenderer.set(false, true, true)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            const t = mat4.getTranslation(vec3.create(), parent.transform!)
            expect(t[0]).toBeCloseTo(0, 4)
            expectMoved(t)
        })

        it("XYZ constraint is not implemented and returns early", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            parent.dirty = false
            context.axisRenderer.set(true, true, true)
            const ctrl = new ObjectGrabController(context, root)
            const before = mat4.clone(parent.transform!)

            ctrl.pointermove(makeMove(400, 300))

            expect(mat4.equals(parent.transform!, before)).toBe(true)
            expect(parent.dirty).toBe(false)
            expect(context.invalidate).not.toHaveBeenCalled()
        })

        it("works with LOCAL transform orientation (free grab)", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            expect(ctrl.grabbing).toBe(true)
            expect(parent.dirty).toBe(true)
            expect(context.invalidate).toHaveBeenCalled()
            expectMoved(mat4.getTranslation(vec3.create(), parent.transform!))
        })

        it("works with LOCAL transform orientation (X axis)", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL
            context.axisRenderer.set(true, false, false)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            expect(ctrl.grabbing).toBe(true)
            expect(parent.dirty).toBe(true)
            expect(context.invalidate).toHaveBeenCalled()
            expectMoved(mat4.getTranslation(vec3.create(), parent.transform!))
        })

        it("works with LOCAL transform orientation (Y axis)", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL
            context.axisRenderer.set(false, true, false)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            expect(ctrl.grabbing).toBe(true)
            expect(parent.dirty).toBe(true)
            expectMoved(mat4.getTranslation(vec3.create(), parent.transform!))
        })

        it("works with LOCAL transform orientation (Z axis)", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            tiltCamera(context)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL
            context.axisRenderer.set(false, false, true)
            const ctrl = new ObjectGrabController(context, root)

            ctrl.pointermove(makeMove(400, 300))

            expect(ctrl.grabbing).toBe(true)
            expect(parent.dirty).toBe(true)
            expectMoved(mat4.getTranslation(vec3.create(), parent.transform!))
        })
    })
})

function createMockAxisRenderer(): AxisRenderer {
    const r = Object.create(AxisRenderer.prototype)
    r.context = null
    r.x = false
    r.y = false
    r.z = false
    r.set = vi.fn(function (this: AxisRenderer, x: boolean, y: boolean, z: boolean) {
        this.x = x
        this.y = y
        this.z = z
    })
    return r
}

function createEnvironment() {
    const infoOverlay = document.createElement("div")
    infoOverlay.id = "overlay"
    document.body.appendChild(infoOverlay)

    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    Object.defineProperty(canvas, "clientWidth", { value: 640, configurable: true })
    Object.defineProperty(canvas, "clientHeight", { value: 480, configurable: true })

    const axisRenderer = createMockAxisRenderer()

    const context: any = {
        selection: {
            active: undefined as any,
            getActive: function () { return this.active },
            updateEditorModelFromActive: vi.fn(),
        },
        axisRenderer,
        sceneUniforms: {
            projectionMatrix: mat4.perspectiveZO(mat4.create(), 0.785398, 640 / 480, 0.1, 100),
            perspective: mat4.perspectiveZO(mat4.create(), 0.785398, 640 / 480, 0.1, 100),
            camera: mat4.create(),
        },
        canvas,
        invalidate: vi.fn(),
        popController: vi.fn(),
        editorModel: {
            transformOrientation: { value: TransformOrientation.GLOBAL },
        },
    }
    return { context, infoOverlay, canvas }
}

function createNodeTree(context: any) {
    const root = new Root()
    root._context = context
    const parent = new XForm(root)
    parent.transform = mat4.create()
    mat4.copy(parent.combined, mat4.fromTranslation(mat4.create(), [0, 0, -10]))

    const combined = mat4.fromTranslation(mat4.create(), [0, 0, -10])
    const mesh = Object.create(Mesh.prototype, {
        combined: { value: combined, writable: true },
        parent: { value: parent },
        context: { value: context },
    }) as Mesh

    return { root, parent, mesh }
}

function infoText(overlay: HTMLElement): string {
    const opInfo = overlay.firstElementChild!
    return (opInfo.children[0] as HTMLElement).textContent ?? ""
}

function makeMove(offsetX: number, offsetY: number): PointerEvent {
    const ev = new PointerEvent("pointermove")
    Object.defineProperties(ev, { offsetX: { value: offsetX }, offsetY: { value: offsetY } })
    return ev
}

function tiltCamera(context: any) {
    const camera = context.sceneUniforms.camera
    mat4.translate(camera, camera, [0.5, 1, -24])
    mat4.rotateX(camera, camera, 0.3)
    mat4.rotateY(camera, camera, 0.4)
}

function expectMoved(t: vec3) {
    const dx = t[0] - 0
    const dy = t[1] - 0
    const dz = t[2] - (-10)
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    expect(dist).toBeGreaterThan(0.001)
}
