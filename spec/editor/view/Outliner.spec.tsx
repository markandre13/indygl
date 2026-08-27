import { EditorModel } from "src/editor/app/EditorModel"
import { Outliner } from "src/editor/view/Outliner"
import { ObjectSelection } from "src/gl/ObjectSelection"
import { XForm } from "src/nodes/XForm"
import { replaceChildren } from "toad.jsx/jsx-runtime"
import { describe, expect, it } from "vitest"
import { BrowserUser } from "clickclick.js"
import { fit } from "../../spec"
import { Root } from "src/nodes/IndyNode"

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
            const { selection, root, propertyTab } = setupScene1()

            replaceChildren(document.body, <Outliner root={root} objectSelection={selection} propertyTab={propertyTab}/>)

            user.expectToHaveItemsInOrder([
                [0, "Crate"],
                [1, "xform0"],
                [2, "xform1"],
                [1, "xform2"],
                [2, "xform3"]
            ])
        })

        it("selection's active and selected nodes are shown in outliner", async () => {
            const { selection, root, propertyTab } = setupScene1()

            replaceChildren(document.body, <Outliner root={root} objectSelection={selection}  propertyTab={propertyTab}/>)

            selection.add(root.children[0].children[0])
            user.expectItemIsNotActiveOrSelected("Crate")
            user.expectItemIsNotActiveOrSelected("xform0")
            user.expectItemIsActive("xform1")
            user.expectItemIsNotActiveOrSelected("xform2")
            user.expectItemIsNotActiveOrSelected("xform3")

            selection.add(root.children[1].children[0])
            user.expectItemIsNotActiveOrSelected("Crate")
            user.expectItemIsNotActiveOrSelected("xform0")
            user.expectItemIsSelected("xform1")
            user.expectItemIsNotActiveOrSelected("xform2")
            user.expectItemIsActive("xform3")
        })

        // TODO: move more code into OutlinerUser
        // TODO: implement rxcore.ts: untrack()
        // https://docs.solidjs.com/reference/reactive-utilities/untrack
        // untrack executes a function without collecting dependencies from the current reactive scope.
        it("clicking on the chevron rotates it and hides/shows the item's children", () => {
            const { selection, root, propertyTab } = setupScene1()
            replaceChildren(document.body, <Outliner root={root} objectSelection={selection}  propertyTab={propertyTab}/>)

            const chevron = user.findChevron("xform0")!
            const children = user.findIndent("xform")!

            user.move(chevron as any)
            user.click()

            expect(children.style.display).to.equal("none")
            expect(chevron.style.transform).to.equal("")

            user.click()

            expect(children.style.display).to.equal("")
            expect(chevron.style.transform).to.equal("rotate(90deg)")
        })
    })
    describe("behaviour", () => {
        it("LMB sets item as selected while removing others from selection", async () => {
            const { selection, root, propertyTab, xform1 } = setupScene1()
            replaceChildren(document.body, <Outliner root={root} objectSelection={selection}  propertyTab={propertyTab}/>)

            user.moveToItem("xform1")
            user.click()

            expect(selection.getActive()).to.equal(xform1)
            expect(selection.selected).to.contain(xform1)
        })
        it("Ctrl+LMB adds item to selection", async () => {
            const { selection, root, propertyTab, xform1, xform3 } = setupScene1()
            replaceChildren(document.body, <Outliner root={root} objectSelection={selection}  propertyTab={propertyTab}/>)

            user.moveToItem("xform1")
            user.click()
            user.moveToItem("xform3")
            user.ctrlClick()

            expect(selection.getActive()).to.equal(xform3)
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
    findChevron(name: string) {
        const item = this.findItem(name)
        if (item === null) {
            return null
        }
        return item.querySelector("svg")
    }
    findIndent(name: string) {
        const item = this.findItem(name)
        if (item === null) {
            return null
        }
        return item.nextElementSibling as HTMLElement
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
    const selection = new ObjectSelection(editorModel)
    const context = { selection, invalidate: () => { } } as any
    const root = new Root()
    root._context = context
    return { selection, root, propertyTab: editorModel.propertyTab }
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
    const { selection, root, propertyTab } = setupScene()
    const xform0 = new XForm(root)
    xform0.objectName = "xform0"
    const xform1 = new XForm(xform0)
    xform1.objectName = "xform1"
    const xform2 = new XForm(root)
    xform2.objectName = "xform2"
    const xform3 = new XForm(xform2)
    xform3.objectName = "xform3"
    return { selection, root, propertyTab, xform0, xform1, xform2, xform3 }
}