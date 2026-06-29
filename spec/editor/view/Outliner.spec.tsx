import { EditorModel } from "src/editor/app/EditorModel"
import { Outliner } from "src/editor/view/Outliner"
import { Selection } from "src/gl/Selection"
import { Root } from "src/nodes/Root"
import { XForm } from "src/nodes/XForm"
import { NodeTree } from "src/NodeTree"
import { replaceChildren } from "toad.jsx/jsx-runtime"
import { describe, expect, it } from "vitest"
import { BrowserUser } from "../../browseruser/BrowserUser"

// TODO
// [ ] open/close subtree by click on chevron
// [ ] select object instead of mesh, mesh also selects object

// LATER
// * SHIFT is used to select a range
// * keyboard up/down
// * keyboard left/right to open/close

// https://docs.blender.org/manual/en/2.81/editors/outliner.html
// https://docs.blender.org/manual/en/latest/editors/outliner/introduction.html
describe("Outliner", () => {
    const user = new OutlinerUser()

    describe("look", () => {
        it("renders all items of the node tree, indented by depth", async () => {
            const { selection, nodeTree } = setupScene1()

            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

            user.expectToHaveItemsInOrder([
                [0, "Crate"],
                [1, "xform0"],
                [2, "xform1"],
                [1, "xform2"],
                [2, "xform3"]
            ])
        })

        it("selection's active and selected nodes are shown in outliner", async () => {
            const { selection, nodeTree } = setupScene1()

            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

            selection.add(nodeTree.root.children[0].children[0])
            user.expectItemIsNotActiveOrSelected("Crate")
            user.expectItemIsNotActiveOrSelected("xform0")
            user.expectItemIsActive("xform1")
            user.expectItemIsNotActiveOrSelected("xform2")
            user.expectItemIsNotActiveOrSelected("xform3")

            selection.add(nodeTree.root.children[1].children[0])
            user.expectItemIsNotActiveOrSelected("Crate")
            user.expectItemIsNotActiveOrSelected("xform0")
            user.expectItemIsSelected("xform1")
            user.expectItemIsNotActiveOrSelected("xform2")
            user.expectItemIsActive("xform3")
        })
    })
    describe("behaviour", () => {
        it("LMB sets item as selected while removing others from selection", async () => {
            const { selection, nodeTree, xform1 } = setupScene1()
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

            user.moveToItem("xform1")
            user.click()

            expect(selection.active).to.equal(xform1)
            expect(selection.selected).to.contain(xform1)
        })
        it("Ctrl+LMB adds item to selection", async () => {
            const { selection, nodeTree, xform1, xform3 } = setupScene1()
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

            user.moveToItem("xform1")
            user.click()
            user.moveToItem("xform3")
            user.ctrlClick()

            expect(selection.active).to.equal(xform3)
            expect(selection.selected).to.contain(xform1)
            expect(selection.selected).to.contain(xform3)
        })
    })
})

class OutlinerUser extends BrowserUser {
    findItem(name: string) {
        const items = document.querySelectorAll<HTMLElement>(".item")
        return Array.from(items).find(el => el.textContent?.trim().includes(name)) ?? null
    }

    moveToItem(name: string) {
        const item = this.findItem(name)
        if (item === null) {
            throw Error("item not found")
        }
        this.move(item!)
    }

    //
    // verify look
    //

    expectToHaveItemsInOrder(indentAndName: [number, string][]) {
        const items = document.querySelectorAll<HTMLElement>(".item")
        expect(indentAndName.length).to.equal(items.length)
        for (let i = 0; i < items.length; ++i) {
            const paddingLeft = parseInt(items[i].style.paddingLeft)
            const indent = Math.floor(paddingLeft / 20)
            expect(indent, `at index ${i}`).to.equal(indentAndName[i][0])
            expect(items[i], `at index ${i}`).toHaveTextContent(indentAndName[i][1])
        }
    }

    expectItemIsActive(name: string) {
        const el = this.findItem(name)
        expect(el!.classList.contains("active")).toBe(true)
    }

    expectItemIsNotActive(name: string) {
        const el = this.findItem(name)
        expect(el!.classList.contains("active")).toBe(false)
    }

    expectItemIsSelected(name: string) {
        const el = this.findItem(name)
        expect(el!.classList.contains("selected")).toBe(true)
    }

    expectItemIsNotActiveOrSelected(name: string) {
        const el = this.findItem(name)
        expect(el!.classList.contains("active") || el!.classList.contains("selected")).toBe(false)
    }
}

function setupScene() {
    const editorModel = new EditorModel()
    const selection = new Selection(editorModel)
    const nodeTree = new NodeTree()
    const context = { selection, invalidate: () => { } } as any
    nodeTree.root = new Root(context)
    return { selection, nodeTree }
}

/**
 * provides the following node tree
 * ```
 * Root
 *   xform0
 *     xform1
 *   xform2
 *     xform3
 * ```
 */
function setupScene1() {
    const { selection, nodeTree } = setupScene()
    const xform0 = new XForm(nodeTree.root)
    xform0.objectName = "xform0"
    const xform1 = new XForm(xform0)
    xform1.objectName = "xform1"
    const xform2 = new XForm(nodeTree.root)
    xform2.objectName = "xform2"
    const xform3 = new XForm(xform2)
    xform3.objectName = "xform3"
    return { selection, nodeTree, xform0, xform1, xform2, xform3 }
}