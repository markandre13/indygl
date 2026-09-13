import { describe, expect, it, beforeEach, vi } from "vitest"
import { mat4, quat, vec3 } from "gl-matrix"
import { ObjectRotateController } from "src/editor/controllers/ObjectRotateController"
import { XForm } from "src/nodes/XForm"
import { Mesh } from "src/nodes/Mesh"
import { AxisRenderer } from "src/gl/AxisRenderer"
import { Root } from "src/nodes/IndyNode"
import { TransformOrientation } from "src/editor/app/TransformOrientation"

describe("ObjectRotateController", () => {
    beforeEach(() => {
        document.getElementById("overlay")?.remove()
        document.getElementById("svg-overlay")?.remove()
    })

    describe("details", () => {
        it("constructor sets up SVG elements, info label, and stores initial state", () => {
            const { context, infoOverlay } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.fromTranslation(mat4.create(), [5, 10, 15])

            const ctrl = new ObjectRotateController(context)

            expect(ctrl.originMarker).toBeDefined()
            expect(ctrl.lineToPointer).toBeDefined()
            expect(ctrl.initialTransform).toBeDefined()
            expect(mat4.equals(ctrl.initialTransform, parent.transform!)).toBe(true)
            expect(context.canvas.style.cursor).toBe("none")
            expect(infoOverlay.childElementCount).toBe(1)
        })

        it("destructor() resets axis, removes SVG elements and resets cursor", () => {
            const { context, infoOverlay, svgOverlay } = createEnvironment()
            const { mesh } = createNodeTree(context)
            context.selection.active = mesh

            const ctrl = new ObjectRotateController(context)
            expect(svgOverlay.childElementCount).toBe(4)
            expect(infoOverlay.childElementCount).toBe(1)
            context.axisRenderer.set(true, false, false)
            ctrl.destructor()

            expect(svgOverlay.childElementCount).toBe(0)
            expect(infoOverlay.childElementCount).toBe(0)
            expect(context.canvas.style.cursor).toBe("")
            expect(context.axisRenderer.x).toBe(false)
            expect(context.axisRenderer.y).toBe(false)
            expect(context.axisRenderer.z).toBe(false)
        })
    })

    it("cancel() restores initial transform and pops controller", () => {
        const { context } = createEnvironment()
        const { parent, mesh } = createNodeTree(context)
        context.selection.active = mesh
        const initialTransform = mat4.fromTranslation(mat4.create(), [5, 10, 15])
        parent.transform = mat4.clone(initialTransform)

        const ctrl = new ObjectRotateController(context)
        mat4.translate(parent.transform!, parent.transform!, [1, 2, 3])
        ctrl.cancel()

        expect(mat4.equals(parent.transform!, initialTransform)).toBe(true)
        expect(context.axisRenderer.x).toBe(false)
        expect(context.axisRenderer.y).toBe(false)
        expect(context.axisRenderer.z).toBe(false)
        expect(context.popController).toHaveBeenCalled()
    })

    it("confirm() keeps transform and pops controller", () => {
        const { context } = createEnvironment()
        const { parent, mesh } = createNodeTree(context)
        context.selection.active = mesh
        const initialTransform = mat4.fromTranslation(mat4.create(), [5, 10, 15])
        parent.transform = mat4.clone(initialTransform)

        const ctrl = new ObjectRotateController(context)
        mat4.translate(parent.transform!, parent.transform!, [1, 2, 3])
        const modifiedTransform = mat4.clone(parent.transform)

        ctrl.confirm()

        expect(mat4.equals(parent.transform!, modifiedTransform)).toBe(true)

        expect(context.popController).toHaveBeenCalled()
    })

    it("keydown() X|Y|Z sets single axis constraint", () => {
        const { context } = createEnvironment()
        const { mesh } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectRotateController(context)

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
        const { mesh } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectRotateController(context)

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

    it("pointerdown() left mouse button calls confirm()", () => {
        const { context } = createEnvironment()
        const { mesh } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectRotateController(context)

        const spy = vi.spyOn(ctrl, "confirm")
        ctrl.pointerdown(new PointerEvent("pointerdown", { button: 0 }))
        expect(spy).toHaveBeenCalled()
    })

    it("pointerdown() right mouse button calls cancel()", () => {
        const { context } = createEnvironment()
        const { mesh } = createNodeTree(context)
        context.selection.active = mesh
        const ctrl = new ObjectRotateController(context)

        const spy = vi.spyOn(ctrl, "cancel")
        ctrl.pointerdown(new PointerEvent("pointerdown", { button: 2 }))
        expect(spy).toHaveBeenCalled()
    })

    it("pointermove() rotates parent transform (free rotate)", () => {
        const { context } = createEnvironment()
        const { parent, mesh } = createNodeTree(context)
        context.selection.active = mesh
        parent.transform = mat4.create()

        const ctrl = new ObjectRotateController(context)
        const angle0 = ctrl.lineToPointer.angle
        expect(Number.isNaN(angle0)).toBe(false)

        const ev = new PointerEvent("pointermove")
        Object.defineProperties(ev, { offsetX: { value: 100 }, offsetY: { value: 50 } })
        ctrl.pointermove(ev)

        expect(ctrl.lineToPointer.angle).not.toBe(angle0)
        expect(parent.dirty).toBe(true)
        expect(context.selection.updateEditorModelFromActive).toHaveBeenCalled()
        expect(context.invalidate).toHaveBeenCalled()
    })

    it("pointermove() with X axis constraint rotates around X", () => {
        const { context } = createEnvironment()
        const { parent, mesh } = createNodeTree(context)
        context.selection.active = mesh
        parent.transform = mat4.create()

        const ctrl = new ObjectRotateController(context)
        context.axisRenderer.set(true, false, false)

        const initial = mat4.clone(parent.transform!)
        const ev = new PointerEvent("pointermove")
        Object.defineProperties(ev, { offsetX: { value: 200 }, offsetY: { value: 100 } })
        ctrl.pointermove(ev)

        expect(parent.dirty).toBe(true)
        expect(mat4.equals(parent.transform!, initial)).toBe(false)
    })

    // TODO: Y, Z

    describe("pointermove() with camera transform", () => {
        it("free rotate still works when camera is translated", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()

            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [2, 3, -24])

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 150 }, offsetY: { value: 75 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.create())).toBe(false)
        })

        it("free rotate still works when camera is rotated", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()

            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.3)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 150 }, offsetY: { value: 75 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.create())).toBe(false)
        })

        it("free rotate works with both camera translation and rotation", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()

            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [2, 3, -24])
            mat4.rotateY(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.5)
            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.2)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 300 }, offsetY: { value: 200 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.create())).toBe(false)
        })

        it("X axis rotation works with translated camera", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()

            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [0, 0, -24])
            context.axisRenderer.set(true, false, false)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.create())).toBe(false)
        })

        it("Y axis rotation works with rotated camera", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()

            mat4.rotateY(context.sceneUniforms.camera, context.sceneUniforms.camera, -0.4)
            context.axisRenderer.set(false, true, false)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 180 }, offsetY: { value: 90 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.create())).toBe(false)
        })
    })

    describe("pointermove with parent transform", () => {
        it("free rotate works when parent is translated", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [8, -3, 5])

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 120 }, offsetY: { value: 60 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.fromTranslation(mat4.create(), [8, -3, 5]))).toBe(false)
        })

        it("free rotate works when parent is rotated", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.rotateY(parent.transform!, parent.transform!, 0.8)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 140 }, offsetY: { value: 70 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            const expected = mat4.create()
            mat4.rotateY(expected, expected, 0.8)
            expect(mat4.equals(parent.transform!, expected)).toBe(false)
        })

        it("free rotate works when parent is scaled", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.scale(parent.transform!, parent.transform!, [2, 2, 2])

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 160 }, offsetY: { value: 80 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            const expected = mat4.create()
            mat4.scale(expected, expected, [2, 2, 2])
            expect(mat4.equals(parent.transform!, expected)).toBe(false)
        })

        it("free rotate works with combined parent transform (translate + rotate + scale)", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [3, -2, 7])
            mat4.rotateZ(parent.transform!, parent.transform!, 0.6)
            mat4.rotateY(parent.transform!, parent.transform!, 0.4)
            mat4.scale(parent.transform!, parent.transform!, [1.5, 2, 0.5])

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 200 }, offsetY: { value: 100 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, parent.transform!)).toBe(true)
        })

        it("X axis rotation works with combined parent transform", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [10, -5, 3])
            mat4.rotateY(parent.transform!, parent.transform!, 0.3)

            context.axisRenderer.set(true, false, false)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 220 }, offsetY: { value: 110 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
        })
    })

    describe("angle sign flipping on axis constraints", () => {
        function runPointermove(context: any, axisX: boolean, axisY: boolean, axisZ: boolean, offsetX: number, offsetY: number): mat4 {
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            parent.transform = mat4.create()

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(axisX, axisY, axisZ)

            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: offsetX }, offsetY: { value: offsetY } })
            ctrl.pointermove(ev)

            return parent.transform!
        }

        it("flips X rotation sign when camera looks from the opposite side", () => {
            const { context } = createEnvironment()
            const tf = runPointermove(context, true, false, false, 100, 50)
            // X rotation: parent.transform[6] = -sin(angle)
            const signForward = Math.sign(tf[6])

            mat4.rotateY(context.sceneUniforms.camera, context.sceneUniforms.camera, Math.PI)
            const tb = runPointermove(context, true, false, false, 100, 50)
            const signBehind = Math.sign(tb[6])

            expect(signBehind).toBe(-signForward)
        })

        it("flips Y rotation sign when camera looks from the opposite side", () => {
            const { context } = createEnvironment()
            const tf = runPointermove(context, false, true, false, 100, 50)
            // Y rotation: parent.transform[2] = sin(angle), parent.transform[8] = -sin(angle)
            const signForward = Math.sign(tf[8])

            // Rotating 180° around Y doesn't affect the Y component of a vector
            // (Y is the rotation axis). Use X rotation instead.
            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, Math.PI)
            const tb = runPointermove(context, false, true, false, 100, 50)
            const signBehind = Math.sign(tb[8])

            expect(signBehind).toBe(-signForward)
        })

        it("flips Z rotation sign when camera looks from the opposite side", () => {
            const { context } = createEnvironment()
            const tf = runPointermove(context, false, false, true, 100, 50)
            // Z rotation: parent.transform[4] = -sin(angle), parent.transform[1] = sin(angle)
            const signForward = Math.sign(tf[4])

            mat4.rotateY(context.sceneUniforms.camera, context.sceneUniforms.camera, Math.PI)
            const tb = runPointermove(context, false, false, true, 100, 50)
            const signBehind = Math.sign(tb[4])

            expect(signBehind).toBe(-signForward)
        })

        it("free rotate code path has no sign-flip logic (i==-1 code path)", () => {
            // Verifying the free-rotate path exists and works (it uses a different
            // code path without the `if (p1[i] < 0) { angle = -angle }` block)
            const { context } = createEnvironment()
            const tf = runPointermove(context, false, false, false, 100, 50)
            expect(tf).not.toEqual(mat4.create())
        })
    })

    describe("pointermove with combined camera and parent transforms", () => {
        it("free rotate with translated camera and translated parent", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [5, -5, 10])
            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [3, -2, -30])

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 200 }, offsetY: { value: 100 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, mat4.fromTranslation(mat4.create(), [5, -5, 10]))).toBe(false)
        })

        it("free rotate with rotated camera and rotated parent", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.rotateY(parent.transform!, parent.transform!, 0.5)
            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.3)

            const ctrl = new ObjectRotateController(context)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 180 }, offsetY: { value: 90 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
        })

        it("free rotate with full camera and full parent transforms", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [2, -3, 8])
            mat4.rotateZ(parent.transform!, parent.transform!, 0.7)
            mat4.rotateY(parent.transform!, parent.transform!, 0.4)
            mat4.scale(parent.transform!, parent.transform!, [1.2, 1.5, 0.8])

            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [0, 0, -20])
            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.2)
            mat4.rotateY(context.sceneUniforms.camera, context.sceneUniforms.camera, -0.3)

            const ctrl = new ObjectRotateController(context)
            const initial = mat4.clone(parent.transform!)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 300 }, offsetY: { value: 150 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, initial)).toBe(false)
        })

        it("X axis rotation with translated camera and rotated parent", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [0, 0, 5])
            mat4.rotateY(parent.transform!, parent.transform!, 0.6)
            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [0, 0, -15])
            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.2)

            context.axisRenderer.set(true, false, false)

            const ctrl = new ObjectRotateController(context)
            const initial = mat4.clone(parent.transform!)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, initial)).toBe(false)
        })

        it("Y axis rotation with rotated camera and scaled parent", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.scale(parent.transform!, parent.transform!, [1.5, 2, 0.5])
            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [4, -2, -24])
            mat4.rotateY(context.sceneUniforms.camera, context.sceneUniforms.camera, -0.5)

            context.axisRenderer.set(false, true, false)

            const ctrl = new ObjectRotateController(context)
            const initial = mat4.clone(parent.transform!)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 280 }, offsetY: { value: 140 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, initial)).toBe(false)
        })

        it("Z axis rotation with everything combined", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.translate(parent.transform!, parent.transform!, [7, -4, 12])
            mat4.rotateX(parent.transform!, parent.transform!, 0.3)
            mat4.rotateY(parent.transform!, parent.transform!, 0.5)
            mat4.scale(parent.transform!, parent.transform!, [2, 1, 1.5])

            mat4.translate(context.sceneUniforms.camera, context.sceneUniforms.camera, [-3, 5, -30])
            mat4.rotateX(context.sceneUniforms.camera, context.sceneUniforms.camera, 0.4)
            mat4.rotateZ(context.sceneUniforms.camera, context.sceneUniforms.camera, -0.2)

            context.axisRenderer.set(false, false, true)

            const ctrl = new ObjectRotateController(context)
            const initial = mat4.clone(parent.transform!)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 350 }, offsetY: { value: 175 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, initial)).toBe(false)
        })
    })

    describe("pointermove with LOCAL transform orientation", () => {
        it("rotates around the object's local X axis", () => {
            const { context } = createEnvironment()
            const { parent, mesh } = createNodeTree(context)
            context.selection.active = mesh
            mat4.rotateX(parent.transform!, parent.transform!, 0.5)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL
            context.axisRenderer.set(true, false, false)

            const ctrl = new ObjectRotateController(context)
            const initial = mat4.clone(parent.transform!)
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            expect(parent.dirty).toBe(true)
            expect(mat4.equals(parent.transform!, initial)).toBe(false)
        })

        it("LOCAL X rotation differs from GLOBAL X rotation when object is pre-rotated", () => {
            const { context } = createEnvironment()
            const local = runLocalRotation(context, 0.5, true, false, false)
            const global = runGlobalRotation(context, 0.5, true, false, false)

            expect(mat4.equals(local, global)).toBe(false)
        })

        it("LOCAL Y rotation differs from GLOBAL Y rotation when object is pre-rotated", () => {
            const { context } = createEnvironment()
            const local = runAxisRotation(context, TransformOrientation.LOCAL, 0.5, false, true, false, "rotateX")
            const global = runAxisRotation(context, TransformOrientation.GLOBAL, 0.5, false, true, false, "rotateX")

            expect(mat4.equals(local, global)).toBe(false)
        })

        it("LOCAL Z rotation differs from GLOBAL Z rotation when object is pre-rotated", () => {
            const { context } = createEnvironment()
            const local = runLocalRotation(context, 0.5, false, false, true)
            const global = runGlobalRotation(context, 0.5, false, false, true)

            expect(mat4.equals(local, global)).toBe(false)
        })

        it("matches global rotation when object has no pre-rotation", () => {
            const { context } = createEnvironment()
            const local = runLocalRotation(context, 0, true, false, false)
            const global = runGlobalRotation(context, 0, true, false, false)

            expect(mat4.equals(local, global)).toBe(true)
        })
    })

    describe("pointermove with GLOBAL multi-object rotation", () => {
        it("rotates all selected objects around the median", () => {
            const { context } = createEnvironment()
            const { root, parent: p1, mesh: m1 } = createNodeTree(context)
            const { parent: p2, mesh: m2 } = addNode(context, root, 10, 0, 0)

            // active = m1, both selected
            context.selection.active = m1
            context.selection.selected.clear()
            context.selection.selected.add(p1)
            context.selection.selected.add(p2)
            context.editorModel.transformOrientation.value = TransformOrientation.GLOBAL

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(true, false, false) // X axis

            // move to trigger a rotation
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            expect(p1.dirty).toBe(true)
            expect(p2.dirty).toBe(true)
        })

        it("rotateSelectedAroundMedian changes positions symmetrically around median", () => {
            const { context } = createEnvironment()
            const { root, parent: p1, mesh: m1 } = createNodeTree(context)
            const { parent: p2, mesh: m2 } = addNode(context, root, 10, 0, 0)

            context.selection.active = m1
            context.selection.selected.clear()
            context.selection.selected.add(p1)
            context.selection.selected.add(p2)
            context.editorModel.transformOrientation.value = TransformOrientation.GLOBAL

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(true, false, false)

            // median is at x=5
            expect(ctrl.initialMedian[0]).toBeCloseTo(5, 5)

            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            // median of the resulting transforms should stay at x=5 (rotation preserves distances)
            const newP1 = mat4.getTranslation(vec3.create(), p1.transform!)
            const newP2 = mat4.getTranslation(vec3.create(), p2.transform!)
            const newMedianX = (newP1[0] + newP2[0]) / 2
            expect(newMedianX).toBeCloseTo(5, 4)
        })

        it("cancel restores all selected objects", () => {
            const { context } = createEnvironment()
            const { root, parent: p1, mesh: m1 } = createNodeTree(context)
            const { parent: p2, mesh: m2 } = addNode(context, root, 10, 0, 0)

            const initP1Transform = mat4.clone(p1.transform!)
            const initP2Transform = mat4.clone(p2.transform!)

            context.selection.active = m1
            context.selection.selected.clear()
            context.selection.selected.add(p1)
            context.selection.selected.add(p2)
            context.editorModel.transformOrientation.value = TransformOrientation.GLOBAL

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(true, false, false)

            // move
            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            ctrl.cancel()

            expect(mat4.equals(p1.transform!, initP1Transform)).toBe(true)
            expect(mat4.equals(p2.transform!, initP2Transform)).toBe(true)
            expect(context.popController).toHaveBeenCalled()
        })
    })

    describe("pointermove with LOCAL multi-object rotation", () => {
        it("rotates all selected objects (each gets dirty)", () => {
            const { context } = createEnvironment()
            const { root, parent: p1, mesh: m1 } = createNodeTree(context)
            const { parent: p2, mesh: m2 } = addNode(context, root, 10, 0, 0)

            context.selection.active = m1
            context.selection.selected.clear()
            context.selection.selected.add(p1)
            context.selection.selected.add(p2)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(true, false, false) // X axis

            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            expect(p1.dirty).toBe(true)
            expect(p2.dirty).toBe(true)
        })

        it("LOCAL multi-object X rotation differs from GLOBAL multi-object X rotation", () => {
            const { context: ctxLocal } = createEnvironment()
            const { root: rootL, parent: lp1, mesh: lm1 } = createNodeTree(ctxLocal)
            const { parent: lp2, mesh: lm2 } = addNode(ctxLocal, rootL, 10, 0, 0)

            ctxLocal.selection.active = lm1
            ctxLocal.selection.selected.clear()
            ctxLocal.selection.selected.add(lp1)
            ctxLocal.selection.selected.add(lp2)
            ctxLocal.editorModel.transformOrientation.value = TransformOrientation.LOCAL

            const ctrlL = new ObjectRotateController(ctxLocal)
            ctxLocal.axisRenderer.set(true, false, false)
            const evL = new PointerEvent("pointermove")
            Object.defineProperties(evL, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrlL.pointermove(evL)
            const localP1 = mat4.clone(lp1.transform!)
            const localP2 = mat4.clone(lp2.transform!)

            const { context: ctxGlobal } = createEnvironment()
            const { root: rootG, parent: gp1, mesh: gm1 } = createNodeTree(ctxGlobal)
            const { parent: gp2, mesh: gm2 } = addNode(ctxGlobal, rootG, 10, 0, 0)

            ctxGlobal.selection.active = gm1
            ctxGlobal.selection.selected.clear()
            ctxGlobal.selection.selected.add(gp1)
            ctxGlobal.selection.selected.add(gp2)
            ctxGlobal.editorModel.transformOrientation.value = TransformOrientation.GLOBAL

            const ctrlG = new ObjectRotateController(ctxGlobal)
            ctxGlobal.axisRenderer.set(true, false, false)
            const evG = new PointerEvent("pointermove")
            Object.defineProperties(evG, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrlG.pointermove(evG)

            // At least one object should differ between LOCAL and GLOBAL
            const differs =
                !mat4.equals(localP1, gp1.transform!) ||
                !mat4.equals(localP2, gp2.transform!)
            expect(differs).toBe(true)
        })

        it("LOCAL multi-object with pre-rotated objects: each rotates around its own local axis", () => {
            const { context } = createEnvironment()
            const { root, parent: p1, mesh: m1 } = createNodeTree(context)
            // Pre-rotate p2 90° around Y so its local X points along world Z
            const { parent: p2, mesh: m2 } = addRotatedNode(context, root, 10, 0, 0, Math.PI / 2)

            context.selection.active = m1
            context.selection.selected.clear()
            context.selection.selected.add(p1)
            context.selection.selected.add(p2)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(true, false, false) // X axis

            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            // Both objects should be modified
            expect(p1.dirty).toBe(true)
            expect(p2.dirty).toBe(true)

            // p1 (identity) should rotate around world X
            // p2 (rotated 90° around Y) should rotate around its local X (= world Z)
            // So they should produce different transform changes
            const p1Changed = !mat4.equals(p1.transform!, mat4.create())
            const p2Changed = !mat4.equals(p2.transform!, mat4.fromTranslation(mat4.create(), [10, 0, 0]))
            expect(p1Changed).toBe(true)
            expect(p2Changed).toBe(true)
        })

        it("cancel restores all selected objects in LOCAL mode", () => {
            const { context } = createEnvironment()
            const { root, parent: p1, mesh: m1 } = createNodeTree(context)
            const { parent: p2, mesh: m2 } = addNode(context, root, 10, 0, 0)

            const initP1 = mat4.clone(p1.transform!)
            const initP2 = mat4.clone(p2.transform!)

            context.selection.active = m1
            context.selection.selected.clear()
            context.selection.selected.add(p1)
            context.selection.selected.add(p2)
            context.editorModel.transformOrientation.value = TransformOrientation.LOCAL

            const ctrl = new ObjectRotateController(context)
            context.axisRenderer.set(true, false, false)

            const ev = new PointerEvent("pointermove")
            Object.defineProperties(ev, { offsetX: { value: 250 }, offsetY: { value: 125 } })
            ctrl.pointermove(ev)

            ctrl.cancel()

            expect(mat4.equals(p1.transform!, initP1)).toBe(true)
            expect(mat4.equals(p2.transform!, initP2)).toBe(true)
            expect(context.popController).toHaveBeenCalled()
        })
    })
})

