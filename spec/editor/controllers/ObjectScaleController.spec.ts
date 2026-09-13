import { describe, expect, it, beforeEach, vi } from "vitest"
import { mat4, vec3 } from "gl-matrix"
import { ObjectScaleController } from "src/editor/controllers/ObjectScaleController"
import { XForm } from "src/nodes/XForm"
import { Mesh } from "src/nodes/Mesh"
import { AxisRenderer } from "src/gl/AxisRenderer"
import { Root } from "src/nodes/IndyNode"
import { world2screen } from "src/gl/algorithms/coordinates"

describe("ObjectScaleController", () => {
    beforeEach(() => {
        document.getElementById("overlay")?.remove()
        document.getElementById("svg-overlay")?.remove()
    })

    describe("details", () => {
        it("constructor sets up SVG elements, info label, and stores initial state", () => {
            const { context, infoOverlay } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.fromTranslation(mat4.create(), [5, 10, 15])

            const ctrl = new ObjectScaleController(context, root)

            expect(ctrl.originMarker).toBeDefined()
            expect(ctrl.lineToPointer).toBeDefined()
            expect(ctrl.initialDistance).toBeGreaterThan(0)
            expect(mat4.equals(ctrl.initialParentTransform, parent.transform!)).toBe(true)
            expect(context.canvas.style.cursor).toBe("none")
            expect(infoOverlay.childElementCount).toBe(1)
        })

        it("destructor() resets axis, removes SVG elements and resets cursor", () => {
            const { context, infoOverlay, svgOverlay } = createEnvironment()
            const { mesh, root } = createNodeTree(context)
            context.selection.active = mesh

            const ctrl = new ObjectScaleController(context, root)
            expect(svgOverlay.childElementCount).toBe(4)
            expect(infoOverlay.childElementCount).toBe(1)
            context.axisRenderer.set(true, false, false)
            ctrl.destructor()

            expect(svgOverlay.childElementCount).toBe(0)
            expect(context.canvas.style.cursor).toBe("")
            expect(context.axisRenderer.x).toBe(false)
            expect(context.axisRenderer.y).toBe(false)
            expect(context.axisRenderer.z).toBe(false)
        })
    })

    it("cancel() restores initial transform and pops controller", () => {
        const { context } = createEnvironment()
        const { parent, mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const initialTransform = mat4.fromTranslation(mat4.create(), [5, 10, 15])
        parent.transform = mat4.clone(initialTransform)

        const ctrl = new ObjectScaleController(context, root)
        mat4.scale(parent.transform!, parent.transform!, [2, 2, 2])
        ctrl.cancel()

        expect(mat4.equals(parent.transform!, initialTransform)).toBe(true)
        expect(context.axisRenderer.x).toBe(false)
        expect(context.axisRenderer.y).toBe(false)
        expect(context.axisRenderer.z).toBe(false)
        expect(context.invalidate).toHaveBeenCalled()
        expect(context.popController).toHaveBeenCalled()
    })

    it("confirm() keeps transform and pops controller", () => {
        const { context } = createEnvironment()
        const { parent, mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const initialTransform = mat4.fromTranslation(mat4.create(), [5, 10, 15])
        parent.transform = mat4.clone(initialTransform)

        const ctrl = new ObjectScaleController(context, root)
        mat4.scale(parent.transform!, parent.transform!, [2, 2, 2])
        const modifiedTransform = mat4.clone(parent.transform)

        ctrl.confirm()

        expect(mat4.equals(parent.transform!, modifiedTransform)).toBe(true)
        expect(context.popController).toHaveBeenCalled()
    })

    it("keydown() X|Y|Z sets single axis constraint", () => {
        const { context } = createEnvironment()
        const { mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectScaleController(context, root)

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

    it("keydown() Shift+(X|Y|Z) sets plane constraint", () => {
        const { context } = createEnvironment()
        const { mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectScaleController(context, root)

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

    it("keydown() updates the info label", () => {
        const { context, infoOverlay } = createEnvironment()
        const { mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectScaleController(context, root)

        ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyX" }))
        expect(infoText(infoOverlay)).toBe("Scale 1.0000 along global X")

        ctrl.keydown(new KeyboardEvent("keydown", { code: "KeyX", shiftKey: true }))
        expect(infoText(infoOverlay)).toBe("Scale 1.0000 1.0000 locking global X")
    })

    it("pointerdown() left mouse button calls confirm()", () => {
        const { context } = createEnvironment()
        const { mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectScaleController(context, root)

        const spy = vi.spyOn(ctrl, "confirm")
        ctrl.pointerdown(new PointerEvent("pointerdown", { button: 0 }))
        expect(spy).toHaveBeenCalled()
    })

    it("pointerdown() right mouse button calls cancel()", () => {
        const { context } = createEnvironment()
        const { mesh, root } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectScaleController(context, root)

        const spy = vi.spyOn(ctrl, "cancel")
        ctrl.pointerdown(new PointerEvent("pointerdown", { button: 2 }))
        expect(spy).toHaveBeenCalled()
    })

    describe("pointermove()", () => {
        it("scales uniformly in all axes when no axis is constrained", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, false, false, false, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            expect(factor).toBeCloseTo(2, 6)
            assertScale(parent.transform!, factor, factor, factor)
            expect(parent.dirty).toBe(true)
            expect(context.selection.updateEditorModelFromActive).toHaveBeenCalled()
            expect(context.invalidate).toHaveBeenCalled()
        })

        it("uses the factor's absolute value when dragging towards the origin", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, false, false, false, 70, 240)

            const factor = expectedFactor(context, parent, ctrl, 70, 240)
            expect(factor).toBeCloseTo(0.5, 6)
            assertScale(parent.transform!, factor, factor, factor)
        })

        it("X axis constraint scales only X", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, true, false, false, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            assertScale(parent.transform!, factor, 1, 1)
        })

        it("Y axis constraint scales only Y", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, false, true, false, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            assertScale(parent.transform!, 1, factor, 1)
        })

        it("Z axis constraint scales only Z", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, false, false, true, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            assertScale(parent.transform!, 1, 1, factor)
        })

        it("XY plane constraint scales X and Y", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, true, true, false, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            assertScale(parent.transform!, factor, factor, 1)
        })

        it("XZ plane constraint scales X and Z", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, true, false, true, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            assertScale(parent.transform!, factor, 1, factor)
        })

        it("YZ plane constraint scales Y and Z", () => {
            const { context } = createEnvironment()
            const { parent, ctrl } = runPointermove(context, false, true, true, 820, 240)

            const factor = expectedFactor(context, parent, ctrl, 820, 240)
            assertScale(parent.transform!, 1, factor, factor)
        })

        it("XYZ constraint is not implemented and leaves everything unchanged", () => {
            const { context } = createEnvironment()
            const { parent, mesh, root } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()
            parent.dirty = false
            const ctrl = new ObjectScaleController(context, root)
            context.axisRenderer.set(true, true, true)
            const before = mat4.clone(parent.transform!)

            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 820 }, offsetY: { value: 240 } })
            ctrl.pointermove(ev)

            expect(mat4.equals(parent.transform!, before)).toBe(true)
            expect(parent.dirty).toBe(false)
            expect(context.invalidate).not.toHaveBeenCalled()
            expect(context.selection.updateEditorModelFromActive).not.toHaveBeenCalled()
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

    const svgOverlay = document.createElement("div")
    svgOverlay.id = "svg-overlay"
    document.body.appendChild(svgOverlay)

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
        lastPointerOffset: { x: 0, y: 0 },
        invalidate: vi.fn(),
        popController: vi.fn(),
    }
    return { context, infoOverlay, svgOverlay, canvas }
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

function runPointermove(context: any, axisX: boolean, axisY: boolean, axisZ: boolean, offsetX: number, offsetY: number) {
    const { parent, mesh, root } = createNodeTree(context)
    context.selection.active = mesh
    context.axisRenderer.set(axisX, axisY, axisZ)

    const ctrl = new ObjectScaleController(context, root)
    const ev = new PointerEvent("pointermove")
    Object.defineProperties(ev, { offsetX: { value: offsetX }, offsetY: { value: offsetY } })
    ctrl.pointermove(ev)

    return { parent, ctrl, root }
}

function expectedFactor(context: any, parent: XForm, ctrl: ObjectScaleController, offsetX: number, offsetY: number): number {
    const origin = mat4.getTranslation(vec3.create(), parent.combined)
    const p0 = world2screen(origin, context.sceneUniforms.projectionMatrix, context.canvas)
    const distance = Math.hypot(offsetX - p0.x, offsetY - p0.y)
    const factor = (distance - ctrl.initialDistance) * 0.01 + 1
    return factor < 0 ? -factor : factor
}

function assertScale(tf: mat4, sx: number, sy: number, sz: number) {
    const s = mat4.getScaling(vec3.create(), tf)
    expect(s[0]).toBeCloseTo(sx, 6)
    expect(s[1]).toBeCloseTo(sy, 6)
    expect(s[2]).toBeCloseTo(sz, 6)
}

function infoText(overlay: HTMLElement): string {
    const opInfo = overlay.firstElementChild!
    return (opInfo.children[0] as HTMLElement).textContent ?? ""
}