import type { Context } from "src/gl/Context"
import { IndyNode, type NodeUiHints } from "./IndyNode"
import { PropertyTab } from "src/editor/app/PropertyTab"

export class Root extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#6387d2",
        icon: "icons.svg#blender-collection",
        propertyTab: PropertyTab.OBJECT
    }
    override get name(): string { return this.constructor.name }
    override get uihints(): NodeUiHints { return Root.uiHints }

    constructor(context: Context) {
        super(undefined as any)
        this.context = context
    }
}
