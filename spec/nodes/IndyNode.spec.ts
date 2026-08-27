import { EditorModel } from "src/editor/app/EditorModel"
import { ObjectSelection } from "src/gl/ObjectSelection"
import { XForm } from "src/nodes/XForm"
import { describe, expect, it } from "vitest"
import { NODE_CHANGE, NODE_INSERT, Root, type NodeEvent } from "src/nodes/IndyNode"
import { Mesh } from "src/nodes/Mesh"

describe("IndyNode", () => {
    describe("the Root node's signal emits...", () => {
        it("NodeInsertEvent events when a child is added to the tree", () => {
            const { root } = makeScenario()
            const log: NodeEvent[] = []
            root.signal.add((event) => log.push(event))

            const xform0 = new XForm(root, "xform0")

            expect(log).has.lengthOf(1)
            expect(log[0].type === NODE_INSERT)
            expect(log[0].node === xform0)

            const xform1 = new XForm(xform0, "xform1")

            expect(log).has.lengthOf(2)
            expect(log[1].type === NODE_INSERT)
            expect(log[1].node === xform1)
        })
    })
    describe("viewport visibility", () => {
        it("XForm and Mesh show and showEnabled are true per default", () => {
            const { root } = makeScenario()
            const xform0 = new XForm(root, "xform0")
            const mesh0 = new Mesh(xform0, "mesh0")

            expect(xform0.show).toBe(true)
            expect(xform0.showEnabled).toBe(true)

            expect(mesh0.show).toBe(true)
            expect(mesh0.showEnabled).toBe(true)
        })

        it("XForm parent show=false, causes XForm child to return showEnabled=false", () => {
            const { root } = makeScenario()
            const xform0 = new XForm(root, "xform0")
            const xform1 = new XForm(xform0, "xform1")
            xform0.show = false

            expect(xform0.show).toBe(false)
            expect(xform0.showEnabled).toBe(true)

            expect(xform1.show).toBe(true)
            expect(xform1.showEnabled).toBe(false)
        })

        it("XForm parent show=false, causes Mesh child to return showEnabled=false", () => {
            const { root } = makeScenario()
            const xform0 = new XForm(root, "xform0")
            const mesh0 = new Mesh(xform0, "mesh0")
            xform0.show = false

            expect(xform0.show).toBe(false)
            expect(xform0.showEnabled).toBe(true)

            expect(mesh0.show).toBe(true)
            expect(mesh0.showEnabled).toBe(false)
        })

        it("setting parent XForm show=false will create NodeChangeEvents for xform and children", () => {
            const { root } = makeScenario()

            const xform0 = new XForm(root, "xform0")
            const xform1 = new XForm(xform0, "xform1")
            const mesh0 = new Mesh(xform1, "mesh0")

            const log: NodeEvent[] = []
            root.signal.add((event) => log.push(event))

            xform0.show = false

            expect(log).has.lengthOf(3)
            expect(log[0].type === NODE_CHANGE)
            expect(log[0].node === xform0)
            expect(log[1].type === NODE_CHANGE)
            expect(log[1].node === xform1)
            expect(log[2].type === NODE_CHANGE)
            expect(log[2].node === mesh0)
        })
    })
    // XForm, Mesh and Blendshape have visibility icons
    // we do this via a flag...
    // VIEWPORT_UNDEFINED
    // VIEWPORT_SHOW
    // VIEWPORT_HIDE
    // VIEWPORT_HIDE_INHERITED
})

function makeScenario() {
    const editorModel = new EditorModel()
    const selection = new ObjectSelection(editorModel)
    const context = { selection, invalidate: () => { } } as any
    const root = new Root()
    root._context = context
    return { root }
}