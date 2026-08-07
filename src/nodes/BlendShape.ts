import { PropertyTab } from 'src/editor/app/PropertyTab'
import { IndyNode, type NodeUiHints } from './IndyNode'
import type { BlendShapeGroup } from './BlendShapeGroup'
import type { mat4 } from 'gl-matrix'

export class BlendShape extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#6387d2",
        icon: "icons.svg#blender-shapekey-data",
        propertyTab: PropertyTab.SHAPE_KEY
    }
    override get name(): string { return this.shapeName }
    override get uihints(): NodeUiHints { return BlendShape.uiHints }

    private shapeName: string
    private filename: string

    constructor(parent: BlendShapeGroup, name: string, filename: string) {
        super(parent)
        this.shapeName = name
        this.filename = filename
    }

    transform?: mat4
}
