import { EditorModel } from "src/editor/app/EditorModel"
import { Outliner } from "src/editor/view/Outliner"
import { Selection } from "src/gl/Selection"
import { Root } from "src/nodes/Root"
import { XForm } from "src/nodes/XForm"
import { NodeTree } from "src/NodeTree"
import { replaceChildren } from "toad.jsx/jsx-runtime"
import { describe, expect, it } from "vitest"
import { page } from "vitest/browser"
import { fit } from "../../spec"

describe("Outliner", () => {
    const outliner = new OutlinerWebDriver()

    describe("HUMAN generated tests", () => {
        fit("renders all items of the node tree, indented by depth", async () => {
            const { selection, nodeTree } = setupScene()
            const xform0 = new XForm(nodeTree.root)
            xform0.objectName = "xform0"
            const xform1 = new XForm(xform0)
            xform1.objectName = "xform1"
            const xform2 = new XForm(nodeTree.root)
            xform2.objectName = "xform2"
            const xform3 = new XForm(xform2)
            xform3.objectName = "xform3"

            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

            await outliner.expectToHaveItemsInOrder([
                [0, "Crate"],
                [1, "xform0"],
                [2, "xform1"],
                [1, "xform2"],
                [2, "xform3"]
            ])
        })

        // marks selected and active items in selection
        // changes selection on click
        // * while it's SHIFT in the 3D view to add to the selection,
        //   it is CTRL in the outliner
        // * selecting a Mesh (data in blender terminology), selects the next XForm parent (object in blender terminology)

        // LATER
        // * SHIFT is used to select a range
        // * keyboard up/down
        // * keyboard left/right to open/close
    })

    describe("LLM generated tests", () => {

        it("renders the scene root as 'Crate'", async () => {
            const { selection, nodeTree } = setupScene()
            new XForm(nodeTree.root)
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.expectItem("Crate")
        })

        it("displays XForm nodes with their constructor name when unnamed", async () => {
            const { selection, nodeTree } = setupScene()
            new XForm(nodeTree.root)
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.expectItem("XForm")
        })

        it("shows an XForm's objectName when set", async () => {
            const { selection, nodeTree } = setupScene()
            const xform = new XForm(nodeTree.root)
            xform.objectName = "Cube"
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.expectItem("Cube")
        })

        it("renders nested parent-child-grandchild hierarchy", async () => {
            const { selection, nodeTree } = setupScene()
            const parent = new XForm(nodeTree.root)
            parent.objectName = "Parent"
            const child = new XForm(parent)
            child.objectName = "Child"
            const grandchild = new XForm(child)
            grandchild.objectName = "Grandchild"
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.expectItem("Grandchild")
            await outliner.expectItemCount(4)
        })

        it("shows a chevron next to nodes that have children", async () => {
            const { selection, nodeTree } = setupScene()
            const parent = new XForm(nodeTree.root)
            parent.objectName = "Parent"
            new XForm(parent)
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.expectItemHasChevron("Parent")
        })

        it("does not show a chevron for leaf nodes", async () => {
            const { selection, nodeTree } = setupScene()
            const leaf = new XForm(nodeTree.root)
            leaf.objectName = "Leaf"
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.expectItemHasNoChevron("Leaf")
        })

        it("selects a node when clicked, marking it active", async () => {
            const { selection, nodeTree } = setupScene()
            const xform = new XForm(nodeTree.root)
            xform.objectName = "Cube"
            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)
            await outliner.clickItem("Cube")
            await outliner.expectItemIsActive("Cube")
        })

        it("moves the active highlight when clicking a different node", async () => {
            const { selection, nodeTree } = setupScene()
            const a = new XForm(nodeTree.root)
            a.objectName = "A"
            const b = new XForm(nodeTree.root)
            b.objectName = "B"

            replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

            await outliner.clickItem("A")
            await outliner.clickItem("B")
            await outliner.expectItemIsActive("B")
            await outliner.expectItemIsNotActive("A")
        })
    })
})

interface OutlinerDSL {
    clickItem(name: string): Promise<void>
    expectItem(name: string): Promise<void>
    expectItemCount(count: number): Promise<void>
    expectItemHasChevron(name: string): Promise<void>
    expectItemHasNoChevron(name: string): Promise<void>
    expectItemIsActive(name: string): Promise<void>
    expectItemIsNotActive(name: string): Promise<void>
}

class OutlinerWebDriver implements OutlinerDSL {
    private findItem(name: string) {
        const items = document.querySelectorAll<HTMLElement>(".outliner .item")
        return Array.from(items).find(el => el.textContent?.trim().includes(name)) ?? null
    }

    async clickItem(name: string) {
        const el = this.findItem(name)
        await page.elementLocator(el!).click()
    }

    async expectItem(name: string) {
        await expect.poll(() => this.findItem(name)).toBeTruthy()
    }

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

    async expectItemCount(count: number) {
        await expect.poll(() => document.querySelectorAll(".outliner .item").length).toBe(count)
    }

    async expectItemHasChevron(name: string) {
        const el = this.findItem(name)
        await expect.poll(() => el!.querySelector('svg path[d="M 5 3 l 5 5 l -5 5"]')).toBeTruthy()
    }

    async expectItemHasNoChevron(name: string) {
        const el = this.findItem(name)
        expect(el!.querySelector('svg path[d="M 5 3 l 5 5 l -5 5"]')).toBeNull()
    }

    async expectItemIsActive(name: string) {
        const el = this.findItem(name)
        await expect.poll(() => el!.classList.contains("active")).toBe(true)
    }

    async expectItemIsNotActive(name: string) {
        const el = this.findItem(name)
        await expect.poll(() => el!.classList.contains("active")).toBe(false)
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