import { PropertyTab } from 'src/editor/app/PropertyTab'
import { IndyNode, type NodeUiHints } from './IndyNode'

export class BlendShapeGroup extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#6387d2",
        icon: "icons.svg#blender-shapekey-data",
        propertyTab: PropertyTab.SHAPE_KEY
    }
    override get name(): string { return this.constructor.name }
    override get uihints(): NodeUiHints { return BlendShapeGroup.uiHints }
}