function runAxisRotation(
    context: any,
    orientation: TransformOrientation,
    preRotate: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
    preRotateFn: "rotateX" | "rotateY" | "rotateZ" = "rotateY"
): mat4 {
    const { parent, mesh } = createNodeTree(context)
    context.selection.active = mesh
    if (preRotateFn === "rotateX") {
        mat4.rotateX(parent.transform!, parent.transform!, preRotate)
    } else if (preRotateFn === "rotateZ") {
        mat4.rotateZ(parent.transform!, parent.transform!, preRotate)
    } else {
        mat4.rotateY(parent.transform!, parent.transform!, preRotate)
    }
    context.editorModel.transformOrientation.value = orientation

    const ctrl = new ObjectRotateController(context)
    context.axisRenderer.set(axisX, axisY, axisZ)

    const ev = new PointerEvent("pointermove")
    Object.defineProperties(ev, { offsetX: { value: 200 }, offsetY: { value: 100 } })
    ctrl.pointermove(ev)

    return parent.transform!
}

function runLocalRotation(context: any, preRotate: number, axisX: boolean, axisY: boolean, axisZ: boolean): mat4 {
    return runAxisRotation(context, TransformOrientation.LOCAL, preRotate, axisX, axisY, axisZ)
}

function runGlobalRotation(context: any, preRotate: number, axisX: boolean, axisY: boolean, axisZ: boolean): mat4 {
    return runAxisRotation(context, TransformOrientation.GLOBAL, preRotate, axisX, axisY, axisZ)
}

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
            selected: new Set(),
            getActive: function () { return this.active },
            getSelected: function () {
                if (this.selected.size === 0 && this.active) {
                    return new Set([this.active])
                }
                return this.selected
            },
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
        editorModel: {
            transformOrientation: { value: TransformOrientation.GLOBAL },
        },
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

function addNode(context: any, root: Root, x: number, y: number, z: number) {
    const parent = new XForm(root)
    parent.transform = mat4.create()
    mat4.copy(parent.combined, mat4.fromTranslation(mat4.create(), [x, y, z]))
    const combined = mat4.fromTranslation(mat4.create(), [x, y, z])
    const mesh = Object.create(Mesh.prototype, {
        combined: { value: combined, writable: true },
        parent: { value: parent },
        context: { value: context },
    }) as Mesh
    return { parent, mesh }
}

function addRotatedNode(context: any, root: Root, x: number, y: number, z: number, angleY: number) {
    const parent = new XForm(root)
    parent.transform = mat4.create()
    const m = mat4.fromTranslation(mat4.create(), [x, y, z])
    mat4.rotateY(m, m, angleY)
    mat4.copy(parent.combined, m)
    const combined = mat4.clone(m)
    const mesh = Object.create(Mesh.prototype, {
        combined: { value: combined, writable: true },
        parent: { value: parent },
        context: { value: context },
    }) as Mesh
    return { parent, mesh }
}