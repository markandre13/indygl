import { describe, expect, it } from "vitest"
import { mat4, quat, vec3 } from "gl-matrix"
import { EditorModel } from "src/editor/app/EditorModel"
import { ObjectSelection } from "src/gl/ObjectSelection"
import { XForm } from "src/nodes/XForm"
import { IndyNode, Root } from "src/nodes/IndyNode"
import { deg2rad } from "src/gl/algorithms/deg2rad"


function createObjectTree() {
    const context = {} as any
    const root = new Root()
    root._context = context
    const parent = new XForm(root)
    const active = new IndyNode(parent)
    return { root, parent, active }
}

describe("Selection", () => {
    describe("add()", () => {
        it("syncs model translation from parent transform", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const { parent, active } = createObjectTree()
            parent.transform = mat4.fromTranslation(mat4.create(), [3, 5, 7])

            sel.add(active)

            expect(editor.transform.translation.x.value.toNumber()).to.be.closeTo(3, 0.001)
            expect(editor.transform.translation.y.value.toNumber()).to.be.closeTo(5, 0.001)
            expect(editor.transform.translation.z.value.toNumber()).to.be.closeTo(7, 0.001)
        })

        it("syncs model rotation from parent transform", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const { parent, active } = createObjectTree()
            const m = mat4.create()
            mat4.fromRotationTranslation(m, quat.fromEuler(quat.create(), 30, 45, 60), [0, 0, 0])
            parent.transform = m

            sel.add(active)

            expect(editor.transform.rotation.x.value.toNumber()).to.be.closeTo(30, 1)
            expect(editor.transform.rotation.y.value.toNumber()).to.be.closeTo(45, 1)
            expect(editor.transform.rotation.z.value.toNumber()).to.be.closeTo(60, 1)
        })

        it("initializes lastEuler so transformActive is a no-op on first call", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const { parent, active } = createObjectTree()
            parent.transform = mat4.create()
            sel.add(active)

            // transformActive already ran via signal during add() → update().
            // The object should still be at identity.
            const m = parent.transform!
            const pos = mat4.getTranslation(vec3.create(), m)
            expect(pos[0]).to.be.closeTo(0, 0.001)
            expect(pos[1]).to.be.closeTo(0, 0.001)
            expect(pos[2]).to.be.closeTo(0, 0.001)
        })

        it("does not mutate the previously active object's transform", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const context = {} as any
            const root = new Root()
            root._context = context

            const parentA = new XForm(root)
            const activeA = new IndyNode(parentA)
            const mA = mat4.create()
            mat4.translate(mA, mA, [10, 0, 0])
            mat4.rotateY(mA, mA, deg2rad(45))
            parentA.transform = mA

            const parentB = new XForm(root)
            const activeB = new IndyNode(parentB)
            parentB.transform = mat4.create()

            sel.add(activeA)
            const capturedA = mat4.clone(parentA.transform!)

            sel.add(activeB)

            expect(mat4.equals(capturedA, parentA.transform!)).toBe(true)
        })
    })

    describe("cross-object selection", () => {
        it("switches model values between objects with different rotations", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const context = {} as any
            const root = new Root()
            root._context = context

            const parentA = new XForm(root)
            const activeA = new IndyNode(parentA)
            const mA = mat4.create()
            mat4.rotateX(mA, mA, deg2rad(30))
            parentA.transform = mA

            const parentB = new XForm(root)
            const activeB = new IndyNode(parentB)
            const mB = mat4.create()
            mat4.rotateY(mB, mB, deg2rad(45))
            parentB.transform = mB

            sel.add(activeA)
            expect(editor.transform.rotation.x.value.toNumber()).to.be.closeTo(30, 1)

            sel.add(activeB)
            expect(editor.transform.rotation.y.value.toNumber()).to.be.closeTo(45, 1)

            sel.add(activeA)
            expect(editor.transform.rotation.x.value.toNumber()).to.be.closeTo(30, 1)
        })
    })

    describe("gimbal lock elimination", () => {
        it("at Y=270, X and Z rotations produce different local-axis results", () => {
            const editorX = new EditorModel()
            const selX = new ObjectSelection(editorX)
            const { parent: parentX, active: activeX } = createObjectTree()
            parentX.transform = mat4.create()
            selX.add(activeX)
            editorX.transform.rotation.x.value = 10
            editorX.transform.rotation.y.value = 270

            const editorZ = new EditorModel()
            const selZ = new ObjectSelection(editorZ)
            const { parent: parentZ, active: activeZ } = createObjectTree()
            parentZ.transform = mat4.create()
            selZ.add(activeZ)
            editorZ.transform.rotation.z.value = 10
            editorZ.transform.rotation.y.value = 270

            expect(mat4.equals(parentX.transform!, parentZ.transform!)).toBe(false)
        })

        it("accumulates sequential deltas for the same axis", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const { parent, active } = createObjectTree()
            parent.transform = mat4.create()
            sel.add(active)

            editor.transform.rotation.x.value = 10
            editor.transform.rotation.x.value = 20
            editor.transform.rotation.x.value = 30

            sel.updateEditorModelFromActive()
            expect(editor.transform.rotation.x.value.toNumber()).to.be.closeTo(30, 1)
        })

        it("wraps model values through 360deg without large jumps", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const { parent, active } = createObjectTree()
            parent.transform = mat4.create()
            sel.add(active)

            // Initially Z=0. Increment to 358: delta = 358 → normalized to -2°.
            editor.transform.rotation.z.value = 358

            // Increment from 358 to 2: raw delta = -356 → normalized to +4°.
            // Net Z rotation from identity = -2° + 4° = +2°.
            editor.transform.rotation.z.value = 2

            sel.updateEditorModelFromActive()
            // The resulting Z rotation should be ≈2°, not a huge negative number
            expect(editor.transform.rotation.z.value.toNumber()).to.be.closeTo(2, 1)
        })
    })

    describe("update()", () => {
        it("reads parent transform changes back into the model", () => {
            const editor = new EditorModel()
            const sel = new ObjectSelection(editor)
            const { parent, active } = createObjectTree()
            parent.transform = mat4.create()
            sel.add(active)

            // Manually change the parent transform
            const m = mat4.create()
            mat4.translate(m, m, vec3.fromValues(2, 4, 6))
            parent.transform = m
            parent.dirty = true

            sel.updateEditorModelFromActive()

            expect(editor.transform.translation.x.value.toNumber()).to.be.closeTo(2, 0.001)
            expect(editor.transform.translation.y.value.toNumber()).to.be.closeTo(4, 0.001)
            expect(editor.transform.translation.z.value.toNumber()).to.be.closeTo(6, 0.001)
        })
    })
})
