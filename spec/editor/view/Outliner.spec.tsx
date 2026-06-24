import { EditorModel } from "src/editor/app/EditorModel"
import { OutlineChevron, Outliner } from "src/editor/view/Outliner"
import type { Context } from "src/gl/Context"
import { Selection } from "src/gl/Selection"
import { Root } from "src/nodes/Root"
import { XForm } from "src/nodes/XForm"
import { NodeTree } from "src/NodeTree"
import { replaceChildren } from "toad.jsx/jsx-runtime"
import { describe, it } from "vitest"

describe("Outliner", () => {
    it("lives again", () => {
        const editorModel = new EditorModel()
        const selection = new Selection(editorModel)
        const nodeTree = new NodeTree()
        const context = {} as Context
        nodeTree.root = new Root(context)
        const xform0 = new XForm(nodeTree.root)

        replaceChildren(document.body, <Outliner model={nodeTree} selection={selection} />)

        console.log(document.body)
    })
})